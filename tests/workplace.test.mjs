import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { workSample, workStories } from "../src/workplace/sample.js";
import {
  workArchiveSchema,
  workContextSchema,
  checkWorkEvidence,
} from "../shared/workplace.mjs";

const listen = (server) =>
  new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve(server.address().port)),
  );
test("adult archives preserve original answers and require evidence from this reflection", () => {
  assert.equal(workArchiveSchema.safeParse(workSample).success, true);
  assert.equal(checkWorkEvidence(workSample.report, workSample.answers), true);
  const report = structuredClone(workSample.report);
  report.observations[0].evidence = ["unrecorded"];
  assert.equal(checkWorkEvidence(report, workSample.answers), false);
  assert.equal(
    workContextSchema.safeParse({
      profile: workSample.profile,
      answers: [workSample.answers[0], workSample.answers[0]],
    }).success,
    false,
  );
  assert.equal(
    workArchiveSchema.safeParse({ ...workSample, version: 1 }).success,
    false,
  );
  assert.equal(
    new Set(workStories.map((story) => story.id)).size,
    workStories.length,
  );
});

test("separate workplace API: adult consent, isolated routes, minimum answers, evidence and model context", async (t) => {
  let calls = 0,
    badEvidence = false;
  const upstream = http.createServer(async (req, res) => {
    calls++;
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw),
      prompt = body.messages[0].content,
      input = JSON.parse(body.messages[1].content);
    assert.match(prompt, /成年用户/);
    assert.doesNotMatch(prompt, /服务4至10岁|亲子共创/);
    assert.equal(body.model, "test-work-model");
    let result;
    if (prompt.includes("职场人物报")) {
      assert.ok(input.answers.length >= 4);
      result = structuredClone(workSample.report);
      if (badEvidence) result.observations[0].evidence = ["unrecorded"];
    } else if (prompt.includes("私人复盘档案")) {
      assert.equal(input.messages.length, 1);
      result = "档案里记录了你希望保留完整工作时间，可以从一次优先级对齐开始。";
    } else {
      assert.equal(input.answer.id, "proud");
      assert.equal("answers" in input, false);
      result = {
        reflection: "你用流程图让分歧变得可见。",
        question: "下一次你想怎样提前验证共识？",
      };
    }
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                typeof result === "string" ? result : JSON.stringify(result),
            },
          },
        ],
      }),
    );
  });
  const upstreamPort = await listen(upstream),
    placeholder = http.createServer(),
    port = await listen(placeholder);
  await new Promise((resolve) => placeholder.close(resolve));
  const dir = mkdtempSync(join(tmpdir(), "partner-test-"));
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      APP_EDITION: "workplace",
      ARK_API_KEY: "test-key",
      ARK_BASE_URL: `http://127.0.0.1:${upstreamPort}`,
      ARK_TEXT_MODEL: "test-work-model",
      PORT: String(port),
      DATA_DIR: dir,
      SESSION_SECRET: "separate-test-session-secret-32-chars",
      ALLOWED_ORIGINS: "https://partner.example.test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    child.kill();
    await new Promise((resolve) => upstream.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    child.stdout.on("data", (data) => {
      if (data.toString().includes("ready")) resolve();
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error("Server exited " + code)));
  });
  const root = `http://127.0.0.1:${port}`;
  const post = (
    path,
    body,
    cookie = "",
    origin = "https://partner.example.test",
  ) =>
    fetch(root + "/api/" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: origin,
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await (await fetch(root + "/api/health")).json()).edition,
    "workplace",
  );
  assert.equal((await post("session", { guardianConsent: true })).status, 400);
  assert.equal((await post("work/report", workSample)).status, 401);
  assert.equal(
    (await post("session", { dataConsent: true }, "", "https://other.test"))
      .status,
    403,
  );
  const session = await post("session", { dataConsent: true });
  const cookie = session.headers.get("set-cookie").split(";")[0];
  assert.match(cookie, /^partner_session=/);
  assert.match(session.headers.get("set-cookie"), /Path=\//);
  assert.equal((await post("report", workSample, cookie)).status, 404);
  assert.equal(
    (
      await post(
        "work/report",
        { ...workSample, answers: workSample.answers.slice(0, 3) },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await post(
        "work/report",
        { ...workSample, answers: Array(4).fill(workSample.answers[0]) },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);
  const follow = await post(
    "work/followup",
    { profile: workSample.profile, answers: [workSample.answers[0]] },
    cookie,
  );
  assert.equal(follow.status, 200);
  assert.match((await follow.json()).question, /共识/);
  const report = await post("work/report", workSample, cookie);
  assert.equal(report.status, 200);
  assert.deepEqual((await report.json()).report, workSample.report);
  assert.equal(
    (
      await post(
        "work/report",
        { ...workSample, answers: workSample.answers.slice(0, 4) },
        cookie,
      )
    ).status,
    502,
  );
  badEvidence = true;
  assert.equal((await post("work/report", workSample, cookie)).status, 400);
  const memory = await post(
    "work/memory",
    { ...workSample, messages: [{ role: "user", content: "我想先试什么？" }] },
    cookie,
  );
  assert.equal(memory.status, 200);
  assert.match((await memory.json()).text, /优先级/);
  assert.equal((await fetch(root + "/.env")).status, 404);
  assert.equal((await fetch(root + "/api/workplace.mjs")).status, 404);
});
