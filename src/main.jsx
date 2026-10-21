import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Asterisk,
  BookOpen,
  Heart,
  Sparkle,
  Microphone,
  Stop,
  Check,
  X,
  DownloadSimple,
  UploadSimple,
  LockKey,
  Trash,
  CircleNotch,
  PaperPlaneTilt,
  Leaf,
  CaretDown,
  GithubLogo,
  Printer,
  PencilSimple,
  ShieldCheck,
  ChatCircle,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";
import { allQuestions, chapters } from "./questions";
import { sample } from "./sample";
import {
  getIssues,
  saveIssue,
  removeIssue,
  exportIssue,
  importIssue,
} from "./storage";
import { startRecording } from "./audio";
import "./style.css";
import WorldScene from "./WorldScene";
const Community = lazy(() => import("./Community"));
import "./community.css";
const BASE = import.meta.env.BASE_URL,
  heroImage = BASE + "images/little-world.webp";
async function api(path, data) {
  const r = await fetch(BASE + "api/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "暂时没接通，请重试。");
  return d;
}
const context = (issue) => ({ profile: issue.profile, answers: issue.answers });
function IconButton({ icon: Icon, label, ...rest }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...rest}>
      <Icon size={21} />
    </button>
  );
}
function Loading({ children }) {
  return (
    <span className="loading">
      <CircleNotch size={19} className="spin" />
      {children}
    </span>
  );
}
function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="小小人物报首页">
      <Asterisk weight="bold" className="brand-mark" />
      <span>
        小小人物报<small>KIDSPAPER</small>
      </span>
    </button>
  );
}
function App() {
  const [view, setView] = useState(
      location.hash === "#planet" ? "community" : "home",
    ),
    [issue, setIssue] = useState(null),
    [issues, setIssues] = useState([]),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(""),
    [consent, setConsent] = useState(false);
  const notify = (s) => setNotice(s);
  const openWorld = () => {
    setView("community");
    history.replaceState(
      null,
      "",
      location.pathname + location.search + "#planet",
    );
  };
  useEffect(() => {
    getIssues()
      .then(setIssues)
      .catch(() => notify("当前浏览器无法读取本机档案。仍可浏览样刊。"));
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (view !== "community" && location.hash === "#planet")
      history.replaceState(null, "", location.pathname + location.search);
  }, [view]);
  const refresh = () =>
    getIssues()
      .then(setIssues)
      .catch((e) => notify(e.message));
  const persist = async (next) => {
    await saveIssue(next);
    setIssue(next);
    await refresh();
  };
  const openIssue = (i) => {
    setIssue(i);
    setView(i.report ? "report" : "activity");
  };
  const begin = () => {
    setConsent(false);
    setModal("setup");
  };
  const toSample = () => {
    setIssue(sample);
    setView("report");
  };
  async function start(profile) {
    await api("session", { guardianConsent: true });
    const next = {
      version: 1,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      profile,
      answers: [],
      report: null,
      images: {},
    };
    await persist(next);
    setConsent(true);
    setModal(null);
    setView("activity");
  }
  async function ensureSession() {
    if (!consent) {
      setModal("consent");
      return false;
    }
    await api("session", { guardianConsent: true });
    return true;
  }
  return (
    <>
      <header className={`header ${view === "home" ? "home-header" : ""}`}>
        <div className="header-inner">
          <Brand onClick={() => setView("home")} />
          <nav aria-label="主导航">
            <button
              onClick={() => {
                setView("home");
                setTimeout(
                  () =>
                    document
                      .getElementById("how")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  80,
                );
              }}
            >
              怎么一起玩
            </button>
            <button onClick={toSample}>翻翻样刊</button>
            <button onClick={openWorld}>纸上星球</button>
            <button
              onClick={() => {
                refresh();
                setView("archive");
              }}
            >
              我的收藏架 <span className="nav-count">{issues.length}</span>
            </button>
          </nav>
          <button className="nav-cta" onClick={begin}>
            一起做一份 <ArrowUpRight size={17} />
          </button>
        </div>
      </header>
      <main>
        {view === "home" && (
          <Home
            begin={begin}
            toSample={toSample}
            showInfo={() => setModal("about")}
            openWorld={openWorld}
          />
        )}
        {view === "community" && (
          <Suspense
            fallback={
              <div
                className="wrap"
                style={{ paddingTop: 70, paddingBottom: 70 }}
              >
                <Loading>正在打开纸上星球…</Loading>
              </div>
            }
          >
            <Community api={api} Modal={Modal} notify={notify} />
          </Suspense>
        )}
        {view === "activity" && issue && (
          <Activity
            key={issue.id}
            issue={issue}
            persist={persist}
            onReport={() => setView("report")}
            ensureSession={ensureSession}
            notify={notify}
            onArchive={() => setView("archive")}
          />
        )}
        {view === "report" && issue && (
          <Report
            issue={issue}
            persist={persist}
            begin={begin}
            notify={notify}
            ensureSession={ensureSession}
            exportIt={() => setModal("export")}
            onEdit={() => setView("activity")}
          />
        )}
        {view === "archive" && (
          <section className="archive wrap">
            <div className="archive-head">
              <span className="serif accent">The keepsake shelf</span>
              <h1>把小时候，好好收着。</h1>
              <p>
                留在这台设备上的小小人物报。清理浏览器会删除本机记录，记得加密导出。
              </p>
              <div className="actions">
                <button className="primary" onClick={begin}>
                  做一份新的 <ArrowRight size={19} />
                </button>
                <button
                  className="secondary"
                  onClick={() => setModal("import")}
                >
                  <UploadSimple size={19} />
                  导入加密档案
                </button>
              </div>
            </div>
            {issues.length === 0 ? (
              <div className="empty">
                <BookOpen size={50} weight="thin" />
                <h2>这里在等第一份童年特别刊。</h2>
                <p>选一个不赶时间的下午，和孩子慢慢开始。</p>
                <button className="text-link" onClick={toSample}>
                  先翻翻一份样刊 <ArrowRight />
                </button>
              </div>
            ) : (
              <div className="issue-grid">
                {issues.map((i) => (
                  <article className="issue-tile" key={i.id}>
                    <button className="issue-open" onClick={() => openIssue(i)}>
                      <img
                        src={i.images[0] || heroImage}
                        alt="童年特别刊封面插画"
                      />
                      <small>
                        {i.profile.age} ·{" "}
                        {new Date(i.date).toLocaleDateString("zh-CN")}
                      </small>
                      <h2>{i.profile.nickname}的童年特别刊</h2>
                      <p>
                        {i.report
                          ? i.report.title
                          : `已经收下 ${i.answers.length} 个回答，随时继续`}
                      </p>
                      <span className="text-link">
                        {i.report ? "打开特别刊" : "接着聊聊"}{" "}
                        <ArrowRight size={17} />
                      </span>
                    </button>
                    <IconButton
                      icon={Trash}
                      label={`删除${i.profile.nickname}的本机档案`}
                      onClick={() => {
                        setIssue(i);
                        setModal("delete");
                      }}
                    />
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <footer className="footer wrap">
        <div>
          <Asterisk size={22} weight="bold" />
          <span>给每一种长大，留一张空白的纸。</span>
        </div>
        <div>
          <button onClick={() => setModal("about")}>设计依据与隐私</button>
          <a
            href="https://github.com/yanghaoleng/kidspaper"
            target="_blank"
            rel="noreferrer"
          >
            <GithubLogo size={16} />
            非商用开放源码 <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="关闭提示">
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === "setup" && <Setup onStart={start} />}
          {modal === "about" && <About />}
          {modal === "consent" && (
            <div>
              <span className="serif accent">A little note for grown-ups</span>
              <h2>先请家长看一眼。</h2>
              <p>
                这次活动需要家长陪伴。只有点击 AI
                功能时，相关文字或音频才会经本站服务端发送给火山方舟处理。本站不保存对话内容；服务商按其服务政策处理请求。
              </p>
              <p>
                档案保存在这台设备上，不公开分享。AI
                观察与图景并非测评或人生预测；未来对话是档案导览，不能还原真实的童年意识或声音。
              </p>
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await api("session", { guardianConsent: true });
                    setConsent(true);
                    setModal(null);
                    notify("已确认。请重新点击刚才的操作。");
                  } catch (e) {
                    notify(e.message);
                  }
                }}
              >
                我是家长，知情并同意 <Check size={19} />
              </button>
            </div>
          )}
          {["export", "import"].includes(modal) && (
            <Transfer
              mode={modal}
              issue={issue}
              notify={notify}
              onDone={async (next) => {
                if (next) openIssue(next);
                await refresh();
                setModal(null);
              }}
            />
          )}
          {modal === "delete" && (
            <div>
              <h2>删除这份本机档案？</h2>
              <p>此操作无法从浏览器恢复。建议先导出加密备份。</p>
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => setModal("export")}
                >
                  先导出
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    try {
                      await removeIssue(issue.id);
                      await refresh();
                      setModal(null);
                      notify("已删除这份本机档案。");
                    } catch (e) {
                      notify(e.message);
                    }
                  }}
                >
                  确认删除
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
function Home({ begin, toSample, showInfo, openWorld }) {
  return (
    <>
      <WorldScene intro begin={begin} toSample={toSample} />
      <section className="community-entry">
        <div>
          <GlobeHemisphereWest size={39} weight="thin" />
          <div>
            <strong>
              纸上星球<small>模拟社区</small>
            </strong>
            <p>同一颗星球，许多种长大。转一转，遇见远方的小世界。</p>
          </div>
        </div>
        <button onClick={openWorld}>
          去看看那些小小的光
          <ArrowUpRight size={19} />
        </button>
      </section>
      <section className="intro-strip wrap">
        <span>没有标准答案。</span>
        <p>
          有的孩子想住在云里，有的想给蜗牛修一座桥。
          <br />
          我们想做的，是坐下来，认真听听。
        </p>
        <Heart size={32} weight="thin" />
      </section>
      <section id="how" className="process wrap">
        <div className="section-heading">
          <span className="serif accent">
            A small afternoon, a lasting story.
          </span>
          <h2>
            留一个下午，
            <br />
            认识一下小小的他。
          </h2>
          <p>
            不赶着得出结论，也不需要表现得很好。
            <br />
            家长陪着聊，AI 帮忙把珍贵的片刻留下来。
          </p>
        </div>
        <div className="process-steps">
          {[
            {
              n: "01",
              title: "并排坐下，慢慢聊",
              body: "从日常、情绪到梦想。孩子可以说，可以想，也可以跳过今天不想聊的问题。",
              icon: ChatCircle,
            },
            {
              n: "02",
              title: "听见原话，也看见爱",
              body: "AI 轻轻追问，保留孩子的表达。家长另写一页心声，留下愿意给他的支持。",
              icon: Heart,
            },
            {
              n: "03",
              title: "把今天，做成特别刊",
              body: "一份当下的观察、三种可探索的图景、一封家书，和多年后还能打开的对话入口。",
              icon: BookOpen,
            },
          ].map(({ n, title, body, icon: Icon }) => (
            <div className="step" key={n}>
              <div className="step-top">
                <span>{n}</span>
                <Icon size={27} weight="light" />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="sample-section">
        <div className="wrap sample-layout">
          <div
            className="mini-newspaper"
            onClick={toSample}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toSample();
              }
            }}
            aria-label="打开小禾的虚构样刊"
          >
            <div className="paper-masthead">
              小 小 人 物 报 <Asterisk size={19} />
            </div>
            <div className="paper-rule">
              小禾 · 6岁 <span>童年特别刊 / 虚构样例</span>
            </div>
            <h3>
              心里有一座
              <br />
              会走路的花园。
            </h3>
            <img src={heroImage} alt="虚构样刊中的绘本插画" loading="lazy" />
            <blockquote>
              “这样花花和小狗
              <br />
              就可以一起去旅行了。”
            </blockquote>
            <span className="paper-bottom">
              每一种小小的想法，都值得被认真收藏。
            </span>
          </div>
          <div className="sample-copy">
            <span className="serif accent">Not a label. A love letter.</span>
            <h2>
              留住的不是一个标签，
              <br />
              是一个<span className="accent">被爱着的小孩。</span>
            </h2>
            <p>
              这里有孩子亲口说的小世界，有基于对话的温柔观察，也有来自家人的托举。
            </p>
            <ul className="feature-list">
              <li>
                <PencilSimple />
                <div>
                  <strong>孩子的原话，有迹可循</strong>
                  <span>每一条观察，都能回到当时的表达。</span>
                </div>
              </li>
              <li>
                <Leaf />
                <div>
                  <strong>未来有很多种，都可以试试</strong>
                  <span>把想象画出来，再从一个小实验开始。</span>
                </div>
              </li>
              <li>
                <Heart />
                <div>
                  <strong>家人的爱，单独留一页</strong>
                  <span>期许属于家长，选择留给孩子。</span>
                </div>
              </li>
            </ul>
            <button className="text-link" onClick={toSample}>
              打开这份童年特别刊 <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </section>
      <section className="time-section wrap">
        <span className="serif accent">Dear future you,</span>
        <h2>
          “原来，我小时候
          <br />
          是这样想的呀。”
        </h2>
        <p>
          未来的某一天，重新打开今天的特别刊。
          <br />
          问问童年档案：那时候的我，最喜欢什么？
          <br />
          AI 会带你回到记录里的原话，让从前的自己，有迹可寻。
        </p>
        <div className="memory-preview">
          <span className="memory-avatar">我</span>
          <p>小时候的我，梦想的世界是什么样的？</p>
          <div className="memory-response">
            <Asterisk size={24} />
            <p>
              那时的你说过：“我要造一个会走路的花园……”
              <small>AI 档案导览 · 基于记录，不是童年意识的复原</small>
            </p>
          </div>
        </div>
        <button className="primary" onClick={begin}>
          给未来的他，留一份今天 <ArrowUpRight size={19} />
        </button>
      </section>
      <section className="notes wrap">
        <div>
          <ShieldCheck size={25} />
          <h3>陪伴优先，慢慢长大。</h3>
          <p>
            适合 4–10
            岁，在家长陪伴下使用。提问参考回应式互动与自主支持理念；这不是标准化测评，也不预测孩子的人生。
          </p>
          <button className="text-link" onClick={showInfo}>
            了解设计依据与隐私 <ArrowUpRight size={16} />
          </button>
        </div>
        <div>
          <LockKey size={25} />
          <h3>小小世界，由你保管。</h3>
          <p>
            不需要真实姓名，不公开孩子的回答。档案留在这台设备，可加密导出备份。AI
            请求会交由火山方舟处理。
          </p>
          <span className="note-small">
            非商用开放源码 · 每一种成长都值得尊重
          </span>
        </div>
      </section>
    </>
  );
}
function Modal({ children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll(
          'button,a,input,select,textarea,[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="小小人物报对话框"
        tabIndex={-1}
        ref={ref}
      >
        <IconButton icon={X} label="关闭对话框" onClick={onClose} />
        {children}
      </section>
    </div>
  );
}
function Setup({ onStart }) {
  const [nickname, setNickname] = useState(""),
    [age, setAge] = useState("4–6 岁"),
    [guardian, setGuardian] = useState("妈妈"),
    [agree, setAgree] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onStart({ nickname: nickname.trim(), age, guardian });
        } catch (e) {
          setError(e.message);
          setBusy(false);
        }
      }}
    >
      <span className="serif accent">Let’s make a little memory.</span>
      <h2>今天，谁是小小主角？</h2>
      <p>
        找一个舒服的位置。整次活动约 15–25 分钟，
        <br />
        随时可以停下来，下次再继续。
      </p>
      <label className="field">
        孩子的小名
        <input
          autoComplete="off"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={16}
          required
          placeholder="一个小名就好，不用真实姓名"
        />
      </label>
      <div className="form-row">
        <label className="field">
          年龄段
          <select value={age} onChange={(e) => setAge(e.target.value)}>
            {["4–6 岁", "7–8 岁", "9–10 岁"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          一起参加的是
          <select
            value={guardian}
            onChange={(e) => setGuardian(e.target.value)}
          >
            {["妈妈", "爸爸", "家人 / 监护人"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="consent-note">
        <LockKey size={21} />
        <p>
          回答和特别刊保存在本机。使用 AI
          时，相关内容会发送给火山方舟处理，本站不保存对话或录音。只需分享愿意留下的事，不填写学校、住址等隐私。
        </p>
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          required
        />
        <span>
          我是家长 / 监护人，同意陪伴参与与上述 AI
          处理方式，理解这不是心理测评或人生预测。
        </span>
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary full"
        disabled={busy || !nickname.trim() || !agree}
      >
        {busy ? (
          <Loading>准备一张新纸…</Loading>
        ) : (
          <>
            准备好了，一起开始 <ArrowRight size={19} />
          </>
        )}
      </button>
    </form>
  );
}
function VoiceButton({ onText, ensureSession, notify, disabled = false }) {
  const [recording, setRecording] = useState(false),
    [working, setWorking] = useState(false),
    [seconds, setSeconds] = useState(0);
  const record = useRef(null);
  useEffect(
    () => () => {
      record.current?.cancel();
    },
    [],
  );
  useEffect(() => {
    if (!recording) return;
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);
  async function stop() {
    if (!record.current) return;
    setRecording(false);
    setWorking(true);
    try {
      const data = await record.current.stop();
      record.current = null;
      if (data) {
        const d = await api("transcribe", { audio: data });
        onText(d.text);
        notify("已转成文字，请检查后再保存。录音不会存入档案。");
      }
    } catch (e) {
      notify(e.message);
    } finally {
      setWorking(false);
    }
  }
  return (
    <button
      type="button"
      className={`voice-button ${recording ? "recording" : ""}`}
      disabled={disabled || working}
      onClick={async () => {
        if (recording) return stop();
        setWorking(true);
        try {
          if (!navigator.mediaDevices?.getUserMedia)
            throw new Error("当前浏览器不能录音，可以直接输入文字。");
          if (!(await ensureSession())) return;
          record.current = await startRecording(stop);
          setRecording(true);
        } catch (e) {
          notify(
            e.name === "NotAllowedError"
              ? "没有获得麦克风权限。可以允许录音，或直接输入文字。"
              : e.message,
          );
        } finally {
          setWorking(false);
        }
      }}
    >
      {working ? (
        <Loading>正在处理…</Loading>
      ) : recording ? (
        <>
          <Stop size={19} weight="fill" />
          结束录音 · {seconds}s / 60s
        </>
      ) : (
        <>
          <Microphone size={19} />
          说出来也可以
        </>
      )}
    </button>
  );
}
function Activity({
  issue,
  persist,
  onReport,
  ensureSession,
  notify,
  onArchive,
}) {
  const [index, setIndex] = useState(() => {
      const n = allQuestions.findIndex(
        (q) => !issue.answers.some((a) => a.id === q.id),
      );
      return n < 0 ? allQuestions.length - 1 : n;
    }),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [follow, setFollow] = useState(null),
    [followText, setFollowText] = useState(""),
    [aiError, setAiError] = useState(""),
    [generating, setGenerating] = useState(false),
    [saveError, setSaveError] = useState("");
  const q = allQuestions[index],
    chapter = chapters[q.chapter];
  const stored = issue.answers.find((a) => a.id === q.id);
  const complete = issue.answers.filter((a) =>
    allQuestions.some((q) => q.id === a.id),
  ).length;
  useEffect(() => {
    setText(stored?.text || "");
    setFollow(null);
    setFollowText("");
    setAiError("");
    setSaveError("");
  }, [index]);
  const eligible =
    issue.answers.filter((a) => a.who === "child").length >= 3 &&
    issue.answers.some((a) => a.who === "guardian");
  async function requestFollow(next) {
    setBusy(true);
    setAiError("");
    try {
      if (!(await ensureSession())) return;
      setFollow(await api("followup", context(next)));
    } catch (e) {
      setAiError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveAnswer() {
    const a = { id: q.id, question: q.title, who: q.who, text: text.trim() };
    const next = {
      ...issue,
      answers: [
        ...issue.answers.filter(
          (x) => x.id !== q.id && x.id !== q.id + "-followup",
        ),
        a,
      ],
      report: null,
    };
    setBusy(true);
    setSaveError("");
    try {
      await persist(next);
      await requestFollow(next);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    if (followText.trim() && follow) {
      try {
        const a = {
          id: q.id + "-followup",
          question: follow.question,
          who: q.who,
          text: followText.trim(),
        };
        await persist({
          ...issue,
          answers: [...issue.answers.filter((x) => x.id !== a.id), a],
        });
      } catch (e) {
        notify(e.message);
        return;
      }
    }
    if (index < allQuestions.length - 1) setIndex(index + 1);
    else notify("这一页已经收好了。现在可以生成你的童年特别刊。");
  }
  async function generate() {
    setGenerating(true);
    try {
      if (!(await ensureSession())) return;
      const d = await api("report", context(issue));
      await persist({ ...issue, report: d.report });
      onReport();
    } catch (e) {
      notify(e.message);
    } finally {
      setGenerating(false);
    }
  }
  return (
    <section className="activity wrap">
      <div className="activity-head">
        <button className="text-link" onClick={onArchive}>
          <ArrowLeft size={17} />
          回到收藏架
        </button>
        <span>
          {issue.profile.nickname}的童年特别刊{" "}
          <span className="muted">/ 共创中</span>
        </span>
      </div>
      <div className="activity-layout">
        <aside className="chapter-nav">
          <span className="serif accent">Our little conversation</span>
          <h1>
            今天，我们
            <br />
            慢慢聊。
          </h1>
          {chapters.map((c, i) => (
            <button
              key={c.title}
              className={q.chapter === i ? "active" : ""}
              disabled={busy || generating}
              onClick={() =>
                setIndex(allQuestions.findIndex((q) => q.chapter === i))
              }
            >
              <span>0{i + 1}</span>
              <div>
                {c.title}
                <small>{c.subtitle}</small>
              </div>
              {c.questions.every((q) =>
                issue.answers.some((a) => a.id === q.id),
              ) && <Check size={17} />}
            </button>
          ))}
          <p className="saved-note">
            <LockKey size={15} /> 已收下 {complete} / 8 个回答
            <br />
            <span>保存在本机，可以随时离开。</span>
          </p>
        </aside>
        <div className="question-area">
          <div className={`question-label ${chapter.color}`}>
            <span>第 {index + 1} / 8 页</span>
            <span>
              {q.who === "child"
                ? "请孩子来说"
                : `请${issue.profile.guardian}来写`}
            </span>
          </div>
          <h2>{q.title}</h2>
          <p className="question-hint">{q.hint}</p>
          <div className="parent-tip">
            <Heart size={19} />
            <p>
              <strong>给家长的小提示</strong>
              {q.tip}
            </p>
          </div>
          <label className="answer-label" htmlFor="answer">
            {q.who === "child"
              ? `${issue.profile.nickname}的原话`
              : `${issue.profile.guardian}的心声`}
          </label>
          <textarea
            id="answer"
            maxLength={2000}
            value={text}
            disabled={busy || generating}
            onChange={(e) => {
              setText(e.target.value);
              setFollow(null);
            }}
            placeholder={
              q.who === "child"
                ? "尽量记下孩子原本的说法，不用帮他润色……"
                : "写下你愿意留给他的真实心声……"
            }
          />
          <div className="input-tools">
            <VoiceButton
              disabled={busy || generating}
              onText={(t) => setText((prev) => (prev ? prev + "\n" + t : t))}
              ensureSession={ensureSession}
              notify={notify}
            />
            <span>{text.length} / 2000</span>
          </div>
          {saveError && (
            <p className="error" role="alert">
              {saveError}
            </p>
          )}
          <div className="question-actions">
            <button
              className="secondary"
              disabled={!text.trim() || busy || generating}
              onClick={saveAnswer}
            >
              {busy ? (
                <Loading>收好回答，编辑在听…</Loading>
              ) : (
                <>
                  <Check size={18} />
                  {stored ? "更新回答并请 AI 听听" : "收好回答，请 AI 听听"}
                </>
              )}
            </button>
            <button
              className="text-link"
              disabled={busy || generating}
              onClick={next}
            >
              {stored ? "下一页" : "这题先跳过"} <ArrowRight size={17} />
            </button>
          </div>
          {aiError && (
            <div className="ai-error">
              <p>{aiError}</p>
              <button
                className="text-link"
                onClick={() => requestFollow(issue)}
              >
                再请编辑听一次 <ArrowRight />
              </button>
            </div>
          )}
          {follow && (
            <div className="followup">
              <div className="editor-label">
                <Asterisk size={21} /> 小报编辑，听见了
              </div>
              <p>{follow.reflection}</p>
              <h3>{follow.question}</h3>
              <p className="muted small">{follow.parentTip}</p>
              <label className="sr-only" htmlFor="follow-answer">
                回答编辑的追问（可选）
              </label>
              <textarea
                id="follow-answer"
                placeholder="想接着聊的话，记在这里；也可以直接去下一页。"
                value={followText}
                onChange={(e) => setFollowText(e.target.value)}
                maxLength={2000}
              />
              <button className="text-link" onClick={next}>
                收好这一页，{index < 7 ? "继续聊" : "完成回答"}{" "}
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          <div className="activity-bottom">
            {index > 0 && (
              <button
                className="text-link"
                disabled={busy || generating}
                onClick={() => setIndex(index - 1)}
              >
                <ArrowLeft size={17} />
                上一页
              </button>
            )}
            <p>不知道，也是一种好答案。</p>
          </div>
          <div className="report-generate">
            <div>
              <BookOpen size={27} />
              <p>
                <strong>把今天，编成一份特别刊。</strong>
                <span>
                  {eligible
                    ? "原话已准备好，可以开始编排。"
                    : "至少三个孩子的回答 + 一份家长心声。"}
                </span>
              </p>
            </div>
            <button
              className="primary"
              disabled={!eligible || generating || busy}
              onClick={generate}
            >
              {generating ? (
                <Loading>编辑正在编排，约 1–2 分钟…</Loading>
              ) : (
                <>
                  生成特别刊 <Sparkle size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
function Report({
  issue,
  persist,
  begin,
  notify,
  ensureSession,
  exportIt,
  onEdit,
}) {
  const [scene, setScene] = useState(0),
    [painting, setPainting] = useState(false),
    [chatOpen, setChatOpen] = useState(false),
    [imageErrors, setImageErrors] = useState({});
  const isSample = issue.id === "sample-only";
  const r = issue.report;
  async function paint() {
    setPainting(true);
    setImageErrors((prev) => ({ ...prev, [scene]: "" }));
    try {
      if (isSample) {
        notify("这是虚构样刊。开始自己的特别刊，就能为孩子的想法画一张图。");
        return;
      }
      if (!(await ensureSession())) return;
      const d = await api("image", { scene: r.possibilities[scene].scene });
      await persist({
        ...issue,
        images: { ...issue.images, [scene]: d.image },
      });
    } catch (e) {
      setImageErrors((prev) => ({ ...prev, [scene]: e.message }));
    } finally {
      setPainting(false);
    }
  }
  return (
    <section className="report wrap">
      <div className="report-toolbar">
        <span>
          <BookOpen size={17} />
          {isSample
            ? "虚构样刊 · 所有人物与回答为创作示例"
            : "这份特别刊只保存在本机"}
        </span>
        <div>
          {isSample ? (
            <button className="text-link" onClick={begin}>
              做一份自己的 <ArrowUpRight size={17} />
            </button>
          ) : (
            <>
              <IconButton
                icon={PencilSimple}
                label="回到回答页编辑（重新生成报告）"
                onClick={onEdit}
              />
              <button className="secondary compact" onClick={exportIt}>
                <DownloadSimple size={17} />
                加密导出
              </button>
            </>
          )}
          <IconButton
            icon={Printer}
            label="打印或存为 PDF"
            onClick={() => window.print()}
          />
        </div>
      </div>
      <WorldScene
        issue={issue}
        onExplore={() =>
          document
            .getElementById("report-observations")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        onChat={() => {
          setChatOpen(true);
          setTimeout(
            () =>
              document
                .getElementById("archive-conversation")
                ?.scrollIntoView({ behavior: "smooth" }),
            60,
          );
        }}
      />
      <article className="newspaper">
        <div className="report-masthead">
          <span>小小人物报</span>
          <Asterisk weight="light" />
          <span className="serif">Kidspaper</span>
        </div>
        <div className="report-meta">
          <span>
            {issue.profile.nickname} · {issue.profile.age}
          </span>
          <span>由孩子与{issue.profile.guardian}共同完成</span>
          <span>
            {new Date(issue.date).toLocaleDateString("zh-CN")} · 童年特别刊
          </span>
        </div>
        <div className="report-cover">
          <div>
            <span className="serif accent">
              An ordinary day. An extraordinary you.
            </span>
            <h1>{r.title}</h1>
            <p>{r.subtitle}</p>
            <div className="cover-sign">
              主角 / {issue.profile.nickname}
              <br />
              陪伴 / {issue.profile.guardian}
              <br />
              记录与编排 / 小报 AI 编辑
            </div>
          </div>
          <img
            src={issue.images[0] || heroImage}
            alt={
              issue.images[0]
                ? "根据孩子梦想生成的概念插画"
                : "小小人物报通用绘本封面插画"
            }
            fetchPriority="high"
          />
        </div>
        <div className="report-intro">
          <span className="serif">Dear {issue.profile.nickname},</span>
          <p>{r.introduction}</p>
          <small>
            这是一张此刻的快照。基于一次对话的观察，不是标准化测评，孩子可以一直变化。
          </small>
        </div>
        <section className="report-section" id="report-observations">
          <div className="report-section-heading">
            <span>01</span>
            <h2>今天，我们看见的你。</h2>
            <p>从你的话出发，留一点温柔的观察。</p>
          </div>
          <div className="observations">
            {r.observations.map((o, i) => (
              <article key={i}>
                <Leaf size={26} weight="light" />
                <h3>{o.title}</h3>
                <p>{o.body}</p>
                <details>
                  <summary>
                    回到孩子的原话 <CaretDown size={14} />
                  </summary>
                  {o.evidence.map((id) => {
                    const a = issue.answers.find(
                      (a) => a.id === id && a.who === "child",
                    );
                    return (
                      a && (
                        <blockquote key={id}>
                          “{a.text}”<small>当时聊的是：{a.question}</small>
                        </blockquote>
                      )
                    );
                  })}
                </details>
                <div className="support">
                  <Heart size={17} />
                  <p>
                    <strong>可以这样陪伴</strong>
                    {o.support}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="report-section dream-section">
          <div className="report-section-heading">
            <span>02</span>
            <h2>世界很大，试试这样长大。</h2>
            <p>三个共同想象的片段，没有一条是规定好的路。</p>
          </div>
          <div className="dream-tabs" role="tablist" aria-label="梦想场景">
            {r.possibilities.map((p, i) => (
              <button
                key={p.title}
                id={`dream-tab-${i}`}
                role="tab"
                aria-selected={i === scene}
                aria-controls="dream-panel"
                disabled={painting}
                className={i === scene ? "active" : ""}
                onClick={() => setScene(i)}
              >
                {p.title}
              </button>
            ))}
          </div>
          <div
            className="dream-content"
            role="tabpanel"
            id="dream-panel"
            aria-labelledby={`dream-tab-${scene}`}
          >
            <figure>
              <img
                src={issue.images[scene] || heroImage}
                alt={
                  issue.images[scene]
                    ? r.possibilities[scene].title + "的AI概念插画"
                    : "通用绘本插画，点击生成可画出当前场景"
                }
                loading="lazy"
              />
              <figcaption>
                {issue.images[scene]
                  ? "AI 根据这次想象生成的概念图"
                  : "通用封面插画 · 当前场景尚未生成专属图"}
              </figcaption>
            </figure>
            <div>
              <span className="serif accent">One possible little world</span>
              <h3>{r.possibilities[scene].title}</h3>
              <p>{r.possibilities[scene].scene}</p>
              <p className="scene-connection">
                {r.possibilities[scene].connection}
              </p>
              <div className="experiment">
                <Leaf size={20} />
                <p>
                  <strong>这周，试一个小实验</strong>
                  {r.possibilities[scene].firstStep}
                </p>
              </div>
              <button className="secondary" onClick={paint} disabled={painting}>
                {painting ? (
                  <Loading>画家正在画，约 30–90 秒…</Loading>
                ) : (
                  <>
                    <Sparkle size={18} />
                    {issue.images[scene]
                      ? "重新画这个小世界"
                      : "把这个小世界画出来"}
                  </>
                )}
              </button>
              {imageErrors[scene] && (
                <p className="error" role="alert">
                  {imageErrors[scene]}
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="report-section family-section">
          <div className="report-section-heading">
            <span>03</span>
            <h2>爱，会托着你慢慢长大。</h2>
            <p>这一页是家长的心声。爱与期许留在纸上，选择留给你。</p>
          </div>
          <div className="letter-layout">
            <div className="letter">
              <Heart size={30} weight="thin" />
              <span className="serif">With love, always.</span>
              <h3>给长大后的{issue.profile.nickname}</h3>
              {issue.answers
                .filter((a) => a.who === "guardian")
                .map((a) => (
                  <div key={a.id}>
                    <span className="letter-question">{a.question}</span>
                    <p>{a.text}</p>
                  </div>
                ))}
              <div className="signature">
                爱你的{issue.profile.guardian}
                <span>家长原话，未经 AI 改写</span>
              </div>
            </div>
            <div className="care-notes">
              <h3>留给家长的几张便签</h3>
              {r.care.map((c, i) => (
                <div className="care-note" key={i}>
                  <span>0{i + 1}</span>
                  <h4>{c.title}</h4>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="report-ending">
          <Asterisk size={40} weight="light" />
          <p>{r.closing}</p>
          <span className="serif">Keep growing. Keep becoming.</span>
        </section>
      </article>
      <section className="report-memory">
        <div>
          <span className="serif accent">A conversation across time</span>
          <h2>
            和那时的自己，
            <br />
            再聊一会儿。
          </h2>
          <p>
            AI 会带你回看这份档案，引用你留下的原话。
            <br />
            没有记录的事，它会坦白说不知道。
          </p>
          <button className="primary" onClick={() => setChatOpen(!chatOpen)}>
            <ChatCircle size={20} />
            {chatOpen ? "收起对话" : "打开童年档案对话"}
          </button>
          <small>AI 档案导览，不代表孩子当年的真实意识或声音。</small>
        </div>
        <blockquote>
          “那时候的我，
          <br />
          最想去哪里？”
        </blockquote>
      </section>
      {chatOpen && (
        <MemoryChat
          issue={issue}
          ensureSession={ensureSession}
          notify={notify}
          isSample={isSample}
          begin={begin}
        />
      )}
    </section>
  );
}
function MemoryChat({ issue, ensureSession, notify, isSample, begin }) {
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const last = useRef();
  useEffect(() => {
    last.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  async function send(text) {
    if (!text.trim() || busy) return;
    if (isSample) {
      notify("样刊不会产生个人对话。做一份自己的特别刊后，就能与档案聊天。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!(await ensureSession())) return;
      const next = [...messages, { role: "user", content: text.trim() }];
      const d = await api("memory", {
        ...context(issue),
        messages: next.slice(-15),
      });
      setMessages([...next, { role: "assistant", content: d.text }]);
      setInput("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="memory-chat" id="archive-conversation">
      <div className="editor-label">
        <Asterisk size={24} />
        {issue.profile.nickname}的童年档案 <span>AI 导览</span>
      </div>
      <p className="muted small">
        对话只在本次页面停留期间可见，不写回童年原始档案。
      </p>
      {isSample ? (
        <div className="empty">
          <p>这是一份虚构样刊。先留下你们自己的故事。</p>
          <button className="primary" onClick={begin}>
            做一份自己的 <ArrowRight />
          </button>
        </div>
      ) : (
        <>
          <div className="chat-messages" aria-live="polite">
            {!messages.length && (
              <div className="chat-suggestions">
                {[
                  "那时的我最喜欢什么？",
                  "家长当时想对我说些什么？",
                  "哪句话是小时候的我自己说的？",
                ].map((t) => (
                  <button key={t} className="secondary" onClick={() => send(t)}>
                    {t}
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`}>
                <span>{m.role === "user" ? "你" : "AI 档案导览"}</span>
                <p>{m.content}</p>
              </div>
            ))}
            {busy && <Loading>正在翻阅当时的记录…</Loading>}
            <div ref={last} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="memory-input" className="sr-only">
              想问童年档案的问题
            </label>
            <div className="chat-input">
              <textarea
                id="memory-input"
                placeholder="给那时的自己，写一个问题……"
                value={input}
                maxLength={1500}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
              />
              <button
                className="send-button"
                aria-label="发送问题"
                disabled={busy || !input.trim()}
              >
                <PaperPlaneTilt size={22} />
              </button>
            </div>
            <VoiceButton
              disabled={busy}
              onText={(t) => setInput((p) => (p ? p + "\n" + t : t))}
              ensureSession={ensureSession}
              notify={notify}
            />
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
function Transfer({ mode, issue, onDone, notify }) {
  const [password, setPassword] = useState(""),
    [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          if (mode === "export") {
            await exportIssue(issue, password);
            notify("加密档案已交给浏览器下载，请妥善保管文件和密码。");
            onDone();
          } else {
            if (!file) throw new Error("请先选择档案文件。");
            onDone(await importIssue(file, password));
          }
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <LockKey size={32} className="accent" />
      <h2>
        {mode === "export"
          ? "把童年，安全地带走。"
          : "欢迎带着从前的自己回来。"}
      </h2>
      <p>
        {mode === "export"
          ? "加密文件包含原话、特别刊和已生成的图片。未来可在此导入，继续回看与对话。密码只用于本机加密，本站无法找回。"
          : "请选择之前导出的 .kidspaper 加密档案，输入保存时设置的密码。导入后仍只保存在本机。"}
      </p>
      {mode === "import" && (
        <label className="field">
          加密档案
          <input
            type="file"
            accept=".kidspaper,application/json"
            required
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
      )}
      <label className="field">
        {mode === "export" ? "设置保存密码（至少 8 位）" : "档案密码"}
        <input
          type="password"
          autoComplete={mode === "export" ? "new-password" : "current-password"}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="primary full" disabled={busy || password.length < 8}>
        {busy ? (
          <Loading>正在处理…</Loading>
        ) : mode === "export" ? (
          <>
            <DownloadSimple size={19} />
            加密并下载
          </>
        ) : (
          <>
            <UploadSimple size={19} />
            解密并导入
          </>
        )}
      </button>
    </form>
  );
}
function About() {
  return (
    <div className="about">
      <span className="serif accent">A thoughtful little paper</span>
      <h2>一份小报的认真约定。</h2>
      <h3>提问从哪里来</h3>
      <p>
        借鉴
        <a
          href="https://developingchild.harvard.edu/key-concept/serve-and-return/"
          target="_blank"
          rel="noreferrer"
        >
          哈佛儿童发展中心的回应式互动（serve and return）
        </a>
        ：跟随孩子的注意，回应、等待，让对话来回发生。借鉴
        <a
          href="https://selfdeterminationtheory.org/topics/application-parenting/"
          target="_blank"
          rel="noreferrer"
        >
          自我决定理论的家庭应用
        </a>
        ：关注自主、胜任与关系支持。
      </p>
      <p>
        这些理论是互动设计的启发，不构成本产品测评效度的证明。问题由本产品原创编排，尚未经过儿童发展专家评审与信效度验证。我们没有把成人
        Human 3.0、Dan Koe 或 MBTI 测试直接套用到儿童。
      </p>
      <h3>报告能说明什么</h3>
      <p>
        只记录这次表达，提出需要长期观察的线索。没有人格评分、天赋判定、职业适配或人生预测。图景是共同创作的想象，陪伴建议可以试、可以改。家长的期许与孩子的愿望始终分开。
      </p>
      <h3>数据怎样保存</h3>
      <p>
        档案存于本机浏览器 IndexedDB，不上传存档。使用 AI 时，相关文字或最长 60
        秒的录音经本站服务端发送至火山方舟。本站不保存对话或音频，不记录请求正文；服务商可能按其政策处理和保留请求。本站保留按天的匿名调用计数用于限流。未来对话仍需
        AI 服务可用。
      </p>
      <p>
        本机档案未加密，能使用这台设备和浏览器的人可能读到。请在可信任设备上使用。导出使用
        PBKDF2 与 AES-GCM
        加密；清理浏览器不会删除已下载的文件。别忘了保存文件与密码。
      </p>
      <h3>长大以后再对话</h3>
      <p>
        这是 AI
        帮你回看原始档案，无法保存或复原真实孩子的意识、记忆或声音；未记录的事会明确表示未知。保存的是当时的话与家人的心意。
      </p>
      <h3>源码与使用</h3>
      <p>
        源码采用 PolyForm Noncommercial 1.0.0
        许可证，允许符合条款的非商用使用与修改。非 OSI
        认定的开源许可证；商业使用需另获授权。
        <a
          href="https://github.com/yanghaoleng/kidspaper"
          target="_blank"
          rel="noreferrer"
        >
          查看源码与许可证
        </a>
        。
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
