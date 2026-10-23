import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Asterisk,
  BookmarkSimple,
  BookOpen,
  Check,
  CircleNotch,
  DownloadSimple,
  UploadSimple,
  LockKey,
  Microphone,
  Stop,
  PaperPlaneTilt,
  Printer,
  Trash,
  X,
  GlobeHemisphereWest,
  Quotes,
  PencilSimple,
  Sparkle,
} from "@phosphor-icons/react";
import {
  workQuestions,
  workProfileSchema,
  workArchiveSchema,
} from "../../shared/workplace.mjs";
import { workSample, workStories } from "./sample";
import {
  saveIssue,
  getIssues,
  removeIssue,
  exportIssue,
  importIssue,
} from "./storage";
import { startRecording } from "../audio";
import PaperGlobe from "../PaperGlobe";
import PlanetModal from "../PlanetModal";
import { nearbyStories, viewerTimezone } from "../planet-time.mjs";
import "../community.css";
import "./style.css";

const context = ({ profile, answers }) => ({ profile, answers });
const dateLabel = (date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
async function api(path, data) {
  const response = await fetch(import.meta.env.BASE_URL + "api/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "暂时没接通，请稍后重试。");
  return result;
}
const Loading = ({ children }) => (
  <span className="busy" role="status">
    <CircleNotch size={18} className="spin" />
    {children}
  </span>
);

function App() {
  const [view, setView] = useState(
    location.hash === "#planet" ? "planet" : "home",
  );
  const [issue, setIssue] = useState(null),
    [issues, setIssues] = useState([]),
    [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(""),
    [consent, setConsent] = useState(false),
    [saving, setSaving] = useState(false);
  const saveQueue = useRef(Promise.resolve()),
    saveTicket = useRef(0);
  const sample = issue?.id === workSample.id;
  const refresh = () =>
    getIssues()
      .then(setIssues)
      .catch((e) => setNotice(e.message));
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!issue || sample) return;
    setSaving(true);
    const ticket = ++saveTicket.current;
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => saveIssue(issue));
    saveQueue.current
      .then(() => {
        if (ticket === saveTicket.current) setSaving(false);
        return refresh();
      })
      .catch((e) => {
        setSaving(false);
        setNotice(e.message);
      });
  }, [issue]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    history.replaceState(
      null,
      "",
      location.pathname +
        location.search +
        (view === "planet" ? "#planet" : ""),
    );
  }, [view]);
  const begin = () => setModal("setup");
  const showSample = () => {
    setIssue(structuredClone(workSample));
    setView("report");
  };
  async function start(profile) {
    await api("session", { dataConsent: true });
    const next = {
      version: "partner-v1",
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      profile,
      answers: [],
      report: null,
      images: {},
    };
    await saveIssue(next);
    setIssue(next);
    setConsent(true);
    setModal(null);
    setView("interview");
    refresh();
  }
  async function authorize() {
    if (!consent) {
      setModal("consent");
      return false;
    }
    await api("session", { dataConsent: true });
    return true;
  }
  const go = (next) => {
    setView(next);
    if (next === "archive") refresh();
  };
  return (
    <div className="partner-ui">
      <a className="skip-link" href="#main">
        跳至正文
      </a>
      <header className="work-header">
        <button
          className="work-brand"
          onClick={() => go("home")}
          aria-label="同路人首页"
        >
          <span className="brand-symbol">
            <Asterisk weight="bold" size={26} />
          </span>
          <span>
            同路人<small>PARTNER</small>
          </span>
        </button>
        <nav aria-label="主导航">
          <button
            aria-current={view === "report" && sample ? "page" : undefined}
            onClick={showSample}
          >
            翻翻样刊
          </button>
          <button
            aria-current={view === "planet" ? "page" : undefined}
            onClick={() => go("planet")}
          >
            同路星球
          </button>
          <button
            aria-current={view === "archive" ? "page" : undefined}
            onClick={() => go("archive")}
          >
            我的手记{" "}
            <span className="nav-count">
              {issues.length.toString().padStart(2, "0")}
            </span>
          </button>
        </nav>
        <button className="header-start" onClick={begin}>
          写下这一程 <ArrowUpRight size={16} />
        </button>
      </header>
      <main id="main">
        {view === "home" && (
          <Home
            begin={begin}
            showSample={showSample}
            planet={() => go("planet")}
          />
        )}
        {view === "interview" && issue && (
          <Interview
            key={issue.id}
            issue={issue}
            setIssue={setIssue}
            saving={saving}
            authorize={authorize}
            notify={setNotice}
            onReport={() => go("report")}
            onArchive={() => go("archive")}
          />
        )}
        {view === "report" && issue && (
          <Report
            key={issue.id}
            issue={issue}
            setIssue={setIssue}
            sample={sample}
            begin={begin}
            onEdit={() => go("interview")}
            authorize={authorize}
            notify={setNotice}
            onExport={() => setModal("export")}
          />
        )}
        {view === "archive" && (
          <section className="work-wrap archive-page reveal">
            <div className="section-kicker">A record of your own</div>
            <div className="page-heading">
              <div>
                <h1>
                  走过的路，
                  <br />
                  留一份给自己。
                </h1>
                <p>你的复盘和小报保存在这台设备上。换设备前，请先加密导出。</p>
              </div>
              <div className="actions">
                <button className="primary" onClick={begin}>
                  写新的一期 <ArrowRight size={18} />
                </button>
                <button className="outline" onClick={() => setModal("import")}>
                  <UploadSimple size={18} />
                  导入档案
                </button>
              </div>
            </div>
            {!issues.length ? (
              <div className="work-empty">
                <BookOpen size={42} weight="thin" />
                <h2>第一篇手记，从最近的一件小事开始。</h2>
                <p>不用等到升职或转折，日常的经历也值得被看见。</p>
                <button className="text-button" onClick={showSample}>
                  先看一份完整样刊 <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <div className="issue-list">
                {issues.map((item, index) => (
                  <article key={item.id}>
                    <span className="issue-index">
                      {String(issues.length - index).padStart(2, "0")}
                    </span>
                    <button
                      className="issue-open"
                      onClick={() => {
                        setIssue(item);
                        go(item.report ? "report" : "interview");
                      }}
                    >
                      <small>
                        {dateLabel(item.date)} · {item.profile.nickname} ·{" "}
                        {item.profile.role}
                      </small>
                      <h2>{item.report?.title || "还在书写的这一程"}</h2>
                      <span>
                        {item.report
                          ? "翻开人物报"
                          : `${item.answers.length} / 8 个回答 · 继续复盘`}{" "}
                        <ArrowUpRight size={17} />
                      </span>
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`删除${item.profile.nickname}的${dateLabel(item.date)}手记`}
                      onClick={() => setModal({ delete: item })}
                    >
                      <Trash size={20} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {view === "planet" && <WorkPlanet notify={setNotice} begin={begin} />}
      </main>
      <footer className="work-footer">
        <span>
          同路人 <i>Partner</i> <span className="footer-dot">·</span>{" "}
          每一程，都有自己的注脚。
        </span>
        <button onClick={() => setModal("about")}>
          关于与数据说明 <ArrowUpRight size={13} />
        </button>
      </footer>
      <PlanetModal
        open={!!modal}
        onClose={() => setModal(null)}
        label={modal === "setup" ? "开始工作复盘" : "同路人对话框"}
      >
        {modal === "setup" && <Setup onStart={start} />}
        {modal === "consent" && (
          <Consent
            onConfirm={async () => {
              await api("session", { dataConsent: true });
              setConsent(true);
              setModal(null);
              setNotice("已确认，可以再次点击刚才的 AI 操作。");
            }}
          />
        )}
        {modal === "about" && <About />}
        {(modal === "export" || modal === "import") && (
          <ArchiveTransfer
            mode={modal}
            issue={issue}
            onDone={(next) => {
              setModal(null);
              if (next) {
                setIssue(next);
                go(next.report ? "report" : "interview");
              }
              refresh();
              setNotice(
                next ? "档案已导入本机。" : "加密档案已下载，请保管好密码。",
              );
            }}
          />
        )}
        {modal?.delete && (
          <div className="dialog-content">
            <span className="section-kicker">收好，再告别</span>
            <h2>删除这篇本机手记？</h2>
            <p>删除后无法从本站恢复。需要保留时，可以先返回小报加密导出。</p>
            <button
              className="primary"
              onClick={async () => {
                try {
                  await removeIssue(modal.delete.id);
                  if (issue?.id === modal.delete.id) setIssue(null);
                  refresh();
                  setModal(null);
                  setNotice("这篇手记已从本机删除。");
                } catch (e) {
                  setNotice(e.message);
                }
              }}
            >
              确认删除
            </button>
          </div>
        )}
      </PlanetModal>
      {notice && (
        <div className="work-toast" role="status">
          {notice}
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function Home({ begin, showSample, planet }) {
  return (
    <>
      <section className="home-hero work-wrap">
        <div className="hero-copy reveal">
          <div className="section-kicker">
            <span /> A little paper for your working life
          </div>
          <h1>
            认真工作的你，
            <br />
            也值得被<span className="underlined">看见。</span>
          </h1>
          <p className="hero-intro">
            从最近的成就、疲惫和一点点向往里，
            <br className="desktop-break" />
            重新认识工作中的自己。
          </p>
          <p className="hero-detail">
            八个问题，一次安静的复盘。把零散的经历，
            <br className="desktop-break" />
            编成一份属于你的职场人物报。
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={begin}>
              为自己做一份 <ArrowUpRight size={20} />
            </button>
            <button className="text-button" onClick={showSample}>
              先翻翻样刊 <ArrowRight size={17} />
            </button>
          </div>
          <span className="hero-footnote">
            <LockKey size={14} /> 约 15 分钟 · 可随时暂存 · 本机私藏
          </span>
        </div>
        <div
          className="hero-composition reveal"
          aria-label="一份关于工作与自己的纸上手记预览"
        >
          <div className="composition-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="margin-note">
            给这一程的自己
            <br />
            <span>A note to you.</span>
          </div>
          <div className="back-paper">
            <span>慢一点，也在往前。</span>
          </div>
          <button
            className="preview-paper"
            onClick={showSample}
            aria-label="翻开林溪的虚构职场样刊"
          >
            <div className="paper-masthead">
              <span>同路人</span>
              <span>人物特刊 / 001</span>
            </div>
            <div className="paper-hairline" />
            <small className="paper-overline">林溪 · 产品设计师</small>
            <h2>
              在纷杂的声音里，
              <br />
              找到清楚的那条线。
            </h2>
            <div className="paper-diagram" aria-hidden="true">
              <div className="diagram-ring ring-one" />
              <div className="diagram-ring ring-two" />
              <div className="diagram-line" />
              <span className="diagram-node node-one" />
              <span className="diagram-node node-two" />
              <span className="diagram-node node-three" />
              <span className="diagram-label label-one">经历</span>
              <span className="diagram-label label-two">线索</span>
              <span className="diagram-label label-three">下一步</span>
              <Asterisk size={52} weight="thin" />
            </div>
            <blockquote>
              “比起赶紧给出答案，
              <br />
              我更想先把问题看清楚。”
            </blockquote>
            <div className="paper-bottom">
              <span>此刻的你，值得一页纸。</span>
              <ArrowUpRight size={19} />
            </div>
          </button>
          <div className="paper-tag">
            <span>不是履历上的你</span>
            <strong>是正在经历的你。</strong>
            <span className="tag-dot" />
          </div>
        </div>
      </section>
      <section className="home-process work-wrap">
        <div className="process-heading">
          <span className="section-kicker">不急着给答案</span>
          <h2>
            把日常的片段，
            <br />
            变成往前的线索。
          </h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>聊聊最近的工作</h3>
              <p>
                成就感从哪里来，什么正在消耗你。打字或录音，按自己的节奏说。
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>读懂自己的这一程</h3>
              <p>
                AI 根据原话整理工作方式的线索，每一条观察，都能回到你的回答。
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>带走一个小小的行动</h3>
              <p>从可尝试的小实验开始。留下本期手记，下次带着新的经历回来。</p>
            </div>
          </li>
        </ol>
      </section>
      <section className="planet-invite work-wrap">
        <span className="planet-invite-symbol">
          <GlobeHemisphereWest size={66} weight="thin" />
        </span>
        <div>
          <span className="section-kicker">We are all on our way</span>
          <h2>抬头看看，也有人走在路上。</h2>
          <p>
            去同路星球，读一段远方的职场手记。也许一份不同的经历，会带来一个新问题。
          </p>
          <small>虚构人物与编辑示例 · 你的私人手记不会公开</small>
        </div>
        <button className="text-button" onClick={planet}>
          去同路星球 <ArrowUpRight size={20} />
        </button>
      </section>
      <div className="home-endnote work-wrap">
        <span>没有标准答案，也没有理想人设。</span>
        <p>这份小报，只想帮你把自己说得更清楚一点。</p>
      </div>
    </>
  );
}

function DataNote() {
  return (
    <p className="data-note">
      回答与小报保存在本机。你主动使用 AI
      时，相关文字或录音会经本站发送给火山方舟处理；服务端不保存正文。请用化名，省略公司、客户和同事的私密资料。清理浏览器会删除本机记录，可加密导出备份。
    </p>
  );
}
function Setup({ onStart }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="dialog-content"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          const profile = workProfileSchema.parse({
            nickname: data.get("nickname"),
            role: data.get("role"),
            stage: data.get("stage"),
          });
          await onStart(profile);
        } catch (e) {
          setError(e.issues ? "请检查称呼、工作角色和当前阶段。" : e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="section-kicker">这一程，从这里开始</span>
      <h2>
        先认识一下，
        <br />
        工作中的你。
      </h2>
      <p>不需要一份完整履历，几个简单的注脚就好。</p>
      <label>
        怎么称呼你
        <input
          name="nickname"
          required
          maxLength={20}
          placeholder="一个喜欢的称呼或化名"
          autoComplete="off"
        />
      </label>
      <label>
        现在的工作角色
        <input
          name="role"
          required
          maxLength={50}
          placeholder="例如：设计师、研发、运营、自由职业"
          autoComplete="off"
        />
      </label>
      <label>
        目前更接近哪一程
        <select name="stage" defaultValue="独立担当">
          <option>初入职场</option>
          <option>独立担当</option>
          <option>带领团队</option>
          <option>探索转向</option>
        </select>
      </label>
      <DataNote />
      <label className="checkbox-label">
        <input type="checkbox" required />
        我已成年，了解以上数据说明，愿意开始复盘。
      </label>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary wide" disabled={busy}>
        {busy ? (
          <Loading>正在打开手记…</Loading>
        ) : (
          <>
            开始写下这一程 <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}
function Consent({ onConfirm }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="dialog-content"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onConfirm();
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <LockKey size={32} weight="thin" />
      <h2>让 AI 读一读这份手记前。</h2>
      <DataNote />
      <label className="checkbox-label">
        <input type="checkbox" required />
        我已成年，了解并同意本次 AI 数据处理。
      </label>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary wide" disabled={busy}>
        {busy ? <Loading>正在确认…</Loading> : "确认并返回"}
      </button>
    </form>
  );
}

function Interview({
  issue,
  setIssue,
  saving,
  authorize,
  notify,
  onReport,
  onArchive,
}) {
  const [index, setIndex] = useState(() =>
    Math.min(
      workQuestions.findIndex(
        (q) => !issue.answers.some((a) => a.id === q.id),
      ) < 0
        ? 0
        : workQuestions.findIndex(
            (q) => !issue.answers.some((a) => a.id === q.id),
          ),
      7,
    ),
  );
  const [busy, setBusy] = useState(""),
    [followups, setFollowups] = useState({}),
    [recording, setRecording] = useState(false),
    [transcript, setTranscript] = useState("");
  const recorder = useRef(null),
    mounted = useRef(true),
    question = workQuestions[index],
    answer = issue.answers.find((a) => a.id === question.id)?.text || "";
  useEffect(
    () => () => {
      mounted.current = false;
      recorder.current?.cancel();
    },
    [],
  );
  const update = (text) =>
    setIssue((current) => ({
      ...current,
      report: null,
      images: {},
      answers: workQuestions.flatMap((q) => {
        const value =
          q.id === question.id
            ? text
            : current.answers.find((a) => a.id === q.id)?.text;
        return value?.trim()
          ? [{ id: q.id, question: q.title, text: value }]
          : [];
      }),
    }));
  const move = (next) => {
    setIndex(next);
    setTranscript("");
  };
  async function finishRecording() {
    const current = recorder.current;
    if (!current) return;
    recorder.current = null;
    setRecording(false);
    setBusy("audio");
    try {
      const audio = await current.stop();
      if (!audio) return;
      const data = await api("transcribe", { audio });
      if (mounted.current) setTranscript(data.text);
    } catch (e) {
      notify(e.message);
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  async function record() {
    if (recording) return finishRecording();
    setBusy("mic");
    try {
      if (!(await authorize())) return;
      const next = await startRecording(() => finishRecording());
      if (!mounted.current) {
        await next.cancel();
        return;
      }
      recorder.current = next;
      setRecording(true);
    } catch (e) {
      notify(
        e.name === "NotAllowedError"
          ? "麦克风未获允许，可以继续打字记录。"
          : e.message,
      );
    } finally {
      if (mounted.current) setBusy("");
    }
  }
  async function follow() {
    setBusy("follow");
    try {
      if (!(await authorize())) return;
      await saveIssue(issue);
      const data = await api("work/followup", {
        profile: issue.profile,
        answers: [issue.answers.find((a) => a.id === question.id)],
      });
      setFollowups((old) => ({ ...old, [question.id]: data }));
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy("");
    }
  }
  async function generate() {
    setBusy("report");
    try {
      if (!(await authorize())) return;
      await saveIssue(issue);
      const { report } = await api("work/report", context(issue));
      const next = { ...issue, report };
      await saveIssue(next);
      setIssue(next);
      onReport();
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="interview-page work-wrap reveal">
      <div className="interview-top">
        <span className="section-kicker">{issue.profile.nickname}的这一程</span>
        <span className="save-state">
          <span className={saving ? "pending-dot" : "saved-dot"} />
          {saving ? "正在保存…" : "已保存到本机"}
        </span>
      </div>
      <div className="interview-layout">
        <aside className="question-nav">
          <h1>
            慢慢说，
            <br />
            从一件小事开始。
          </h1>
          <p>不必答完所有题。留下四个回答，就可以编排小报。</p>
          <ol>
            {workQuestions.map((q, i) => (
              <li key={q.id}>
                <button
                  disabled={!!busy || recording}
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => move(i)}
                >
                  <span>
                    {issue.answers.some((a) => a.id === q.id) ? (
                      <Check size={14} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  {q.chapter}
                  {i % 2 ? " · 下" : " · 上"}
                </button>
              </li>
            ))}
          </ol>
          <button
            className="text-button save-exit"
            disabled={!!busy || recording}
            onClick={async () => {
              try {
                await saveIssue(issue);
                onArchive();
              } catch (e) {
                notify(e.message);
              }
            }}
          >
            暂存，改天继续 <ArrowUpRight size={16} />
          </button>
        </aside>
        <div className="question-sheet">
          <div className="question-sheet-top">
            <span>{question.chapter}</span>
            <span>QUESTION {String(index + 1).padStart(2, "0")} / 08</span>
          </div>
          <h2>{question.title}</h2>
          <p className="question-hint">{question.hint}</p>
          <label className="sr-only" htmlFor="work-answer">
            你的回答
          </label>
          <textarea
            id="work-answer"
            key={question.id}
            value={answer}
            onChange={(e) => update(e.target.value)}
            maxLength={2000}
            placeholder="当时发生了什么？从你记得的地方说起……"
            disabled={!!busy || recording}
          />
          <div className="answer-toolbar">
            <button
              className={
                recording ? "record-button is-recording" : "record-button"
              }
              disabled={!!busy}
              onClick={record}
            >
              {recording ? (
                <>
                  <Stop size={17} weight="fill" />
                  停止录音
                </>
              ) : busy === "audio" ? (
                <Loading>正在转写…</Loading>
              ) : (
                <>
                  <Microphone size={18} />
                  说给自己听
                </>
              )}
            </button>
            <small>
              {recording ? "正在录音，最长 60 秒" : `${answer.length} / 2000`}
            </small>
          </div>
          {transcript && (
            <div className="transcript">
              <strong>先核对，再放入手记</strong>
              <textarea
                aria-label="核对录音转写"
                value={transcript}
                maxLength={2000}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <div className="actions">
                <button
                  className="outline"
                  onClick={() => {
                    update((answer ? answer + "\n" : "") + transcript);
                    setTranscript("");
                  }}
                >
                  放入回答
                </button>
                <button
                  className="text-button"
                  onClick={() => setTranscript("")}
                >
                  舍弃这段
                </button>
              </div>
            </div>
          )}
          <div className="followup-area">
            {followups[question.id] ? (
              <>
                <span>
                  <Sparkle size={15} /> AI 陪你再想一点
                </span>
                <p>{followups[question.id].reflection}</p>
                <strong>{followups[question.id].question}</strong>
                <small>可以把补充写在上面的回答里，也可以就停在这里。</small>
              </>
            ) : (
              <button
                className="text-button"
                disabled={!answer.trim() || !!busy || recording}
                onClick={follow}
              >
                {busy === "follow" ? (
                  <Loading>正在读你的回答…</Loading>
                ) : (
                  <>
                    <Sparkle size={17} />
                    想深一点，让 AI 追问一句
                  </>
                )}
              </button>
            )}
          </div>
          <div className="question-controls">
            <button
              className="text-button"
              disabled={index === 0 || !!busy || recording}
              onClick={() => move(index - 1)}
            >
              <ArrowLeft size={17} />
              上一题
            </button>
            {index < 7 ? (
              <button
                className="primary"
                disabled={!!busy || recording}
                onClick={() => move(index + 1)}
              >
                {answer.trim() ? "继续下一题" : "先跳过这一题"}
                <ArrowRight size={17} />
              </button>
            ) : (
              <span className="question-complete">
                这一程，你已经留下 {issue.answers.length} 个片段。
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="generate-bar">
        <div>
          <span>把散落的片段，编成一份小报。</span>
          <small>
            {issue.answers.length} / 8 个回答{" "}
            {issue.answers.length < 4
              ? "· 至少四个即可开始"
              : "· 你可以继续完善，也可以现在编排"}
          </small>
        </div>
        <button
          className="primary"
          disabled={issue.answers.length < 4 || !!busy || recording}
          onClick={generate}
        >
          {busy === "report" ? (
            <Loading>编辑正在编排这一期…</Loading>
          ) : (
            <>
              编排我的人物报 <ArrowUpRight size={19} />
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function Report({
  issue,
  setIssue,
  sample,
  begin,
  onEdit,
  authorize,
  notify,
  onExport,
}) {
  const { report, profile } = issue;
  const [imageBusy, setImageBusy] = useState(null),
    [messages, setMessages] = useState([]),
    [message, setMessage] = useState(""),
    [chatBusy, setChatBusy] = useState(false);
  const [checked, setChecked] = useState([]);
  async function illustrate(index) {
    setImageBusy(index);
    try {
      if (!(await authorize())) return;
      const experiment = report.experiments[index];
      const { image } = await api("image", {
        scene: `${experiment.title}。${experiment.action}`,
      });
      const next = { ...issue, images: { ...issue.images, [index]: image } };
      if (!sample) await saveIssue(next);
      setIssue(next);
    } catch (e) {
      notify(e.message);
    } finally {
      setImageBusy(null);
    }
  }
  async function ask(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setChatBusy(true);
    try {
      if (!(await authorize())) return;
      const sent = [...messages, { role: "user", content: text }].slice(-15);
      const data = await api("work/memory", {
        ...context(issue),
        messages: sent,
      });
      setMessages([...sent, { role: "assistant", content: data.text }]);
      setMessage("");
    } catch (e) {
      notify(e.message);
    } finally {
      setChatBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(report.conversation.opening);
      notify("沟通开场已复制，可按实际情况修改后使用。");
    } catch {
      notify("浏览器无法自动复制，请选中文字复制。");
    }
  }
  return (
    <section className="report-page work-wrap reveal">
      <div className="report-tools">
        <button className="text-button" onClick={sample ? begin : onEdit}>
          {sample ? "用我的经历做一份" : "回到原始回答"}
          <PencilSimple size={16} />
        </button>
        <span>
          {sample
            ? "编辑样刊 · 全部人物与经历均为虚构"
            : "私人手记 · AI 根据本次回答整理"}
        </span>
        <div className="actions">
          <button
            className="icon-button"
            aria-label="打印或存为 PDF"
            onClick={() => window.print()}
          >
            <Printer size={20} />
          </button>
          <button className="outline" onClick={onExport}>
            <DownloadSimple size={17} />
            加密保存
          </button>
        </div>
      </div>
      <article className="work-newspaper">
        <div className="newspaper-masthead">
          <span>同路人</span>
          <i>Partner</i>
          <span>工作与自己的特别刊</span>
        </div>
        <div className="newspaper-dateline">
          <span>
            {profile.nickname} · {profile.role} · {profile.stage}
          </span>
          <span>{dateLabel(issue.date)}</span>
        </div>
        <div className="newspaper-title">
          <span className="section-kicker">Portrait of a working life</span>
          <h1>{report.title}</h1>
          <p>{report.subtitle}</p>
        </div>
        <p className="newspaper-intro">{report.introduction}</p>
        <div className="newspaper-section-heading">
          <span>01 / 从经历里，发现线索</span>
          <small>每条观察，都有来处。</small>
        </div>
        <div className="observations">
          {report.observations.map((item, i) => (
            <section className="observation" key={i}>
              <span className="observation-number">0{i + 1}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <details>
                <summary>翻回原话 · {item.evidence.length} 处引用</summary>
                {item.evidence.map((id) => {
                  const answer = issue.answers.find((a) => a.id === id);
                  return (
                    answer && (
                      <blockquote key={id}>
                        <small>{answer.question}</small>
                        {answer.text}
                      </blockquote>
                    )
                  );
                })}
              </details>
              <div className="open-question">
                <span>留一个问题</span>
                {item.question}
              </div>
            </section>
          ))}
        </div>
        <div className="newspaper-section-heading">
          <span>02 / 下一步，小一点也可以</span>
          <small>尝试、观察，再决定。</small>
        </div>
        <div className="experiments">
          {report.experiments.map((item, i) => (
            <section className="experiment" key={i}>
              <div className="experiment-left">
                <span>EXPERIMENT / 0{i + 1}</span>
                <h2>{item.title}</h2>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={checked.includes(i)}
                    onChange={() =>
                      setChecked((old) =>
                        old.includes(i)
                          ? old.filter((n) => n !== i)
                          : [...old, i],
                      )
                    }
                  />
                  {checked.includes(i)
                    ? "这次先试这一件"
                    : "选为本次想试的一件"}
                </label>
              </div>
              <div className="experiment-body">
                <p>{item.action}</p>
                <dl>
                  <dt>观察什么</dt>
                  <dd>{item.signal}</dd>
                  <dt>给自己留的边界</dt>
                  <dd>{item.boundary}</dd>
                </dl>
                {issue.images[i] ? (
                  <figure>
                    <img
                      src={issue.images[i]}
                      alt={`${item.title}的 AI 概念插画`}
                    />
                    <figcaption>AI 生成的工作场景想象</figcaption>
                  </figure>
                ) : (
                  <button
                    className="text-button image-action"
                    disabled={imageBusy !== null}
                    onClick={() => illustrate(i)}
                  >
                    {imageBusy === i ? (
                      <Loading>正在画下这个片段…</Loading>
                    ) : (
                      <>
                        <Sparkle size={16} />
                        把这个小实验画下来
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>
        <div className="conversation-note">
          <Quotes size={31} weight="thin" />
          <div>
            <span className="section-kicker">如果不知道，怎么开口</span>
            <h2>{report.conversation.situation}</h2>
            <p>{report.conversation.opening}</p>
            <button className="text-button" onClick={copy}>
              复制这段开场 <ArrowUpRight size={16} />
            </button>
            <small>一段可自行改写的沟通草稿，不代表已发生的对话。</small>
          </div>
        </div>
        <div className="closing-note">
          <span className="section-kicker">写给下一程的自己</span>
          <p>{report.closing}</p>
          <Asterisk size={28} weight="thin" />
        </div>
        <details className="all-answers">
          <summary>
            把这一期的 {issue.answers.length} 个原始片段，完整收好
          </summary>
          {issue.answers.map((answer) => (
            <section key={answer.id}>
              <h3>{answer.question}</h3>
              <p>{answer.text}</p>
            </section>
          ))}
        </details>
        <div className="newspaper-colophon">
          本期只记录此刻的经历与待验证的线索，不作人格、能力评级或职业预测。
          <br />
          {sample
            ? "全部内容为编辑编写的虚构示例。"
            : "AI 整理可能有偏差，请回到原话核对。"}{" "}
          同路人 · Partner
        </div>
      </article>
      <section className="archive-chat">
        <div>
          <span className="section-kicker">The conversation continues</span>
          <h2>读完，还想聊聊？</h2>
          <p>让 AI 陪你回看这份记录。没有写下的事，它不会替你补上。</p>
          <small>对话只留在本次页面，重新打开后清空。</small>
        </div>
        <div className="chat-panel">
          <div className="chat-messages" aria-live="polite">
            {messages.length ? (
              messages.map((item, i) => (
                <p className={`chat-message ${item.role}`} key={i}>
                  <small>{item.role === "user" ? "你" : "同路人 · AI"}</small>
                  {item.content}
                </p>
              ))
            ) : (
              <p className="chat-placeholder">
                比如：“从我的回答里，哪一件事值得先试两周？”
              </p>
            )}
            {chatBusy && <Loading>正在回看记录…</Loading>}
          </div>
          <form onSubmit={ask}>
            <label className="sr-only" htmlFor="archive-question">
              继续聊聊这份手记
            </label>
            <input
              id="archive-question"
              maxLength={1500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="关于这一程，你还在想什么？"
              disabled={chatBusy}
            />
            <button
              aria-label="发送问题"
              disabled={!message.trim() || chatBusy}
            >
              <PaperPlaneTilt size={21} />
            </button>
          </form>
        </div>
      </section>
    </section>
  );
}

function WorkPlanet({ notify, begin }) {
  const [now, setNow] = useState(new Date()),
    [selected, setSelected] = useState(null),
    [open, setOpen] = useState(false),
    [filter, setFilter] = useState("nearby");
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem("partner-stamps") || "[]");
      return Array.isArray(data)
        ? data.filter((id) => workStories.some((s) => s.id === id))
        : [];
    } catch {
      return [];
    }
  });
  const viewer = viewerTimezone(now),
    nearby = nearbyStories(workStories, viewer, now),
    stories =
      filter === "saved"
        ? workStories.filter((s) => bookmarks.includes(s.id))
        : nearby;
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const choose = (story) => {
    setSelected(story);
    setOpen(true);
  };
  const turn = (direction) => {
    if (!stories.length) return;
    const index = stories.findIndex((s) => s.id === selected?.id);
    setSelected(stories[(index + direction + stories.length) % stories.length]);
  };
  function bookmark() {
    const next = bookmarks.includes(selected.id)
      ? bookmarks.filter((id) => id !== selected.id)
      : [...bookmarks, selected.id];
    try {
      localStorage.setItem("partner-stamps", JSON.stringify(next));
      setBookmarks(next);
    } catch {
      notify("浏览器未能保存收藏，请检查本机存储设置。");
    }
  }
  return (
    <section className="work-planet reveal">
      <div className="work-wrap planet-heading">
        <div>
          <span className="section-kicker">Different lives, a shared sky</span>
          <h1>
            每一束光，
            <br />
            都有正在走的路。
          </h1>
          <p>
            在你附近的时区，读一段不同的工作手记。
            <br />
            不为比较，只是多一个看待日常的角度。
          </p>
        </div>
        <div className="planet-filter" role="group" aria-label="手记范围">
          <button
            aria-pressed={filter === "nearby"}
            onClick={() => setFilter("nearby")}
          >
            此刻的同路人
          </button>
          <button
            aria-pressed={filter === "saved"}
            onClick={() => setFilter("saved")}
          >
            <BookmarkSimple size={16} />
            我的摘页 {bookmarks.length}
          </button>
        </div>
      </div>
      <div className="work-wrap planet-demo-note">
        虚构人物 · 编辑示例 · 收藏仅保存在本机 · 你的私人手记不会出现在这里
      </div>
      {filter === "nearby" && (
        <PaperGlobe
          edition="workplace"
          stories={nearby}
          selected={selected}
          onSelect={choose}
          viewer={viewer}
          now={now}
          english={false}
        />
      )}
      {filter === "saved" && (
        <div className="work-wrap planet-saved">
          {stories.length ? (
            stories.map((story) => (
              <button key={story.id} onClick={() => choose(story)}>
                <small>
                  {story.name} · {story.role} · {story.region.zh}
                </small>
                <h2>{story.text.title}</h2>
                <ArrowUpRight size={22} />
              </button>
            ))
          ) : (
            <div className="work-empty">
              <BookmarkSimple size={36} weight="thin" />
              <h2>把打动你的一段，摘下来。</h2>
              <p>在星球上打开光束，就能收藏一篇虚构手记。</p>
              <button
                className="text-button"
                onClick={() => setFilter("nearby")}
              >
                回到星球 <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
      {filter === "nearby" && !nearby.length && (
        <div className="work-wrap planet-none">
          这个时区附近暂时没有编辑示例。你可以先翻翻首页的完整样刊。
        </div>
      )}
      <div className="planet-bottom work-wrap">
        <span>每个人的工作，都不止一种可能。</span>
        <button className="text-button" onClick={begin}>
          写下我的这一程 <ArrowUpRight size={18} />
        </button>
      </div>
      <PlanetModal
        open={open && !!selected}
        onClose={() => setOpen(false)}
        onPrevious={stories.length > 1 ? () => turn(-1) : undefined}
        onNext={stories.length > 1 ? () => turn(1) : undefined}
        label="虚构职场手记"
      >
        {selected && (
          <article className="planet-work-story">
            <span className="section-kicker">来自同一片天空的工作手记</span>
            <div className="story-person">
              {selected.name}
              <span>
                {selected.role} · {selected.region.zh}
              </span>
            </div>
            <h2>{selected.text.title}</h2>
            <blockquote>{selected.quote}</blockquote>
            <div className="story-step">
              <span>下次，想试试</span>
              <p>{selected.step}</p>
            </div>
            <button className="outline" onClick={bookmark}>
              <BookmarkSimple
                weight={bookmarks.includes(selected.id) ? "fill" : "regular"}
                size={18}
              />
              {bookmarks.includes(selected.id) ? "已摘下这一页" : "摘下这一页"}
            </button>
            <p className="story-fiction">
              人物、地点与经历均为虚构创作，不代表真实用户。
            </p>
            {stories.length > 1 && (
              <div className="story-pagination">
                <button className="text-button" onClick={() => turn(-1)}>
                  <ArrowLeft size={17} />
                  上一束
                </button>
                <button className="text-button" onClick={() => turn(1)}>
                  下一束
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </article>
        )}
      </PlanetModal>
    </section>
  );
}

function ArchiveTransfer({ mode, issue, onDone }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="dialog-content"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          if (mode === "export") {
            if (data.get("password") !== data.get("confirm"))
              throw new Error("两次密码不一致，请再检查一次。");
            await exportIssue(
              workArchiveSchema.parse(issue),
              data.get("password"),
            );
            onDone();
          } else {
            const file = data.get("file");
            if (!file?.size)
              throw new Error("请选择同路人导出的 .partner 档案。");
            const next = await importIssue(file, data.get("password"));
            onDone(next);
          }
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <LockKey size={30} weight="thin" />
      <h2>
        {mode === "export"
          ? "把这一程，妥帖收好。"
          : "把曾经的这一程，带回来。"}
      </h2>
      <p>
        {mode === "export"
          ? "密码只在本机用于加密，本站无法帮你找回。请把档案和密码分开保管。"
          : "请选择同路人导出的加密档案。导入后可继续阅读与复盘。"}
      </p>
      {mode === "import" && (
        <label>
          加密档案
          <input
            name="file"
            type="file"
            accept=".partner,application/json"
            required
          />
        </label>
      )}
      <label>
        保存密码
        <input
          type="password"
          name="password"
          required
          minLength={8}
          maxLength={200}
          autoComplete={mode === "export" ? "new-password" : "off"}
          placeholder="至少 8 位"
        />
      </label>
      {mode === "export" && (
        <label>
          再输入一次
          <input
            type="password"
            name="confirm"
            required
            minLength={8}
            maxLength={200}
            autoComplete="new-password"
          />
        </label>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary wide" disabled={busy}>
        {busy ? (
          <Loading>正在整理档案…</Loading>
        ) : mode === "export" ? (
          "加密并下载"
        ) : (
          "解密并导入"
        )}
      </button>
    </form>
  );
}
function About() {
  return (
    <div className="dialog-content">
      <span className="section-kicker">同路人 · Partner</span>
      <h2>
        给工作中的自己，
        <br />
        留一点说话的空间。
      </h2>
      <p>
        八个开放问题，一份带原话依据的职场人物报，三个小实验。它帮助你整理这次经历，不做心理测评、人格定型、能力评分或职业预测，也不代替你作出职业决定。
      </p>
      <h3>关于你的记录</h3>
      <DataNote />
      <p>
        本机记录未导出前并不加密，共享设备上请留意他人访问。没有账号云同步。加密档案使用
        PBKDF2-SHA256 与 AES-256-GCM，密码不会传给本站。
      </p>
      <h3>关于同路星球</h3>
      <p>
        所有人物、工作经历和地点都来自虚构编辑示例。收藏不跨设备同步，没有真实陌生人私信；你的私人回答和小报不会自动公开。
      </p>
      <h3>关于 AI</h3>
      <p>
        AI
        可能误读材料，请核对引用和建议。本站不持久化回答正文、原始录音或生成图片；第三方按其服务政策处理所提交内容。暂时不可用时，仍可阅读本机已保存的记录。
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
