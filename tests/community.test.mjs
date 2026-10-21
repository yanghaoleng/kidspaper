import test from "node:test";
import assert from "node:assert/strict";
import {
  communityStories,
  dailyStories,
  editionKey,
  translatedStory,
} from "../shared/community.mjs";
test("daily globe selection is shared across timezones and rolls over at UTC midnight", () => {
  const a = new Date("2026-10-21T23:59:59Z"),
    b = new Date("2026-10-22T00:00:00Z");
  const ids = (date) => dailyStories(date).map((s) => s.id);
  assert.equal(editionKey(new Date("2026-10-22T07:59:59+08:00")), "2026-10-21");
  assert.deepEqual(ids(a), ids(new Date("2026-10-22T07:59:59+08:00")));
  assert.equal(new Set(ids(a)).size, 12);
  assert.notDeepEqual(ids(a), ids(b));
  assert.equal(
    ids(b).some((id) => !ids(a).includes(id)),
    true,
  );
  for (let n = 0; n < 32; n++)
    assert.equal(new Set(ids(new Date(Date.UTC(2026, 9, n + 1)))).size, 12);
});
test("pretranslated papers keep original child quotes separate from reading translations", () => {
  const s = communityStories.find((s) => s.id === "moon");
  assert.match(s.originalQuote, /月/);
  assert.equal(
    translatedStory(s, "zh").quote,
    "我想给月亮做一床被子，因为它看起来很冷。",
  );
  assert.match(translatedStory(s, "en").quote, /blanket/);
  assert.equal(translatedStory(s, "fr"), null);
  assert.equal(
    new Set(communityStories.map((s) => s.id)).size,
    communityStories.length,
  );
});
