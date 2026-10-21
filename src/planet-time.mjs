// UTC is a sufficient UT1 approximation for this illustrative globe, not navigation.
// https://aa.usno.navy.mil/faq/GAST
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
const radians = Math.PI / 180;
export const wrapLongitude = (value) =>
  ((((value + 180) % 360) + 360) % 360) - 180;
export function siderealAngle(date = new Date()) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const midnight = Math.floor(jd - 0.5) + 0.5;
  const days = midnight - 2451545;
  const hours = (jd - midnight) * 24;
  const centuries = (jd - 2451545) / 36525;
  return (
    ((((6.697375 +
      0.065709824279 * days +
      1.0027379 * hours +
      0.0000258 * centuries ** 2) *
      15) %
      360) +
      360) %
    360
  );
}
export function solarPosition(date = new Date()) {
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const daysInYear = (Date.UTC(year + 1, 0, 1) - start) / 86400000;
  const day = Math.floor((date.getTime() - start) / 86400000) + 1;
  const hour =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const gamma = ((2 * Math.PI) / daysInYear) * (day - 1 + (hour - 12) / 24);
  const equation =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  return {
    longitude: wrapLongitude(180 - hour * 15 - equation / 4),
    latitude: declination / radians,
  };
}
export function solarAltitude(longitude, latitude, date = new Date()) {
  const sun = solarPosition(date);
  const cosZenith =
    Math.sin(latitude * radians) * Math.sin(sun.latitude * radians) +
    Math.cos(latitude * radians) *
      Math.cos(sun.latitude * radians) *
      Math.cos((longitude - sun.longitude) * radians);
  return Math.asin(Math.max(-1, Math.min(1, cosZenith))) / radians;
}
export function timezoneOffset(timeZone, date = new Date()) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName").value;
  const match = name.match(/GMT([+-])(\d{1,2}):(\d{2})/);
  return match
    ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "-" ? -1 : 1)
    : 0;
}
export function viewerTimezone(
  date = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
) {
  const offsetMinutes = timezoneOffset(timeZone, date);
  const hours = Math.floor(Math.abs(offsetMinutes) / 60),
    minutes = Math.abs(offsetMinutes) % 60;
  return {
    timeZone,
    offsetMinutes,
    longitude: wrapLongitude(offsetMinutes / 4),
    label: `UTC${offsetMinutes < 0 ? "−" : "+"}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}
export function nearbyStories(stories, viewer, date = new Date()) {
  return stories.filter((story) => {
    const difference =
      timezoneOffset(story.timeZone, date) - viewer.offsetMinutes;
    return Math.abs(((((difference + 720) % 1440) + 1440) % 1440) - 720) <= 120;
  });
}
export function cameraLongitude(anchor, date) {
  return wrapLongitude(anchor - siderealAngle(date));
}
// Exact cubic-bezier(.23,1,.32,1), matching the shared CSS ease-out token.
export function easeOutProgress(value) {
  const x = Math.max(0, Math.min(1, value));
  if (x === 0 || x === 1) return x;
  let low = 0,
    high = 1;
  for (let i = 0; i < 24; i++) {
    const s = (low + high) / 2,
      one = 1 - s;
    const bx = 3 * one * one * s * 0.23 + 3 * one * s * s * 0.32 + s * s * s;
    if (bx < x) low = s;
    else high = s;
  }
  return 1 - (1 - (low + high) / 2) ** 3;
}
export function entranceFrame(elapsed, index = 0, reduced = false) {
  if (reduced)
    return {
      turn: 0,
      opacity: easeOutProgress(elapsed / 180),
      beam: 1,
      beamOpacity: easeOutProgress(elapsed / 180),
    };
  return {
    turn: 18 * (1 - easeOutProgress(elapsed / 1400)),
    opacity: easeOutProgress(elapsed / 650),
    beam: easeOutProgress((elapsed - 1200 - index * 160) / 1000),
    beamOpacity: 1,
  };
}
