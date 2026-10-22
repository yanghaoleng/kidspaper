import test from "node:test";
import assert from "node:assert/strict";
import {
  communityStories,
  communityRegions,
  DAILY_PAPER_COUNT,
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
  assert.equal(new Set(ids(a)).size, DAILY_PAPER_COUNT);
  assert.notDeepEqual(ids(a), ids(b));
  assert.equal(
    ids(b).some((id) => !ids(a).includes(id)),
    true,
  );
  for (let n = 0; n < 32; n++)
    assert.equal(
      new Set(ids(new Date(Date.UTC(2026, 9, n + 1)))).size,
      DAILY_PAPER_COUNT,
    );
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

test("every daily edition covers all editorial regions with complete fictional reports", () => {
  assert.equal(communityStories.length, 32);
  assert.ok(communityRegions.length >= 20);
  const encountered = new Set();
  for (let day = 1; day <= 366; day++) {
    const stories = dailyStories(new Date(Date.UTC(2026, 0, day)));
    assert.equal(stories.length, DAILY_PAPER_COUNT);
    assert.deepEqual(
      new Set(stories.map((s) => s.cultureRegion)),
      new Set(communityRegions),
    );
    stories.forEach((s) => encountered.add(s.id));
  }
  assert.equal(encountered.size, communityStories.length);
  for (const story of communityStories) {
    assert.ok(story.originalQuote && story.age >= 4 && story.age <= 9);
    assert.doesNotThrow(() =>
      new Intl.DateTimeFormat("en", { timeZone: story.timeZone }).format(),
    );
    for (const language of ["text", "english"])
      for (const field of [
        "title",
        "quote",
        "dream",
        "care",
        "observation",
        "activity",
      ])
        assert.ok(
          story[language][field]?.trim(),
          `${story.id} missing ${language}.${field}`,
        );
  }
});
