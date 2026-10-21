import React, { useEffect, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoDistance } from "d3-geo";
import { ArrowLeft, ArrowRight, Pause, Play } from "@phosphor-icons/react";

export default function PaperGlobe({ stories, selected, onSelect, english }) {
  const canvas = useRef(),
    container = useRef(),
    markers = useRef(new Map());
  const state = useRef({ yaw: -65, target: null, drag: null, auto: false });
  const [auto, setAuto] = useState(false),
    [mapError, setMapError] = useState(false);
  const live = useRef({ stories, selected, onSelect });
  live.current = { stories, selected, onSelect };
  useEffect(() => {
    if (selected) state.current.target = -selected.lon;
  }, [selected?.id]);
  useEffect(() => {
    let cancelled = false,
      frame,
      land = null,
      width = 0,
      height = 0,
      previous = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = canvas.current,
      ctx = el.getContext("2d");
    fetch(import.meta.env.BASE_URL + "data/land.geojson")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (!cancelled) land = d;
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });
    const resize = () => {
      width = container.current.clientWidth;
      height = container.current.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = width * dpr;
      el.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container.current);
    resize();
    const draw = (time) => {
      if (cancelled) return;
      if (time - previous < 33) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const s = state.current,
        dt = Math.min(time - previous, 40);
      previous = time;
      if (s.target !== null && !s.drag) {
        const diff = ((s.target - s.yaw + 540) % 360) - 180;
        s.yaw += reduced ? diff : diff * 0.07;
        if (Math.abs(diff) < 0.1) s.target = null;
      } else if (s.auto && !s.drag && !reduced) s.yaw += dt * 0.002;
      const r = Math.min(width * 0.355, height * 0.385),
        cx = width * 0.5,
        cy = height * 0.535;
      const p = geoOrthographic()
        .translate([cx, cy])
        .scale(r)
        .rotate([s.yaw, -18, -12])
        .clipAngle(90);
      const path = geoPath(p, ctx);
      ctx.clearRect(0, 0, width, height);
      // Quiet orbit and the underside of a paper cut-out, not a glossy sphere.
      ctx.save();
      ctx.translate(cx, cy + r * 0.95);
      ctx.scale(1, 0.14);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = "#7e8b8620";
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.38, r * 0.41, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#b6aea055";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 7]);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#c9dadd";
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      // Broad transparent washes retain the flat watercolor treatment.
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(
          cx - r * 0.5 + i * r * 0.18,
          cy + r * 0.1 + Math.sin(i) * r * 0.22,
          r * 0.46,
          r * 0.82,
          0.3,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = i % 2 ? "#f8f6e90b" : "#73949b08";
        ctx.fill();
      }
      if (land) {
        for (const feature of land.features) {
          ctx.beginPath();
          path(feature);
          ctx.fillStyle = "#d9ddba";
          ctx.fill();
          ctx.strokeStyle = "#83958199";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      ctx.strokeStyle = "#748d8c35";
      ctx.lineWidth = 0.65;
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
      // Fine pigment flecks, deterministic so the paper does not flicker.
      for (let i = 0; i < 1200; i++) {
        const x = (((i * 7919) % 1009) / 1009) * 2 - 1,
          y = (((i * 3571) % 1013) / 1013) * 2 - 1;
        ctx.fillStyle = i % 3 ? "#fffaf01a" : "#536c6a0b";
        ctx.fillRect(cx + x * r, cy + y * r, 1.3, 0.9);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#7f9690";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 0.8, cy - 0.9, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#7f969035";
      ctx.lineWidth = 0.7;
      ctx.stroke();
      const center = p.invert([cx, cy]);
      live.current.stories.forEach((story, i) => {
        const element = markers.current.get(story.id),
          active = live.current.selected?.id === story.id;
        const pos = p([story.lon, story.lat]),
          front = geoDistance(center, [story.lon, story.lat]) < Math.PI * 0.485;
        if (element) {
          element.style.visibility = front ? "visible" : "hidden";
          element.style.left = pos[0] + "px";
          element.style.top = pos[1] + "px";
          element.style.zIndex = active ? 3 : 2;
          element.tabIndex = front ? 0 : -1;
        }
        if (!front) return;
        const x = pos[0] - cx,
          y = pos[1] - cy;
        const extension = 1.43 + (i % 3) * 0.085;
        const tx = cx + x * extension,
          ty = cy + y * extension - r * 0.16;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pos[0] - 3, pos[1]);
        ctx.lineTo(tx - 6, ty);
        ctx.lineTo(tx + 6, ty);
        ctx.lineTo(pos[0] + 3, pos[1]);
        ctx.closePath();
        ctx.fillStyle = story.color + (active ? "2b" : "14");
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(...pos);
        ctx.lineTo(tx, ty);
        ctx.lineWidth = active ? 1.6 : 0.85;
        ctx.strokeStyle = story.color + (active ? "ef" : "99");
        ctx.stroke();
        const pulse = reduced ? 0 : Math.sin(time / 1900 + i) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(tx, ty, active ? 3.2 : 1.8 + pulse * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = story.color;
        ctx.fill();
        if (active) {
          ctx.beginPath();
          ctx.arc(tx, ty, 8 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = story.color + "45";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.restore();
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);
  const turn = (n) => {
    state.current.target = null;
    state.current.yaw += n;
  };
  return (
    <div className="globe-stage" ref={container}>
      <span className="globe-caption">
        {english
          ? "Every little world has a light."
          : "每一个小世界，都有自己的光。"}
      </span>
      <canvas
        ref={canvas}
        aria-hidden="true"
        onPointerDown={(e) => {
          state.current.drag = { x: e.clientX, yaw: state.current.yaw };
          state.current.target = null;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = state.current.drag;
          if (d) state.current.yaw = d.yaw + (e.clientX - d.x) * 0.35;
        }}
        onPointerUp={() => {
          state.current.drag = null;
        }}
        onPointerCancel={() => {
          state.current.drag = null;
        }}
      />
      <div className="globe-lights">
        {stories.map((story) => (
          <button
            key={story.id}
            ref={(node) => {
              if (node) markers.current.set(story.id, node);
              else markers.current.delete(story.id);
            }}
            className={`globe-light ${selected?.id === story.id ? "is-selected" : ""}`}
            style={{ "--light": story.color, visibility: "hidden" }}
            aria-label={`${english ? "Meet" : "遇见"} ${story.name} · ${story.region[english ? "en" : "zh"]}`}
            aria-pressed={selected?.id === story.id}
            onClick={() => live.current.onSelect(story)}
          >
            <span />
            <small>{story.name}</small>
          </button>
        ))}
      </div>
      {mapError && (
        <p className="globe-map-error">
          {english
            ? "The map could not load. You can still browse the stories below."
            : "地图暂时没载入，仍可从下方的故事里探索。"}
        </p>
      )}
      <div className="globe-controls">
        <button
          onClick={() => turn(-35)}
          aria-label={english ? "Rotate west" : "向西转动地球"}
        >
          <ArrowLeft size={18} />
        </button>
        <span>{english ? "Drag to explore" : "拖动地球，遇见远方"}</span>
        <button
          onClick={() => turn(35)}
          aria-label={english ? "Rotate east" : "向东转动地球"}
        >
          <ArrowRight size={18} />
        </button>
        <button
          aria-label={
            auto
              ? english
                ? "Pause rotation"
                : "暂停转动"
              : english
                ? "Auto rotate"
                : "自动转动"
          }
          aria-pressed={auto}
          onClick={() => {
            state.current.auto = !auto;
            setAuto(!auto);
          }}
        >
          {auto ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
    </div>
  );
}
