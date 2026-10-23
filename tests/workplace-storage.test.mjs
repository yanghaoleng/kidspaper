import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { workSample } from "../src/workplace/sample.js";
import {
  saveIssue,
  getIssues,
  exportIssue,
  importIssue,
  removeIssue,
} from "../src/workplace/storage.js";
import { getIssues as getFamilyIssues } from "../src/storage.js";
let downloaded;
globalThis.document = {
  createElement: () => ({
    click() {
      downloaded = this.href;
    },
  }),
};
test("work archives use a separate store and encrypted format, including drafts and images", async () => {
  const draft = {
    ...structuredClone(workSample),
    id: "work-draft-test",
    report: null,
    answers: [],
  };
  await saveIssue(draft);
  assert.equal(
    (await getIssues()).some((issue) => issue.id === draft.id),
    true,
  );
  assert.equal(
    (await getFamilyIssues()).some((issue) => issue.id === draft.id),
    false,
  );
  const issue = {
    ...structuredClone(workSample),
    id: "work-encryption-test",
    images: { 0: "data:image/png;base64,aGVsbG8=" },
    portrait: {
      image: "data:image/png;base64,aGVsbG8=",
      description: "产品设计师 · 整理工作线索的场景",
    },
  };
  await exportIssue(issue, "partner-test-password");
  const text = await (await fetch(downloaded)).text();
  assert.equal(text.includes(issue.profile.nickname), false);
  assert.equal(text.includes(issue.report.title), false);
  const file = { size: text.length, text: async () => text };
  await assert.rejects(() => importIssue(file, "incorrect"), /密码不对/);
  assert.deepEqual(await importIssue(file, "partner-test-password"), issue);
  await assert.rejects(
    () =>
      importIssue(
        { size: 2, text: async () => '{"format":"kidspaper-encrypted-v1"}' },
        "partner-test-password",
      ),
    /同路人/,
  );
  await removeIssue(draft.id);
  await removeIssue(issue.id);
});
