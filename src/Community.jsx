import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Shuffle,
  Heart,
  EnvelopeSimple,
  Sparkle,
  Translate,
  Check,
  X,
  GlobeHemisphereWest,
  BookOpen,
  CircleNotch,
  Stamp,
  Sun,
  ArrowLeft,
} from "@phosphor-icons/react";
import PaperGlobe from "./PaperGlobe";
import PlanetModal from "./PlanetModal";
import { viewerTimezone, nearbyStories } from "./planet-time.mjs";
import {
  communityStories,
  dailyStories,
  editionKey,
  languages,
  translatedStory,
} from "../shared/community.mjs";
import "./community.css";

const STORE = "kidspaper.paper-planet.v1";
const copy = {
  zh: {
    planet: "纸上星球",
    today: "今日的光",
    play: "一起玩想象",
    mail: "我的小信箱",
    demo: "模拟社区",
    title: (
      <>
        同一颗星球，
        <br />
        许多种<span>小小的光。</span>
      </>
    ),
    intro: "昼夜走过纸上的山海，你的时区附近，一些小小的想象正在亮起。",
    random: "随机遇见一束光",
    read: "展开这份小报",
    close: "收起小报",
    like: "送一枚喜欢",
    liked: "喜欢已寄出",
    source: "查看原文",
    translation: "阅读译文",
    dream: "一个想象中的世界",
    care: "家长想说的话",
    observation: "这次谈话的一点观察",
    activity: "一起试试",
    original: "孩子的原话",
    printed: "虚构童年特别刊",
    refresh: "每日换一页",
    batch: "今日展示 12 份虚构小报 · 00:00 UTC 换一批",
    demoNote: "这里的人物、报告、光与来信都是模拟内容。互动仅保存在本机。",
    light: "点亮一束练习光",
    lit: "你的练习光已点亮",
    languages: "阅读语言",
    translationLabel: "编辑预译 · 可对照原话",
    next: "再遇见一束",
    same: "同一道问题，不同的小宇宙",
    sameText: "如果你能为世界增加一样东西，你会加什么？",
    create: "把两个想象，接在一起",
    createText:
      "一座会走路的花园，遇见一间云朵面包店，会发生什么？AI 帮忙起个头，剩下的故事由你们来讲。",
    story: "接一段故事",
    question: "送来一个新问题",
    postcard: "写一张远方明信片",
    make: "让 AI 接个头",
    consentTitle: "和家长一起，请 AI 来共创",
    consent:
      "只会把你选中的两份虚构示例交给站点配置的 AI。不会读取或上传收藏架里的孩子档案。",
    agree: "我已了解，和孩子一起使用 AI",
    confirm: "开始共创",
    empty: "信箱里还很安静",
    emptyText: "点亮一束练习光，试试收到回应的感觉。",
    clear: "全部标为已读",
    new: "未读",
    sent: "已寄出",
    received: "模拟来信",
    saved: "收进想象护照",
    save: "收藏这束光",
    passport: "想象护照",
    savedNote: "每一枚邮票，留住一个你愿意再来的小世界。",
    noStamps: "还没有邮票。翻开小报，把喜欢的想象收进来。",
    practice: "练习光",
    practiceText:
      "这是一份预设的虚构小报，只用来体验点亮与收信。你的私人档案仍留在收藏架。",
    practiceGo: "用虚构样刊点亮",
    practiceTitle: "你的光，也值得被看见",
    caption: "按设备时区筛选附近的虚构故事，不读取定位，不代表儿童位置。",
    aiWorking: "正在把两个小世界接起来…",
    aiLabel: "AI 共创 · 虚构故事",
    image: "为故事画一张画",
    imageWork: "正在画这场相遇…",
    from: "来自",
    return: "回到星球",
    localOnly: "本机体验",
    pick: "选两份小报，交换一点想象",
    readAll: "今天，附近的小世界",
    reset: "重试",
    noAI: "暂时没接通，请稍后再试。",
    showcase: "三种玩法，一起把世界变大一点。",
    why: "喜欢会变成邮票，不排列孩子的名次。",
  },
  en: {
    planet: "Paper planet",
    today: "Today's lights",
    play: "Imagine together",
    mail: "Little mailbox",
    demo: "Fictional community",
    title: (
      <>
        One small planet.
        <br />
        So many <span>little lights.</span>
      </>
    ),
    intro:
      "Day and night pass over a paper Earth. Near your timezone, little imaginations are coming to light.",
    random: "Meet a light by chance",
    read: "Unfold this little paper",
    close: "Fold the paper",
    like: "Send a little heart",
    liked: "Heart sent",
    source: "See original",
    translation: "Read translation",
    dream: "An imagined little world",
    care: "A guardian's words",
    observation: "A glimpse from this conversation",
    activity: "Try it together",
    original: "The child's words",
    printed: "Fictional childhood edition",
    refresh: "A fresh page each day",
    batch: "12 fictional papers today · A new selection at 00:00 UTC",
    demoNote:
      "All people, reports, lights and letters here are fictional. Interactions stay on this device.",
    light: "Light a practice beam",
    lit: "Your practice light is on",
    languages: "Reading language",
    translationLabel: "Editorial translation · Compare with the original",
    next: "Meet another light",
    same: "One question, many little universes",
    sameText: "If you could add one thing to the world, what would it be?",
    create: "Let two imaginations meet",
    createText:
      "What happens when a walking garden meets a cloud bakery? AI can begin a story. You decide what happens next.",
    story: "A story beginning",
    question: "A new question",
    postcard: "A postcard from afar",
    make: "Let AI begin",
    consentTitle: "Create with a guardian and AI",
    consent:
      "Only your two chosen fictional examples will be sent to the site's AI. Your private keepsake shelf will not be read or uploaded.",
    agree: "I understand and will use AI together with my child",
    confirm: "Start creating",
    empty: "The mailbox is quiet",
    emptyText: "Light a practice beam to try receiving a reply.",
    clear: "Mark all as read",
    new: "Unread",
    sent: "Sent",
    received: "Simulated letter",
    saved: "In your imagination passport",
    save: "Save this little world",
    passport: "Imagination passport",
    savedNote: "A stamp for every little world you want to visit again.",
    noStamps: "No stamps yet. Open a paper and save an imagination you love.",
    practice: "Practice light",
    practiceText:
      "This preset fictional paper lets you try lighting a beam and receiving a letter. Your private archive stays on your shelf.",
    practiceGo: "Light the fictional sample",
    practiceTitle: "Your light belongs here too",
    caption:
      "Fictional stories near your device timezone. No location access or children's positions.",
    aiWorking: "Bringing two little worlds together…",
    aiLabel: "AI co-creation · Fictional story",
    image: "Illustrate this encounter",
    imageWork: "Drawing this encounter…",
    from: "From",
    return: "Back to the planet",
    localOnly: "On this device",
    pick: "Choose two papers and swap a little imagination",
    readAll: "Little worlds nearby today",
    reset: "Try again",
    noAI: "We could not connect. Please try again later.",
    showcase: "Three ways to make the world a little bigger.",
    why: "Hearts become stamps. Children are never ranked.",
  },
};
function loadState() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE));
    return {
      likes: Array.isArray(d?.likes)
        ? d.likes.filter((x) => typeof x === "string")
        : [],
      stamps: Array.isArray(d?.stamps)
        ? d.stamps.filter((x) => typeof x === "string")
        : [],
      lit: !!d?.lit,
      inbox: Array.isArray(d?.inbox)
        ? d.inbox
            .filter(
              (n) => typeof n.id === "string" && typeof n.type === "string",
            )
            .slice(0, 60)
        : [],
    };
  } catch {
    return { likes: [], stamps: [], inbox: [], lit: false };
  }
}
const waitText = (t) => (
  <>
    <CircleNotch className="spin" size={18} />
    {t}
  </>
);

