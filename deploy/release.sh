#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Target-specific: run only after verifying mikeywa-rive-old still hosts mikeywa.site.
KIDSPAPER_HOST=${KIDSPAPER_HOST:-mikeywa-rive-old}
KIDSPAPER_RELEASE="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
KIDSPAPER_PACKAGE_DIR=$(mktemp -d /tmp/kidspaper-release.XXXXXX)
KIDSPAPER_PACKAGE="$KIDSPAPER_PACKAGE_DIR/release.tar.gz"
npm test
npm run build
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$KIDSPAPER_PACKAGE" dist dist-server server shared deploy package.json package-lock.json LICENSE README.md docs
shasum -a 256 "$KIDSPAPER_PACKAGE"
scp "$KIDSPAPER_PACKAGE" "$KIDSPAPER_HOST:/tmp/kidspaper-$KIDSPAPER_RELEASE.tar.gz"
ssh "$KIDSPAPER_HOST" "bash -s -- '$KIDSPAPER_RELEASE'" <<'REMOTE'
set -euo pipefail
release=$1
root=/opt/kidspaper
backup=/opt/kidspaper/config-backups/$release
sudo mkdir -p "$root/releases/$release" "$backup"
sudo tar -xzf "/tmp/kidspaper-$release.tar.gz" -C "$root/releases/$release"
sudo chown -R root:root "$root/releases/$release"
sudo chmod -R a+rX "$root/releases/$release"
cd "$root/releases/$release"
sudo test -s dist-server/server.cjs
sudo test -s /etc/kidspaper/kidspaper.env
sudo test -s dist/index.html
sudo node --check dist-server/server.cjs
previous=""
if [ -e "$root/current" ]; then previous=$(readlink -f "$root/current"); fi
nginx_file=$(readlink -f /etc/nginx/sites-enabled/mikeywa.site)
sudo cp -a "$nginx_file" "$backup/mikeywa.site"
if sudo test -f /etc/nginx/snippets/kidspaper.conf; then sudo cp -a /etc/nginx/snippets/kidspaper.conf "$backup/kidspaper.conf"; fi
if sudo test -f /etc/systemd/system/kidspaper.service; then sudo cp -a /etc/systemd/system/kidspaper.service "$backup/kidspaper.service"; fi
before=$(curl -fsS https://mikeywa.site/ | sha256sum | cut -d ' ' -f1)
rollback() {
    echo 'Verification failed; restoring previous app and web configuration.' >&2
    sudo cp -a "$backup/mikeywa.site" "$nginx_file"
    if sudo test -f "$backup/kidspaper.conf"; then sudo cp -a "$backup/kidspaper.conf" /etc/nginx/snippets/kidspaper.conf; else sudo rm -f /etc/nginx/snippets/kidspaper.conf; fi
    if sudo test -f "$backup/kidspaper.service"; then sudo cp -a "$backup/kidspaper.service" /etc/systemd/system/kidspaper.service; fi
    if [ -n "$previous" ] && [ "$previous" != "$root/current" ]; then
        sudo ln -sfn "$previous" "$root/current.rollback"
        sudo mv -Tf "$root/current.rollback" "$root/current"
        sudo systemctl daemon-reload
        sudo systemctl restart kidspaper
    else
        sudo systemctl stop kidspaper || true
    fi
    sudo nginx -t && sudo systemctl reload nginx
}
trap rollback ERR
sudo install -m 644 deploy/kidspaper.nginx.conf /etc/nginx/snippets/kidspaper.conf
sudo python3 - "$nginx_file" <<'PY'
import sys
from pathlib import Path
p=Path(sys.argv[1]);s=p.read_text()
line='    include /etc/nginx/snippets/kidspaper.conf;'
if line not in s:
    marker='    root /var/www/mikeywa-site/current;'
    if s.count(marker)!=1: raise SystemExit('Unexpected Nginx host layout; refusing to change')
    s=s.replace(marker,marker+'\n'+line,1);p.write_text(s)
PY
sudo install -m 644 deploy/kidspaper.service /etc/systemd/system/kidspaper.service
sudo nginx -t
sudo ln -sfn "$root/releases/$release" "$root/current.next"
sudo mv -Tf "$root/current.next" "$root/current"
sudo systemctl daemon-reload
sudo systemctl enable kidspaper
sudo systemctl restart kidspaper
for attempt in 1 2 3 4 5; do
    if curl -fsS http://127.0.0.1:8816/kidspaper/api/health >/dev/null; then break; fi
    sleep 1
done
curl -fsS http://127.0.0.1:8816/kidspaper/api/health
sudo systemctl reload nginx
curl -fsS https://mikeywa.site/kidspaper/api/health
curl -fsS https://mikeywa.site/kidspaper/ | cmp - dist/index.html
after=$(curl -fsS https://mikeywa.site/ | sha256sum | cut -d ' ' -f1)
test "$before" = "$after"
sudo systemctl is-active kidspaper nginx
sudo python3 - "$root" "$release" "$previous" <<'PY'
from pathlib import Path
import json,sys,datetime
p=Path(sys.argv[1])/'release-history.json'
items=json.loads(p.read_text()) if p.exists() else []
items.append({'release':sys.argv[2],'previous':sys.argv[3] or None,'verified_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':'https://mikeywa.site/kidspaper/'})
p.write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
PY
trap - ERR
readlink -f "$root/current"
echo "Deployed $release; previous: ${previous:-none}"
REMOTE
