import React, { useEffect, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoDistance, geoCircle } from "d3-geo";
import { Sun, Moon } from "@phosphor-icons/react";
import {
  siderealAngle,
  cameraLongitude,
  solarPosition,
  entranceFrame,
} from "./planet-time.mjs";

export default function PaperGlobe({
  stories,
  selected,
  onSelect,
  english,
  viewer,
  now,
}) {
  const canvas = useRef(),
    container = useRef(),
    markers = useRef(new Map()),
    dirty = useRef(true);
  const live = useRef({ stories, selected, onSelect });
  live.current = { stories, selected, onSelect };
  const [mapError, setMapError] = useState(false);
  useEffect(() => {
    dirty.current = true;
  }, [stories, selected?.id]);
  useEffect(() => {
    let cancelled = false,
      frame,
      land = null,
      mapFailed = false,
      width = 0,
      height = 0,
      previous = -Infinity,
      started = null,
      inView = true;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = canvas.current,
      ctx = el.getContext("2d");
    if (!ctx) {
      setMapError(true);
      return;
    }
    const entryDate = new Date(),
      anchor = viewer.longitude + siderealAngle(entryDate);
    const latitudes = live.current.stories
      .map((s) => s.lat)
      .sort((a, b) => a - b);
    const representative = latitudes.length
      ? latitudes[Math.floor(latitudes.length / 2)]
      : 25;
    // A low fixed camera frames an open horizon. The timezone is not a GPS fix.
    const cameraLatitude = Math.max(-75, Math.min(10, representative - 65));
    fetch(import.meta.env.BASE_URL + "data/land.geojson")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          land = data;
          dirty.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) {
          mapFailed = true;
          dirty.current = true;
          setMapError(true);
        }
      });
    const resize = () => {
      width = container.current.clientWidth;
      height = container.current.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = width * dpr;
      el.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty.current = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container.current);
    resize();
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) dirty.current = true;
    });
    io.observe(container.current);
    const draw = (time) => {
      if (cancelled) return;
      frame = requestAnimationFrame(draw);
      if (!inView) return;
      if (!land && !mapFailed) return;
      if (started === null) started = time;
      const elapsed = time - started,
        interval = elapsed < 4200 ? 33 : 1000;
      if (!dirty.current && time - previous < interval) return;
      previous = time;
      dirty.current = false;
      const date = new Date(),
        entry = entranceFrame(elapsed, 0, reduced);
      const r = Math.max(width * 0.72, height * 0.95),
        cx = width * 0.5,
        cy = r + height * 0.18 + 10 * (1 - entry.opacity);
      const longitude = cameraLongitude(anchor, date) + entry.turn;
      const p = geoOrthographic()
        .translate([cx, cy])
        .scale(r)
        .rotate([-longitude, -cameraLatitude, -7])
        .clipAngle(90);
      const path = geoPath(p, ctx);
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = entry.opacity;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#d2e0df";
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(
          cx - r * 0.65 + i * r * 0.19,
          cy - r * 0.4 + Math.sin(i) * r * 0.15,
          r * 0.43,
          r * 0.7,
          0.3,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = i % 2 ? "#fff9e71b" : "#809a9d0b";
        ctx.fill();
      }
      if (land)
        for (const feature of land.features) {
          ctx.beginPath();
          path(feature);
          ctx.fillStyle = "#dce0c1";
          ctx.fill();
          ctx.strokeStyle = "#8b9c8b90";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = "#82999933";
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        path({
          type: "LineString",
          coordinates: Array.from({ length: 181 }, (_, i) => [
            -180 + i * 2,
            lat,
          ]),
        });
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        path({
          type: "LineString",
          coordinates: Array.from({ length: 91 }, (_, i) => [lon, -90 + i * 2]),
        });
        ctx.stroke();
      }
      const sun = solarPosition(date),
        nightCenter = [sun.longitude + 180, -sun.latitude];
      // NOAA solar position determines the terminator. Translucent pigment bands
      // soften twilight while the surrounding paper stays light.
      for (const [radius, color] of [
        [96, "#6a7e9d0c"],
        [92, "#667b9c10"],
        [90, "#637a9b34"],
        [84, "#586e9629"],
      ]) {
        ctx.beginPath();
        path(geoCircle().center(nightCenter).radius(radius)());
        ctx.fillStyle = color;
        ctx.fill();
      }
      for (let i = 0; i < 1100; i++) {
        const x = (((i * 7919) % 1009) / 1009) * 2 - 1,
          y = (((i * 3571) % 1013) / 1013) * 2 - 1;
        ctx.fillStyle = i % 3 ? "#fffaf016" : "#60797b0a";
        ctx.fillRect(cx + x * r, cy + y * r, 1.4, 1);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#8a9b9166";
      ctx.lineWidth = 1;
      ctx.stroke();
      const center = p.invert([cx, cy]);
      live.current.stories.forEach((story, index) => {
        const element = markers.current.get(story.id),
          active = live.current.selected?.id === story.id;
        const position = p([story.lon, story.lat]),
          front = geoDistance(center, [story.lon, story.lat]) < Math.PI * 0.48;
        const entrance = entranceFrame(elapsed, index, reduced);
        const visible =
          front &&
          position[0] > 28 &&
          position[0] < width - 28 &&
          position[1] > 28 &&
          position[1] < height - 12 &&
          entrance.beam > 0;
        if (!visible) {
          if (element) {
            element.style.visibility = "hidden";
            element.tabIndex = -1;
          }
          return;
        }
        const [sx, sy] = position,
          dx = sx - cx,
          dy = sy - cy;
        let extension = (r * 1.2) / Math.hypot(dx, dy);
        if (dy < 0) extension = Math.min(extension, (cy - 12) / -dy);
        if (dx > 0) extension = Math.min(extension, (width - 12 - cx) / dx);
        if (dx < 0) extension = Math.min(extension, (12 - cx) / dx);
        const endX = cx + dx * extension,
          endY = cy + dy * extension;
        const tx = sx + (endX - sx) * entrance.beam,
          ty = sy + (endY - sy) * entrance.beam;
        const distance = Math.hypot(tx - sx, ty - sy);
        if (distance < 1) return;
        const nx = -(ty - sy) / distance,
          ny = (tx - sx) / distance;
        const wash = ctx.createLinearGradient(sx, sy, tx, ty);
        wash.addColorStop(0, active ? "#c49a6455" : "#c49a6428");
        wash.addColorStop(0.3, active ? "#c49a6468" : "#b99b6e3b");
        wash.addColorStop(1, "#c49a6400");
        ctx.save();
        ctx.globalAlpha = entry.opacity * entrance.beamOpacity;
        ctx.beginPath();
        ctx.moveTo(sx - nx * 1.5, sy - ny * 1.5);
        ctx.lineTo(tx - nx * 5, ty - ny * 5);
        ctx.lineTo(tx + nx * 5, ty + ny * 5);
        ctx.lineTo(sx + nx * 1.5, sy + ny * 1.5);
        ctx.closePath();
        ctx.fillStyle = wash;
        ctx.fill();
        const ink = ctx.createLinearGradient(sx, sy, tx, ty);
        ink.addColorStop(0, active ? "#9e794dcc" : "#9c855d85");
        ink.addColorStop(0.45, active ? "#b18a57aa" : "#a58f6670");
        ink.addColorStop(1, "#b18a5700");
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = ink;
        ctx.lineWidth = active ? 1.6 : 0.8;
        ctx.stroke();
        ctx.restore();
        if (element) {
          element.style.visibility = "visible";
          element.style.opacity = entry.opacity * entrance.beamOpacity;
          const fraction = [0.65, 0.25, 0.5, 0.8][index % 4] * entrance.beam;
          element.style.transform = `translate3d(${sx + (endX - sx) * fraction - 22}px,${sy + (endY - sy) * fraction - 22}px,0)`;
          const anchorX = sx + (endX - sx) * fraction;
          const anchorY = sy + (endY - sy) * fraction;
          element.dataset.tooltipSide =
            anchorX < 130 ? "right" : anchorX > width - 130 ? "left" : "center";
          element.dataset.tooltipVertical =
            anchorY > height - 170 ? "above" : "below";
          element.tabIndex = 0;
        }
      });
      ctx.globalAlpha = 1;
      container.current.dataset.phase =
        elapsed < 1400 ? "arriving" : elapsed < 4200 ? "lighting" : "live";
      container.current.dataset.cameraLongitude = cameraLongitude(
        anchor,
        date,
      ).toFixed(5);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
    };
  }, [viewer.timeZone, viewer.offsetMinutes]);
  return (
    <div
      className="globe-stage"
      ref={container}
      role="group"
      aria-label={
        english
          ? "The Earth now, near your timezone"
          : "此刻的地球，时区附近的光"
      }
    >
      <div className="globe-now">
        <span>{english ? "THE EARTH, NOW" : "此刻，地球这一侧"}</span>
        <time dateTime={now.toISOString()}>
          {new Intl.DateTimeFormat(english ? "en-GB" : "zh-CN", {
            timeZone: viewer.timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(now)}{" "}
          <small>{viewer.label}</small>
        </time>
      </div>
      <canvas ref={canvas} aria-hidden="true" />
      <div className="globe-lights">
        {stories.map((story) => (
          <button
            key={story.id}
            data-story-id={story.id}
            ref={(node) => {
              if (node) markers.current.set(story.id, node);
              else markers.current.delete(story.id);
            }}
            className={`globe-light ${selected?.id === story.id ? "is-selected" : ""}`}
            style={{ visibility: "hidden" }}
            aria-label={`${english ? "Meet" : "遇见"} ${story.name} · ${story.region[english ? "en" : "zh"]}`}
            aria-pressed={selected?.id === story.id}
            onClick={() => live.current.onSelect(story)}
          >
            <small className="globe-nickname">{story.name}</small>
            <span className="globe-tooltip" aria-hidden="true">
              <strong>
                {story.name}{" "}
                <em>
                  {story.age}
                  {english ? " years" : " 岁"}
                </em>
              </strong>
              <span>{story.region[english ? "en" : "zh"]}</span>
              <span className="globe-tooltip-title">
                {english ? story.english.title : story.text.title}
              </span>
              <span className="globe-tooltip-hint">
                {english
                  ? "Fictional setting · Click to read"
                  : "虚构故事地点 · 点击阅读小报"}
              </span>
            </span>
          </button>
        ))}
      </div>
      {mapError && (
        <p className="globe-map-error">
          {english
            ? "The map could not load. Please refresh to try again."
            : "地图暂时没载入，请刷新页面重试。"}
        </p>
      )}
      <div className="globe-live-caption">
        <span>
          <Sun size={14} />
          {english ? "Day" : "昼"}
          <Moon size={14} />
          {english ? "Night" : "夜"}
        </span>
        <span>
          {english ? "Real time · Nearby timezones" : "真实时间 · 附近时区"}
        </span>
      </div>
    </div>
  );
}