export default function Community({ api, notify }) {
  const [locale, setLocale] = useState(() =>
    navigator.language.startsWith("zh") ? "zh" : "en",
  );
  const en = locale === "en",
    t = copy[locale];
  const [edition, setEdition] = useState(editionKey),
    [stories, setStories] = useState(() => dailyStories());
  const [now, setNow] = useState(() => new Date());
  const [viewer, setViewer] = useState(() => viewerTimezone());
  const localStories = nearbyStories(stories, viewer, now);
  const [selected, setSelected] = useState(
    () => nearbyStories(dailyStories(), viewer)[0] || dailyStories()[0],
  );
  const [tab, setTab] = useState("today"),
    [detail, setDetail] = useState(false),
    [practice, setPractice] = useState(false);
  const [social, setSocial] = useState(loadState),
    [storageFailed, setStorageFailed] = useState(false);
  const [reading, setReading] = useState(() => {
    const language = navigator.language.split("-")[0];
    return languages[language] ? language : "en";
  });
  const [translated, setTranslated] = useState({}),
    [showOriginal, setShowOriginal] = useState(false);
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [consentTask, setConsentTask] = useState(null),
    [agree, setAgree] = useState(false);
  const consent = useRef(false),
    pending = useRef(false),
    incomingTimer = useRef();
  const [pair, setPair] = useState(["garden", "cloud"]),
    [mode, setMode] = useState("story"),
    [creation, setCreation] = useState(null),
    [createdImage, setCreatedImage] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(incomingTimer.current);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(social));
    } catch {
      setStorageFailed(true);
    }
  }, [social]);
  const hasReceived = social.inbox.some((n) => n.type === "received");
  useEffect(() => {
    if (!social.lit || hasReceived) return;
    incomingTimer.current = setTimeout(
      () =>
        setSocial((s) => ({
          ...s,
          inbox: [
            {
              id: crypto.randomUUID(),
              type: "received",
              story: "moon",
              read: false,
              date: Date.now(),
            },
            ...s.inbox,
          ].slice(0, 60),
        })),
      4500,
    );
    return () => clearTimeout(incomingTimer.current);
  }, [social.lit, hasReceived]);
  useEffect(() => {
    const update = () => {
      const date = new Date();
      setNow(date);
      const zone = viewerTimezone(date);
      setViewer((old) =>
        old.timeZone === zone.timeZone &&
        old.offsetMinutes === zone.offsetMinutes
          ? old
          : zone,
      );
      const now = editionKey();
      if (now !== edition) {
        const list = dailyStories();
        setEdition(now);
        setStories(list);
        setSelected(nearbyStories(list, zone, date)[0] || list[0]);
      }
    };
    const timer = setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [edition]);
  const choose = (story) => {
    setSelected(story);
    setShowOriginal(false);
    setError("");
  };
  const random = () => {
    const options = visiblePapers().filter((s) => s.id !== selected.id);
    if (!options.length) {
      if (localStories[0]) {
        choose(localStories[0]);
        setDetail(true);
      }
      return;
    }
    choose(
      options[crypto.getRandomValues(new Uint32Array(1))[0] % options.length],
    );
    setDetail(true);
  };
  // A cropped horizon can hide a nearby place. Keyboard navigation follows only
  // the beams that are actually visible; it never rotates the camera to find one.
  function visiblePapers() {
    const lights = [
      ...document.querySelectorAll(".globe-light[data-story-id]"),
    ].filter((element) => getComputedStyle(element).visibility === "visible");
    return lights.length
      ? localStories.filter((story) =>
          lights.some((light) => light.dataset.storyId === story.id),
        )
      : localStories;
  }
  const stepPaper = (direction) => {
    const candidates = visiblePapers();
    if (!candidates.length) return;
    let index = candidates.findIndex((story) => story.id === selected.id);
    if (index < 0) index = direction > 0 ? -1 : 0;
    choose(
      candidates[(index + direction + candidates.length) % candidates.length],
    );
  };
  const unread = social.inbox.filter((n) => !n.read).length;
  const sendLike = () => {
    if (social.likes.includes(selected.id)) return;
    const id = selected.id;
    setSocial((s) => ({
      ...s,
      likes: [...s.likes, id],
      inbox: [
        {
          id: crypto.randomUUID(),
          type: "sent",
          story: id,
          read: true,
          date: Date.now(),
        },
        ...s.inbox,
      ].slice(0, 60),
    }));
  };
  const stamp = () =>
    setSocial((s) => ({
      ...s,
      stamps: s.stamps.includes(selected.id)
        ? s.stamps.filter((id) => id !== selected.id)
        : [...s.stamps, selected.id],
    }));
  async function runAI(task) {
    if (pending.current) return;
    if (!consent.current) {
      setAgree(false);
      setConsentTask(() => task);
      return;
    }
    pending.current = true;
    setError("");
    try {
      await api("session", { guardianConsent: true });
      await task();
    } catch (e) {
      if (alive.current) setError(e.message || t.noAI);
    } finally {
      pending.current = false;
      if (alive.current) setBusy("");
    }
  }
  const translate = () => {
    setShowOriginal(false);
    const key = selected.id + ":" + reading;
    if (translatedStory(selected, reading) || translated[key]) return;
    const storyId = selected.id,
      targetLanguage = reading;
    runAI(async () => {
      setBusy("translate");
      const result = await api("community/translate", {
        storyId,
        targetLanguage,
      });
      if (alive.current)
        setTranslated((old) => ({ ...old, [key]: result.translation }));
    });
  };
  const create = () =>
    runAI(async () => {
      setBusy("create");
      const result = await api("community/create", {
        storyIds: pair,
        mode,
        targetLanguage: reading,
      });
      if (alive.current) {
        setCreation({
          ...result.creation,
          sourceIds: [...pair],
          mode,
          language: reading,
        });
        setCreatedImage("");
      }
    });
  const image = () =>
    runAI(async () => {
      setBusy("image");
      const result = await api("image", { scene: creation.body });
      if (alive.current) setCreatedImage(result.image);
    });
  const addPractice = () => {
    setSocial((s) => ({ ...s, lit: true }));
    setPractice(false);
    choose(communityStories[0]);
    notify(
      en
        ? "Practice light on. A simulated letter will arrive shortly."
        : "练习光已点亮，稍后会有一封模拟来信。",
    );
  };
  const current = showOriginal
    ? { ...selected.text, quote: selected.originalQuote }
    : translatedStory(selected, reading) ||
      translated[selected.id + ":" + reading];
  const display = current || selected.text;
  const native = showOriginal ? selected.language : current ? reading : "zh";
  const changeTab = (value) => {
    if (
      value === "today" &&
      localStories.length &&
      !localStories.some((story) => story.id === selected.id)
    )
      choose(localStories[0]);
    setTab(value);
    setError("");
  };
  function PaperContent({ full = false }) {
    return (
      <>
        <div className="paper-origin">
          <span>{t.printed}</span>
          <Stamp size={26} weight="thin" />
        </div>
        <div className="paper-person">
          <span>{selected.name}</span>
          <span>
            {selected.age}
            {en ? " years" : " 岁"} · {selected.region[locale]}
          </span>
        </div>
        <h2 lang={showOriginal ? "zh" : native}>{display.title}</h2>
        <blockquote lang={native} dir={native === "ar" ? "rtl" : "auto"}>
          “{display.quote}”
        </blockquote>
        <div className="paper-translation">
          <Translate size={16} />
          <label>
            <span className="sr-only">{t.languages}</span>
            <select
              value={reading}
              onChange={(e) => {
                setReading(e.target.value);
                setShowOriginal(false);
                setError("");
              }}
            >
              {Object.entries(languages).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!!busy}
            onClick={translate}
            aria-label={
              busy === "translate"
                ? en
                  ? "Translating"
                  : "正在翻译"
                : t.translation
            }
          >
            {busy === "translate" ? (
              <CircleNotch className="spin" size={16} />
            ) : (
              t.translation
            )}
          </button>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            aria-pressed={showOriginal}
          >
            {t.source}
          </button>
        </div>
        {!current && !showOriginal && (
          <p className="translation-pending">
            {en
              ? "Select Read translation to translate into this language. Showing Chinese for now."
              : "点击「阅读译文」翻译为所选语言，当前先显示中文。"}
          </p>
        )}
        <span className="translation-note">
          {showOriginal
            ? en
              ? "Original fictional child quote; other sections remain in Chinese."
              : "孩子原话保留原语言，其他段落为中文。"
            : translated[selected.id + ":" + reading]
              ? en
                ? "AI translation · Check against the original"
                : "AI 翻译 · 可对照原话"
              : t.translationLabel}
        </span>
        <div className="paper-paragraph" lang={showOriginal ? "zh" : native}>
          <h3>
            <Sun size={17} />
            {t.dream}
          </h3>
          <p>{display.dream}</p>
        </div>
        {full && (
          <div className="paper-paragraph" lang={showOriginal ? "zh" : native}>
            <h3>
              <BookOpen size={17} />
              {t.observation}
            </h3>
            <p>{display.observation}</p>
          </div>
        )}
        <div className="paper-love" lang={showOriginal ? "zh" : native}>
          <Heart size={18} weight="light" />
          <div>
            <h3>{t.care}</h3>
            <p>{display.care}</p>
          </div>
        </div>
        {full && (
          <div className="paper-paragraph" lang={showOriginal ? "zh" : native}>
            <h3>{t.activity}</h3>
            <p>{display.activity}</p>
          </div>
        )}
        <div className="paper-social">
          <button
            className={social.likes.includes(selected.id) ? "heart-sent" : ""}
            onClick={sendLike}
            aria-pressed={social.likes.includes(selected.id)}
          >
            <Heart
              size={20}
              weight={social.likes.includes(selected.id) ? "fill" : "regular"}
            />
            {social.likes.includes(selected.id) ? t.liked : t.like}
          </button>
          <button
            onClick={stamp}
            aria-pressed={social.stamps.includes(selected.id)}
            aria-label={social.stamps.includes(selected.id) ? t.saved : t.save}
          >
            <Stamp
              size={21}
              weight={social.stamps.includes(selected.id) ? "fill" : "regular"}
            />
          </button>
        </div>
        <p className="paper-no-rank">{t.why}</p>
      </>
    );
  }
  return (
    <section className="community" lang={locale}>
      <div className="planet-bar">
        <div className="planet-name">
          <GlobeHemisphereWest size={22} weight="light" />
          {t.planet}
          <span>{t.demo}</span>
        </div>
        <div
          className="planet-tabs"
          role="tablist"
          aria-label={en ? "Community views" : "星球视图"}
        >
          {[
            ["today", t.today, Sun],
            ["play", t.play, Sparkle],
            ["mail", t.mail, EnvelopeSimple],
          ].map(([value, label, Icon]) => (
            <button
              role="tab"
              aria-selected={tab === value}
              aria-controls={`planet-panel-${value}`}
              id={`planet-tab-${value}`}
              key={value}
              onClick={() => changeTab(value)}
            >
              <Icon size={18} />
              {label}
              {value === "mail" && unread > 0 && (
                <b className="mail-badge">{unread}</b>
              )}
            </button>
          ))}
        </div>
        <label className="planet-locale">
          <Translate size={16} />
          <select
            aria-label="Interface language / 界面语言"
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value);
              setReading(e.target.value);
            }}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
      {tab === "today" && (
        <div
          role="tabpanel"
          id="planet-panel-today"
          aria-labelledby="planet-tab-today"
        >
          <div className="planet-intro">
            <div>
              <span className="planet-script">
                A little world, a little light.
              </span>
              <h1>{t.title}</h1>
              <p>{t.intro}</p>
            </div>
            <div className="planet-visit">
              <button
                className="planet-random"
                onClick={random}
                disabled={!localStories.length}
              >
                <Shuffle size={20} />
                {t.random}
                <ArrowUpRight size={18} />
              </button>
              <span>
                <Sun size={15} />
                {t.refresh} · {edition.replaceAll("-", ".")}
              </span>
            </div>
          </div>
          <div className="planet-explorer">
            <div className="planet-map">
              <PaperGlobe
                stories={localStories}
                selected={selected}
                onSelect={(story) => {
                  choose(story);
                  setDetail(true);
                }}
                english={en}
                viewer={viewer}
                now={now}
              />
              <div className="planet-map-foot">
                <span>
                  {en
                    ? `${localStories.length} fictional papers nearby · within 2 timezone hours`
                    : `附近 ${localStories.length} 份虚构小报 · 时差不超过 2 小时`}
                </span>
                <button
                  onClick={() =>
                    social.lit ? notify(t.lit) : setPractice(true)
                  }
                >
                  <Sparkle size={17} />
                  {social.lit ? t.lit : t.light}
                </button>
              </div>
            </div>
            {localStories.length ? (
              <article className="encounter-paper" key={selected.id}>
                {PaperContent({})}
                <button
                  className="unfold-button"
                  onClick={() => setDetail(true)}
                >
                  {t.read}
                  <ArrowUpRight size={17} />
                </button>
              </article>
            ) : (
              <div className="planet-nearby-empty">
                {en
                  ? "No fictional papers near this timezone in today's selection. A new selection arrives tomorrow."
                  : "今天的选集中，这个时区附近还没有虚构小报。明天会换一页新的相遇。"}
              </div>
            )}
          </div>
          <p className="planet-simulation">
            <span>{t.demo}</span>
            {t.demoNote}
          </p>
          <div className="planet-other">
            <div className="planet-section-heading">
              <h2>{t.readAll}</h2>
              <span>{t.caption}</span>
            </div>
            <div className="story-strip">
              {localStories.map((s, i) => (
                <button
                  className={`story-ticket ${selected.id === s.id ? "selected" : ""}`}
                  key={s.id}
                  onClick={() => {
                    choose(s);
                    if (matchMedia("(max-width: 760px)").matches) {
                      setDetail(true);
                      return;
                    }
                    document.querySelector(".planet-explorer")?.scrollIntoView({
                      behavior: matchMedia("(prefers-reduced-motion: reduce)")
                        .matches
                        ? "instant"
                        : "smooth",
                      block: "start",
                    });
                  }}
                >
                  <span className="ticket-mark" style={{ "--light": s.color }}>
                    <Sparkle size={23} weight="light" />
                  </span>
                  <small>{s.region[locale]}</small>
                  <h3>{en ? s.english.title : s.text.title}</h3>
                  <span>
                    {s.name} · {s.age}
                    {en ? " years" : " 岁"}
                    <ArrowUpRight size={15} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === "play" && (
        <div
          className="planet-play"
          role="tabpanel"
          id="planet-panel-play"
          aria-labelledby="planet-tab-play"
        >
          <div className="play-intro">
            <span className="planet-script">What if our worlds met?</span>
            <h1>{t.create}</h1>
            <p>{t.createText}</p>
          </div>
          <div className="co-create-layout">
            <div className="co-create-input">
              <h2>{t.pick}</h2>
              <div className="pair-selectors">
                {pair.map((value, index) => (
                  <React.Fragment key={index}>
                    {index === 1 && <span className="pair-plus">+</span>}
                    <label>
                      <span>
                        {en
                          ? `Little world ${index + 1}`
                          : `小世界 ${index + 1}`}
                      </span>
                      <select
                        value={value}
                        onChange={(e) => {
                          const next = [...pair];
                          next[index] = e.target.value;
                          if (next[0] === next[1]) {
                            notify(
                              en
                                ? "Choose two different worlds."
                                : "选两个不同的小世界吧。",
                            );
                            return;
                          }
                          setPair(next);
                        }}
                      >
                        {communityStories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} · {en ? s.english.title : s.text.title}
                          </option>
                        ))}
                      </select>
                      <blockquote>
                        “
                        {en
                          ? communityStories.find((s) => s.id === value).english
                              .quote
                          : communityStories.find((s) => s.id === value).text
                              .quote}
                        ”
                      </blockquote>
                    </label>
                  </React.Fragment>
                ))}
              </div>
              <div className="creation-modes">
                {["story", "question", "postcard"].map((value) => (
                  <button
                    key={value}
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                  >
                    {t[value]}
                  </button>
                ))}
              </div>
              <label className="creation-language">
                <Translate size={16} />
                {t.languages}
                <select
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                >
                  {Object.entries(languages).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary" onClick={create} disabled={!!busy}>
                {busy === "create" ? (
                  waitText(t.aiWorking)
                ) : (
                  <>
                    <Sparkle size={18} />
                    {t.make}
                  </>
                )}
              </button>
              <p className="small muted">
                {en
                  ? "Uses the selected reading language. AI output is an imaginary beginning, never another child's real reply."
                  : "按所选阅读语言生成。AI 只提供虚构的开头，不代表其他孩子真实回复。"}
              </p>
            </div>
            <div className="creation-output" aria-live="polite">
              {creation ? (
                <>
                  <span className="planet-script">{t.aiLabel}</span>
                  <p className="creation-sources">
                    {t[creation.mode]} ·{" "}
                    {creation.sourceIds
                      .map(
                        (id) => communityStories.find((s) => s.id === id)?.name,
                      )
                      .join(" + ")}
                  </p>
                  <h2 lang={creation.language}>{creation.title}</h2>
                  <p
                    lang={creation.language}
                    dir={creation.language === "ar" ? "rtl" : "auto"}
                  >
                    {creation.body}
                  </p>
                  <div className="creation-invitation" lang={creation.language}>
                    <Sparkle size={20} />
                    <p>{creation.invitation}</p>
                  </div>
                  <p className="creation-activity" lang={creation.language}>
                    {creation.activity}
                  </p>
                  {createdImage ? (
                    <img src={createdImage} alt={creation.title} />
                  ) : (
                    <button
                      className="text-link"
                      disabled={!!busy}
                      onClick={image}
                    >
                      {busy === "image" ? (
                        waitText(t.imageWork)
                      ) : (
                        <>
                          {t.image}
                          <ArrowUpRight size={17} />
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="imagination-sketch">
                    <GlobeHemisphereWest size={64} weight="thin" />
                    <span>+</span>
                    <BookOpen size={55} weight="thin" />
                  </div>
                  <h2>
                    {en
                      ? "An encounter is waiting to happen."
                      : "一场相遇，等你们来开头。"}
                  </h2>
                  <p>
                    {en
                      ? "Choose two worlds. Keep, change or ignore anything AI suggests."
                      : "选两个小世界。AI 写出的内容，可以喜欢、可以修改，也可以完全推翻。"}
                  </p>
                </>
              )}
            </div>
          </div>
          <section className="same-question">
            <div>
              <span className="planet-script">
                One question, around the world.
              </span>
              <h2>{t.same}</h2>
              <p>{t.sameText}</p>
            </div>
            <div className="question-answers">
              {["moon", "desert", "rain"].map((id) => {
                const s = communityStories.find((x) => x.id === id);
                return (
                  <blockquote key={id}>
                    “{en ? s.english.quote : s.text.quote}”
                    <cite>
                      {s.name} · {s.region[locale]} · {t.demo}
                    </cite>
                  </blockquote>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {tab === "mail" && (
        <div
          className="planet-mail"
          role="tabpanel"
          id="planet-panel-mail"
          aria-labelledby="planet-tab-mail"
        >
          <div className="mail-heading">
            <span className="planet-script">Small kindness, delivered.</span>
            <h1>{t.mail}</h1>
            <p>{t.demoNote}</p>
            <button
              className="text-link"
              onClick={() =>
                setSocial((s) => ({
                  ...s,
                  inbox: s.inbox.map((n) => ({ ...n, read: true })),
                }))
              }
              disabled={!unread}
            >
              <Check size={17} />
              {t.clear}
            </button>
          </div>
          <div className="mail-layout">
            <div className="mail-list">
              {social.inbox.length ? (
                social.inbox.map((n) => {
                  const s =
                    communityStories.find((story) => story.id === n.story) ||
                    communityStories[0];
                  return (
                    <button
                      className={`letter-envelope ${n.read ? "" : "unread"}`}
                      key={n.id}
                      onClick={() => {
                        setSocial((old) => ({
                          ...old,
                          inbox: old.inbox.map((x) =>
                            x.id === n.id ? { ...x, read: true } : x,
                          ),
                        }));
                        choose(s);
                        setDetail(true);
                      }}
                    >
                      <span className="letter-stamp">
                        <Heart weight="light" size={28} />
                      </span>
                      <span className="letter-copy">
                        <small>
                          {n.type === "received" ? t.received : t.sent} ·{" "}
                          {t.localOnly}
                        </small>
                        <strong>
                          {n.type === "received"
                            ? en
                              ? `A little heart from ${s.name}`
                              : `${s.name} 给练习光寄来一枚喜欢`
                            : en
                              ? `Your heart for ${s.name}`
                              : `你给 ${s.name} 寄出了一枚喜欢`}
                        </strong>
                        <span>
                          {n.type === "received"
                            ? en
                              ? "A simulated reply: I would love to visit your walking garden!"
                              : "模拟回复：我也想去你的会走路的花园做客！"
                            : en
                              ? "Kindness has found another little world."
                              : "谢谢你认真听见另一个小世界。"}
                        </span>
                      </span>
                      {!n.read && (
                        <span className="unread-dot" aria-label={t.new} />
                      )}
                      <ArrowUpRight size={18} />
                    </button>
                  );
                })
              ) : (
                <div className="mail-empty">
                  <EnvelopeSimple size={65} weight="thin" />
                  <h2>{t.empty}</h2>
                  <p>{t.emptyText}</p>
                  <button
                    className="text-link"
                    onClick={() =>
                      social.lit ? notify(t.lit) : setPractice(true)
                    }
                  >
                    {t.light}
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
            <aside className="passport">
              <Stamp size={34} weight="thin" />
              <h2>{t.passport}</h2>
              <p>{t.savedNote}</p>
              <div className="passport-stamps">
                {social.stamps.map((id) => {
                  const s = communityStories.find((x) => x.id === id);
                  return (
                    s && (
                      <button
                        key={id}
                        onClick={() => {
                          choose(s);
                          setDetail(true);
                        }}
                      >
                        <Sparkle size={26} weight="light" />
                        <strong>{s.name}</strong>
                        <small>{s.region[locale]}</small>
                      </button>
                    )
                  );
                })}
              </div>
              {!social.stamps.length && (
                <p className="small muted">{t.noStamps}</p>
              )}
            </aside>
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="planet-error">
          {error}
          <button
            aria-label={en ? "Dismiss error" : "关闭提示"}
            onClick={() => setError("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {storageFailed && (
        <p role="status" className="planet-error">
          {en
            ? "Device storage is unavailable. Interactions will be lost when you leave."
            : "当前无法保存到本机，离开页面后互动记录会丢失。"}
        </p>
      )}
      <PlanetModal
        open={detail}
        onClose={() => setDetail(false)}
        onNext={() => stepPaper(1)}
        onPrevious={() => stepPaper(-1)}
        label={en ? "Nearby little paper" : "附近的童年小报"}
      >
        <article className="full-community-paper" key={selected.id}>
          {PaperContent({ full: true })}
          {error && <p role="alert">{error}</p>}
        </article>
        <nav
          className="planet-paper-navigation"
          aria-label={en ? "Switch papers" : "切换小报"}
        >
          <button
            disabled={localStories.length < 2}
            onClick={() => stepPaper(-1)}
          >
            <ArrowLeft size={17} />
            {en ? "Previous light" : "上一束"}
          </button>
          <span>{en ? "← → Switch · Esc Close" : "← → 切换 · Esc 关闭"}</span>
          <button
            disabled={localStories.length < 2}
            onClick={() => stepPaper(1)}
          >
            {en ? "Next light" : "下一束"}
            <ArrowRight size={17} />
          </button>
        </nav>
      </PlanetModal>
      <PlanetModal
        open={practice}
        onClose={() => setPractice(false)}
        label={t.practiceTitle}
      >
        <div className="practice-letter">
          <Sparkle size={42} weight="thin" />
          <h2>{t.practiceTitle}</h2>
          <p>{t.practiceText}</p>
          <div className="practice-preview">
            <small>{t.printed}</small>
            <h3>
              {communityStories[0].name} ·{" "}
              {en
                ? communityStories[0].english.title
                : communityStories[0].text.title}
            </h3>
            <p>
              “
              {en
                ? communityStories[0].english.quote
                : communityStories[0].text.quote}
              ”
            </p>
          </div>
          <button className="primary" onClick={addPractice}>
            <Sparkle size={19} />
            {t.practiceGo}
          </button>
        </div>
      </PlanetModal>
      <PlanetModal
        open={!!consentTask}
        onClose={() => setConsentTask(null)}
        label={t.consentTitle}
      >
        <div className="planet-ai-consent">
          <Sparkle size={35} weight="thin" />
          <h2>{t.consentTitle}</h2>
          <p>{t.consent}</p>
          <label className="consent-check">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            {t.agree}
          </label>
          <button
            className="primary"
            disabled={!agree}
            onClick={() => {
              const task = consentTask;
              consent.current = true;
              setConsentTask(null);
              runAI(task);
            }}
          >
            {t.confirm}
            <ArrowRight size={17} />
          </button>
        </div>
      </PlanetModal>
    </section>
  );
}
