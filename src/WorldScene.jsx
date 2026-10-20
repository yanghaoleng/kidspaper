import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  X,
  Heart,
  PencilSimple,
  Leaf,
  ChatCircle,
} from "@phosphor-icons/react";
import { sample } from "./sample";
const panorama = import.meta.env.BASE_URL + "images/childhood-panorama.webp";
export default function WorldScene({
  issue = sample,
  intro = false,
  begin,
  toSample,
  onExplore,
  onChat,
}) {
  const [clues, setClues] = useState(true),
    [story, setStory] = useState(null);
  const scroller = useRef(null),
    canvas = useRef(null),
    dialog = useRef(null);
  const name = issue.profile.nickname;
  const spots = [
    {
      key: "child",
      label: intro ? "小小的我" : `${name}的原话`,
      short: "小小的我",
      x: 0.41,
      y: 0.88,
    },
    { key: "family", label: "一直在的爱", short: "爱我的人", x: 0.69, y: 0.8 },
    {
      key: "future",
      label: "还没展开的可能",
      short: "未来的路",
      x: 0.87,
      y: 0.62,
    },
  ];
  useEffect(() => {
    const el = scroller.current;
    const resize = () => {
      if (window.matchMedia("(max-width:700px)").matches)
        el.scrollLeft = Math.max(
          0,
          canvas.current.clientWidth * 0.33 - el.clientWidth / 2,
        );
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = dialog.current;
    if (story) {
      if (!el.open) el.showModal();
      const before = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = before;
        if (el.open) el.close();
      };
    } else if (el.open) el.close();
  }, [story]);
  const go = (callback) => {
    setStory(null);
    requestAnimationFrame(() => callback?.());
  };
  const children = issue.answers.filter((a) => a.who === "child"),
    parents = issue.answers.filter((a) => a.who === "guardian");
  return (
    <section
      className={`world-scene ${intro ? "intro-world" : "report-world"} ${!intro && issue.images[0] ? "personal-world" : ""}`}
      aria-label={intro ? "探索一个孩子的想象世界" : `${name}的童年小世界`}
    >
      <div className="world-scroller" ref={scroller}>
        <div className="world-canvas" ref={canvas}>
          <img
            className="world-landscape"
            src={!intro && issue.images[0] ? issue.images[0] : panorama}
            alt={
              !intro && issue.images[0]
                ? "依据本次梦想生成的概念图"
                : "原创通用水彩风景：小孩观察自然、家人在手工桌旁、远处是一间树屋"
            }
            fetchPriority="high"
          />
          <div className="world-water" aria-hidden="true" />
          <div className={`world-spots ${clues ? "" : "quiet-spots"}`}>
            {spots.map((s) => (
              <button
                key={s.key}
                className="world-spot"
                style={{ left: s.x * 100 + "%", top: s.y * 100 + "%" }}
                aria-label={`点开${s.label}`}
                onClick={() => setStory(s.key)}
              >
                <span className="world-point" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="world-heading">
        <p className="eyebrow">
          {intro
            ? "和你一起，读懂一个小小世界"
            : `${name} · ${issue.profile.age} · 童年特别刊`}
        </p>
        <h1>
          {intro ? (
            <>
              小小的你，
              <br />
              有一整个世界。
            </>
          ) : (
            issue.report?.title || `${name}的小小世界`
          )}
        </h1>
        <p>
          {intro ? (
            <>
              那些天马行空的想法，还有一直都在的爱，
              <br />
              值得被认真听见，慢慢珍藏。
            </>
          ) : (
            issue.report?.subtitle
          )}
        </p>
        <div className="world-actions">
          {intro ? (
            <>
              <button className="primary" onClick={begin}>
                一起做一份 <ArrowUpRight size={19} />
              </button>
              <button className="text-link" onClick={toSample}>
                先逛逛样刊 <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <button className="text-link" onClick={onExplore}>
              走近一点，看看当时的我 <ArrowRight size={17} />
            </button>
          )}
        </div>
      </div>
      <nav className="world-shortcuts" aria-label="在童年风景里找一找">
        {spots.map((s) => (
          <button
            key={s.key}
            onClick={() =>
              scroller.current.scrollTo({
                left:
                  canvas.current.clientWidth * s.x -
                  scroller.current.clientWidth / 2,
                behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            {s.short}
          </button>
        ))}
      </nav>
      <div className="world-guide">
        <span>点一点风景，听听每个小故事。</span>
        <button onClick={() => setClues(!clues)} aria-pressed={clues}>
          线索{clues ? "开" : "关"}
        </button>
        <span className="world-pan-hint">左右滑动，探索完整风景</span>
      </div>
      <div className="world-caption">
        <span>
          {intro
            ? "风景与故事为虚构样例"
            : issue.images[0]
              ? "AI 想象图景，未来有很多种可能"
              : "通用想象风景 · 读的是这次留下的原话"}
        </span>
        <span className="serif">A little world, held with love.</span>
      </div>
      <dialog
        ref={dialog}
        className="world-story"
        onCancel={(e) => {
          e.preventDefault();
          setStory(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const r = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom
            )
              setStory(null);
          }
        }}
      >
        <button
          className="icon-button world-close"
          aria-label="合上这页小故事"
          onClick={() => setStory(null)}
        >
          <X size={22} />
        </button>
        {story === "child" && (
          <>
            <PencilSimple size={27} weight="light" />
            <span className="serif">In my own little words</span>
            <h2>
              先听听，
              <br />
              小小的我怎么说。
            </h2>
            <p className="world-story-note">
              {intro
                ? "以下是虚构样刊中的孩子原话。"
                : "以下保留孩子这次说过的话，没有替他改成“大人的答案”。"}
            </p>
            {children.slice(0, 3).map((a) => (
              <blockquote key={a.id}>
                <small>{a.question}</small>
                <p>“{a.text}”</p>
              </blockquote>
            ))}
            <button
              className="text-link"
              onClick={() => go(intro ? toSample : onExplore)}
            >
              从这些话，再走近一点 <ArrowRight size={17} />
            </button>
          </>
        )}
        {story === "family" && (
          <>
            <Heart size={29} weight="light" />
            <span className="serif">There is love behind me.</span>
            <h2>
              我的身后，
              <br />
              有人愿意慢慢陪着。
            </h2>
            <p className="world-story-note">
              这一页是家长写下的爱和支持，选择仍然留给孩子。
            </p>
            {parents.length ? (
              parents.map((a) => (
                <blockquote key={a.id}>
                  <small>{a.question}</small>
                  <p>{a.text}</p>
                </blockquote>
              ))
            ) : (
              <p>这份档案里还没有留下家长的心声。以后，可以一起补上。</p>
            )}
            <button
              className="text-link"
              onClick={() => go(intro ? begin : onExplore)}
            >
              {intro ? "也为你的孩子留一页" : "接着翻翻特别刊"}{" "}
              <ArrowRight size={17} />
            </button>
          </>
        )}
        {story === "future" && (
          <>
            <Leaf size={29} weight="light" />
            <span className="serif">So many ways to become.</span>
            <h2>
              长大以后，
              <br />
              也可以有好多种样子。
            </h2>
            <p className="world-story-note">
              从孩子的表达出发，共同想象。不规定职业，也不预测人生。
            </p>
            {(issue.report?.possibilities || []).slice(0, 2).map((p) => (
              <div className="world-possibility" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.scene}</p>
                <small>可以先试试：{p.firstStep}</small>
              </div>
            ))}
            <button
              className="text-link"
              onClick={() => go(intro ? toSample : onExplore)}
            >
              翻开所有的可能 <ArrowRight size={17} />
            </button>
          </>
        )}
        {!intro && onChat && (
          <button
            className="secondary world-chat-link"
            onClick={() => go(onChat)}
          >
            <ChatCircle size={18} />
            再问问童年档案
          </button>
        )}
      </dialog>
    </section>
  );
}
