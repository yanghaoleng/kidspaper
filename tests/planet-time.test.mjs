import test from "node:test";
import assert from "node:assert/strict";
import { communityStories } from "../shared/community.mjs";
import {
  solarPosition,
  solarAltitude,
  siderealAngle,
  viewerTimezone,
  timezoneOffset,
  nearbyStories,
  cameraLongitude,
  wrapLongitude,
  entranceFrame,
} from "../src/planet-time.mjs";
test("solar terminator follows seasons, UTC hours and the date line", () => {
  const june = new Date("2026-06-21T12:00:00Z"),
    december = new Date("2026-12-21T12:00:00Z");
  assert.ok(
    solarPosition(june).latitude > 23 && solarPosition(june).latitude < 24,
  );
  assert.ok(
    solarPosition(december).latitude < -23 &&
      solarPosition(december).latitude > -24,
  );
  assert.ok(Math.abs(solarPosition(june).longitude) < 1);
  assert.ok(solarAltitude(120, 31, new Date("2026-06-21T04:00:00Z")) > 65);
  assert.ok(solarAltitude(120, 31, new Date("2026-06-21T16:00:00Z")) < -30);
  assert.ok(
    Math.abs(solarAltitude(180, 10, june) - solarAltitude(-180, 10, june)) <
      1e-8,
  );
  assert.ok(
    Math.abs(solarPosition(new Date("2024-02-29T12:00:00Z")).latitude) < 25,
  );
});
test("fixed inertial camera advances at sidereal speed instead of a frame-count loop", () => {
  const j2000 = new Date("2000-01-01T12:00:00Z");
  assert.ok(Math.abs(siderealAngle(j2000) - 280.46) < 0.02);
  const start = new Date("2026-10-21T12:00:00Z"),
    later = new Date(start.getTime() + 3600000);
  const anchor = 120 + siderealAngle(start);
  assert.ok(Math.abs(cameraLongitude(anchor, start) - 120) < 1e-8);
  const shift = wrapLongitude(
    cameraLongitude(anchor, later) - cameraLongitude(anchor, start),
  );
  assert.ok(Math.abs(shift + 15.041) < 0.002);
  assert.equal(
    cameraLongitude(anchor, later),
    cameraLongitude(anchor, new Date(later.toISOString())),
  );
});
test("nearby lights use IANA offsets including DST, fractional zones and the date line", () => {
  const october = new Date("2026-10-21T12:00:00Z"),
    june = new Date("2026-06-21T12:00:00Z");
  const shanghai = viewerTimezone(october, "Asia/Shanghai");
  assert.equal(shanghai.longitude, 120);
  assert.equal(shanghai.label, "UTC+08:00");
  assert.equal(timezoneOffset("Asia/Kathmandu", october), 345);
  assert.equal(timezoneOffset("Australia/Melbourne", october), 660);
  assert.equal(timezoneOffset("Australia/Melbourne", june), 600);
  const ids = nearbyStories(communityStories, shanghai, october).map(
    (s) => s.id,
  );
  assert.deepEqual(ids, ["garden", "moon", "bridge", "wind"]);
  assert.ok(
    nearbyStories(
      communityStories,
      viewerTimezone(june, "Asia/Shanghai"),
      june,
    ).some((s) => s.id === "penguin"),
  );
  assert.ok(
    nearbyStories(
      communityStories,
      viewerTimezone(october, "Pacific/Pago_Pago"),
      october,
    ).some((s) => s.id === "boat"),
  );
});
test("planet settles before staggered beams grow, with a motion-reduced fade", () => {
  assert.equal(entranceFrame(0).turn, 18);
  assert.equal(entranceFrame(1400).turn, 0);
  assert.equal(entranceFrame(1200, 0).beam, 0);
  assert.ok(entranceFrame(1300, 0).beam > 0);
  assert.equal(entranceFrame(1300, 1).beam, 0);
  assert.equal(entranceFrame(5000, 12).beam, 1);
  const samples = Array.from(
    { length: 15 },
    (_, i) => entranceFrame(i * 100).turn,
  );
  assert.ok(samples.every((x, i) => i === 0 || x <= samples[i - 1]));
  assert.deepEqual(entranceFrame(180, 10, true), {
    turn: 0,
    opacity: 1,
    beam: 1,
    beamOpacity: 1,
  });
});
