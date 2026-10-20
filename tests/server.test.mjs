import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sample } from "../src/sample.js";
import { archiveSchema, checkEvidence } from "../shared/schema.mjs";
const listen = (s) =>
  new Promise((r) => s.listen(0, "127.0.0.1", () => r(s.address().port)));
test("report evidence must point to a child original answer", () => {
  assert.equal(checkEvidence(sample.report, sample.answers), true);
  const r = structuredClone(sample.report);
  r.observations[0].evidence = ["support"];
  assert.equal(checkEvidence(r, sample.answers), false);
  r.observations[0].evidence = ["invented"];
  assert.equal(checkEvidence(r, sample.answers), false);
});
test("archives reject missing report sections and invalid age groups", () => {
  assert.equal(archiveSchema.safeParse(sample).success, true);
  assert.equal(
    archiveSchema.safeParse({ ...sample, answers: [], report: null }).success,
    true,
  );
  assert.equal(
    archiveSchema.safeParse({
      ...sample,
      profile: { ...sample.profile, age: "2岁" },
    }).success,
    false,
  );
  assert.equal(
    archiveSchema.safeParse({ ...sample, report: { title: "bad" } }).success,
    false,
  );
});
test("API consent, cross-origin, input, report provenance, and private static boundaries", async (t) => {
  let calls = 0,
    badEvidence = false;
  const upstream = http.createServer(async (req, res) => {
    calls++;
    let raw = "";
    for await (const c of req) raw += c;
    const body = JSON.parse(raw);
    assert.equal(req.headers.authorization, "Bearer test-key");
    assert.equal(body.model, "test-model");
    const content = body.messages[0].content;
    let result;
    if (content.includes("制作一份")) {
      assert.equal(
        JSON.parse(body.messages[1].content).answers.every(
          (a) => a.who === "child",
        ),
        true,
      );
      result = structuredClone(sample.report);
      if (badEvidence) result.observations[0].evidence = ["support"];
    } else
      result = {
        reflection: "我听见了花园。",
        question: "你想邀请谁？",
        parentTip: "给孩子一点时间。",
      };
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(result) } }],
      }),
    );
  });
  const upstreamPort = await listen(upstream);
  const placeholder = http.createServer();
  const port = await listen(placeholder);
  await new Promise((r) => placeholder.close(r));
  const dir = mkdtempSync(join(tmpdir(), "kidspaper-test-"));
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      ARK_API_KEY: "test-key",
      ARK_BASE_URL: `http://127.0.0.1:${upstreamPort}`,
      ARK_TEXT_MODEL: "test-model",
      PORT: String(port),
      DATA_DIR: dir,
      SESSION_SECRET: "test-secret-at-least-32-characters",
      ALLOWED_ORIGINS: "https://example.test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    child.kill();
    await new Promise((r) => upstream.close(r));
    rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    child.stdout.on("data", (c) => {
      if (c.toString().includes("ready")) resolve();
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error("Server exited " + code)));
  });
  const root = `http://127.0.0.1:${port}/kidspaper`;
  const post = (path, body, cookie = "", origin = "https://example.test") =>
    fetch(root + "/api/" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: origin,
      },
      body: JSON.stringify(body),
    });
  assert.equal((await post("session", { guardianConsent: false })).status, 400);
  assert.equal(
    (await post("session", { guardianConsent: true }, "", "https://evil.test"))
      .status,
    403,
  );
  assert.equal((await post("report", sample)).status, 401);
  const s = await post("session", { guardianConsent: true });
  assert.equal(s.status, 200);
  const cookie = s.headers.get("set-cookie").split(";")[0];
  assert.match(s.headers.get("set-cookie"), /HttpOnly/);
  assert.match(s.headers.get("set-cookie"), /SameSite=Strict/);
  const context = { profile: sample.profile, answers: sample.answers };
  assert.equal(
    (
      await post(
        "report",
        { ...context, answers: sample.answers.slice(0, 2) },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);
  assert.equal(
    (
      await post(
        "transcribe",
        { audio: Buffer.from("not wav").toString("base64") },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);
  const follow = await post("followup", context, cookie);
  assert.equal(follow.status, 200);
  assert.equal((await follow.json()).question, "你想邀请谁？");
  const good = await post("report", context, cookie);
  assert.equal(good.status, 200);
  assert.equal((await good.json()).report.title, sample.report.title);
  assert.equal(good.headers.get("cache-control"), "no-store");
  badEvidence = true;
  assert.equal((await post("report", context, cookie)).status, 502);
  for (const p of ["/.env", "/server/index.mjs", "/package.json"])
    assert.equal((await fetch(root + p)).status, 404);
  assert.equal((await fetch(root + "/api/health")).status, 200);
});
