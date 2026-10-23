#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Dedicated sibling deployment; never switches the Kidspaper release.
PARTNER_HOST=${PARTNER_HOST:-mikeywa-rive-old}
PARTNER_RELEASE="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
PARTNER_PACKAGE_DIR=$(mktemp -d /tmp/partner-release.XXXXXX)
trap 'rm -rf "$PARTNER_PACKAGE_DIR"' EXIT
npm test
npm run build:workplace
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$PARTNER_PACKAGE_DIR/release.tar.gz" dist-workplace dist-server deploy package.json LICENSE README.md docs
scp "$PARTNER_PACKAGE_DIR/release.tar.gz" "$PARTNER_HOST:/tmp/partner-$PARTNER_RELEASE.tar.gz"
ssh "$PARTNER_HOST" "bash -s -- '$PARTNER_RELEASE'" <<'REMOTE'
set -euo pipefail
release=$1
root=/opt/partner
site=/etc/nginx/sites-available/partner.mikeywa.site
enabled=/etc/nginx/sites-enabled/partner.mikeywa.site
backup=$root/config-backups/$release
previous=""
if [ -e "$root/current" ]; then previous=$(readlink -f "$root/current"); fi
if [ -z "$previous" ] && sudo ss -ltnH 'sport = :8817' | grep -q .; then
    echo 'Port 8817 is already in use; refusing to replace another service.' >&2
    exit 1
fi
before=$(curl -fsS https://mikeywa.site/kidspaper/ | sha256sum | cut -d ' ' -f1)
sudo mkdir -p "$root/releases/$release" "$backup" /etc/partner /var/lib/letsencrypt
sudo tar -xzf "/tmp/partner-$release.tar.gz" -C "$root/releases/$release"
sudo chmod -R a+rX "$root/releases/$release"
cd "$root/releases/$release"
sudo node --check dist-server/server.cjs
if sudo test -f "$site"; then sudo cp -a "$site" "$backup/nginx.conf"; fi
if sudo test -f /etc/systemd/system/partner.service; then sudo cp -a /etc/systemd/system/partner.service "$backup/partner.service"; fi
if ! id partner >/dev/null 2>&1; then sudo useradd --system --home /var/lib/partner --shell /usr/sbin/nologin partner; fi
sudo install -d -m 700 -o partner -g partner /var/lib/partner
if ! sudo test -s /etc/partner/partner.env; then
    sudo python3 - <<'PY'
from pathlib import Path
import secrets
source = Path('/etc/kidspaper/kidspaper.env').read_text().splitlines()
keys = {'ARK_API_KEY', 'ARK_BASE_URL', 'ARK_TEXT_MODEL', 'ARK_AUDIO_MODEL', 'ARK_IMAGE_MODEL'}
lines = [line for line in source if line.split('=', 1)[0] in keys]
if not any(line.startswith('ARK_API_KEY=') for line in lines):
    raise SystemExit('Existing AI key configuration is missing')
lines += ['PORT=8817', 'APP_EDITION=workplace', 'ALLOWED_ORIGINS=https://partner.mikeywa.site',
          'DATA_DIR=/var/lib/partner', 'SESSION_SECRET=' + secrets.token_hex(32),
          'DAILY_TEXT_LIMIT=300', 'DAILY_IMAGE_LIMIT=20']
path = Path('/etc/partner/partner.env')
path.write_text('\n'.join(lines) + '\n')
path.chmod(0o600)
PY
fi
rollback() {
    echo 'Verification failed; restoring previous Partner app and configuration.' >&2
    if sudo test -f "$backup/nginx.conf"; then sudo cp -a "$backup/nginx.conf" "$site"; else sudo rm -f "$enabled" "$site"; fi
    if sudo test -f "$backup/partner.service"; then sudo cp -a "$backup/partner.service" /etc/systemd/system/partner.service; fi
    if [ -n "$previous" ]; then
        sudo ln -sfn "$previous" "$root/current.rollback"
        sudo mv -Tf "$root/current.rollback" "$root/current"
        sudo systemctl daemon-reload
        sudo systemctl restart partner
    else
        sudo systemctl disable --now partner || true
    fi
    sudo nginx -t && sudo systemctl reload nginx
}
trap rollback ERR
if ! sudo test -s /etc/letsencrypt/live/partner.mikeywa.site/fullchain.pem; then
    sudo tee "$site" >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name partner.mikeywa.site;
    access_log off;
    location ^~ /.well-known/acme-challenge/ { root /var/lib/letsencrypt; }
    location / { return 503; }
}
NGINX
    sudo ln -sfn "$site" "$enabled"
    sudo nginx -t
    sudo systemctl reload nginx
    sudo certbot certonly --webroot -w /var/lib/letsencrypt -d partner.mikeywa.site --non-interactive --keep-until-expiring
fi
sudo install -m 644 deploy/partner.service /etc/systemd/system/partner.service
sudo install -m 644 deploy/partner.nginx.conf "$site"
sudo ln -sfn "$site" "$enabled"
sudo nginx -t
sudo ln -sfn "$root/releases/$release" "$root/current.next"
sudo mv -Tf "$root/current.next" "$root/current"
sudo systemctl daemon-reload
sudo systemctl enable partner
sudo systemctl restart partner
for attempt in 1 2 3 4 5; do
    if curl -fsS http://127.0.0.1:8817/api/health >/dev/null 2>&1; then break; fi
    sleep 1
done
curl -fsS http://127.0.0.1:8817/api/health
sudo systemctl reload nginx
curl -fsS https://partner.mikeywa.site/api/health
curl -fsS https://partner.mikeywa.site/ | cmp - dist-workplace/index.html
after=$(curl -fsS https://mikeywa.site/kidspaper/ | sha256sum | cut -d ' ' -f1)
test "$before" = "$after"
sudo systemctl is-active partner kidspaper nginx
sudo python3 - "$root" "$release" "$previous" <<'PY'
from pathlib import Path
import json, sys, datetime
p = Path(sys.argv[1]) / 'release-history.json'
items = json.loads(p.read_text()) if p.exists() else []
items.append({'release': sys.argv[2], 'previous': sys.argv[3] or None,
              'verified_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'url': 'https://partner.mikeywa.site/'})
p.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n')
PY
sudo rm -f "/tmp/partner-$release.tar.gz"
trap - ERR
echo "Deployed $release; previous: ${previous:-none}"
REMOTE
