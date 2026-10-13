"use client";

import { useEffect, useRef, useState } from "react";
import {
  advance,
  choose,
  getEnding,
  getHistory,
  getLegacyQuality,
  getMetrics,
  newGame,
} from "@/game/engine";
import {
  arkRequirements,
  events,
  initialMetrics,
  metricInfo,
  prologue,
} from "@/game/story";
import { loadGame, saveGame } from "@/game/storage";
import {
  metricKeys,
  type GameState,
  type Metrics,
  type StoryEvent,
} from "@/game/types";
import { Icon } from "./icon";
import { StellarScene } from "./stellar-scene";

type SaveStatus = "checking" | "empty" | "saved" | "invalid" | "unavailable";
const saveLabels: Record<SaveStatus, string> = {
  checking: "正在读取本地档案",
  empty: "本地自动保存",
  saved: "进度已保存至本机",
  invalid: "存档无法读取，可重新开始",
  unavailable: "本地保存不可用，请勿刷新页面",
};

function getYear(state: GameState | null) {
  if (!state || state.phase === "prologue") return 2847;
  if (state.phase === "ending") return 2947;
  return events[state.decisions.length - (state.phase === "aftermath" ? 1 : 0)]
    .year;
}

function Delta({ delta }: { delta: Metrics }) {
  return (
    <div className="delta-row">
      {metricKeys.map((key) => (
        <span
          key={key}
          className={
            delta[key] > 0
              ? "delta-positive"
              : delta[key] < 0
                ? "delta-negative"
                : "delta-neutral"
          }
        >
          {metricInfo[key].label} {delta[key] > 0 ? "+" : ""}
          {delta[key] === 0 ? "±0" : delta[key]}
        </span>
      ))}
    </div>
  );
}

function MetricsPanel({
  metrics,
  state,
}: {
  metrics: Metrics;
  state: GameState | null;
}) {
  return (
    <aside className="metrics-panel" aria-label="文明指标">
      <div className="section-label">
        <span>文明状态</span>
        <span className="mono">VITAL SIGNS</span>
      </div>
      <div className="metric-list">
        {metricKeys.map((key, index) => (
          <div className={`metric metric-${key}`} key={key}>
            <div className="metric-heading">
              <div>
                <span className="metric-number">0{index + 1}</span>
                <span>{metricInfo[key].label}</span>
              </div>
              <strong data-testid={`metric-${key}`}>
                {metrics[key]}
                <small>/100</small>
              </strong>
            </div>
            <div
              className="metric-track"
              role="progressbar"
              aria-label={metricInfo[key].label}
              aria-valuenow={metrics[key]}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${metrics[key]}%` }} />
            </div>
            <p>{metricInfo[key].description}</p>
          </div>
        ))}
      </div>
      <div className="mission-note">
        <Icon name="orbit" />
        <div>
          <h3>远航的条件</h3>
          <p>
            最终资源 ≥ 50、科技 ≥ 65、稳定 ≥ 45
            时，方舟启航。否则进入「文明之书」。传承决定保留下来的记忆有多丰富。
          </p>
        </div>
      </div>
      <div className="record-counter">
        <span>已归档决策</span>
        <span className="mono">
          {String(state?.decisions.length ?? 0).padStart(2, "0")} / 03
        </span>
      </div>
    </aside>
  );
}

function Decision({
  event,
  onChoose,
}: {
  event: StoryEvent;
  onChoose: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="decision-area">
      <fieldset>
        <legend className="section-label">
          <span>执政官决议</span>
          <span className="mono">SELECT A DIRECTIVE</span>
        </legend>
        <div className="choice-list">
          {event.choices.map((choice, index) => (
            <label
              className={`choice-card ${selected === choice.id ? "choice-selected" : ""}`}
              key={choice.id}
            >
              <input
                type="radio"
                name="directive"
                value={choice.id}
                checked={selected === choice.id}
                onChange={() => setSelected(choice.id)}
              />
              <span className="choice-index">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="choice-copy">
                <strong>{choice.title}</strong>
                <span className="choice-description">{choice.description}</span>
                <Delta delta={choice.delta} />
              </span>
              <span className="choice-radio">
                {selected === choice.id && <Icon name="check" size={13} />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="decision-submit">
        <p>
          决议归档后不可撤回。
          <br />
          每一种选择，都将留下痕迹。
        </p>
        <button
          className="button-primary"
          disabled={!selected}
          onClick={() => selected && onChoose(selected)}
        >
          确认决议
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}

export function Game() {
  const [state, setState] = useState<GameState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("checking");
  const [confirmRestart, setConfirmRestart] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const result = loadGame(window.localStorage);
        setState(result.state);
        setSaveStatus(result.status === "loaded" ? "saved" : result.status);
      } catch {
        setSaveStatus("unavailable");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (confirmRestart) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmRestart]);

  useEffect(() => {
    if (playing) {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [playing, state?.phase, state?.decisions.length]);

  function commit(next: GameState) {
    setState(next);
    try {
      setSaveStatus(
        saveGame(window.localStorage, next) ? "saved" : "unavailable",
      );
    } catch {
      setSaveStatus("unavailable");
    }
  }

  function begin() {
    commit(newGame());
    setConfirmRestart(false);
    setPlaying(true);
  }

  const metrics = state ? getMetrics(state) : initialMetrics;
  const year = getYear(state);
  const eventIndex = state
    ? state.decisions.length - (state.phase === "aftermath" ? 1 : 0)
    : 0;
  const currentEvent = events[eventIndex];
  const activeStep =
    !playing || !state
      ? -1
      : state.phase === "prologue"
        ? 0
        : state.phase === "ending"
          ? 4
          : eventIndex + 1;
  const ending = state?.phase === "ending" ? getEnding(state) : null;
  const history = state ? getHistory(state) : [];

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        跳转到内容
      </a>
      <aside className="archive-sidebar">
        <button
          className="brand"
          onClick={() => setPlaying(false)}
          aria-label="返回首页"
        >
          <span className="brand-mark">
            <Icon name="sun" size={29} />
          </span>
          <span>
            <strong>
              LAST LIGHT<span className="brand-dot">.</span>
            </strong>
            <small>文明余晖</small>
          </span>
        </button>
        <div className="sidebar-divider" />
        <div className="sidebar-label mono">CIVILIZATION ARCHIVE</div>
        <button
          className={`overview-link ${!playing ? "is-active" : ""}`}
          onClick={() => setPlaying(false)}
        >
          <Icon name="archive" size={17} />
          <span>档案概览</span>
          <span className="overview-dot" />
        </button>
        <nav aria-label="叙事进度" className="timeline-nav">
          <div className="sidebar-label">最后一百年</div>
          <ol>
            {[
              "末日的开端",
              ...events.map((entry) => entry.title),
              "文明的回声",
            ].map((title, index) => (
              <li
                key={title}
                className={`${activeStep === index ? "step-active" : ""} ${activeStep > index ? "step-complete" : ""}`}
                aria-current={activeStep === index ? "step" : undefined}
              >
                <span className="step-marker">
                  {activeStep > index ? (
                    <Icon name="check" size={10} />
                  ) : index === 0 ? (
                    "○"
                  ) : index === 4 ? (
                    "◇"
                  ) : (
                    String(index).padStart(2, "0")
                  )}
                </span>
                <span>{title}</span>
              </li>
            ))}
          </ol>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-seal">
            <Icon name="orbit" size={32} />
          </div>
          <p>所有未来，都始于一次选择。</p>
          <span className="mono">EARTH · 2847—2947</span>
          <div className="sidebar-version">
            <span>单人互动叙事</span>
            <span className="mono">V0.1</span>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-path">
            <span className="mono">ARCHIVE</span>
            <span>/</span>
            <span>
              {playing
                ? state?.phase === "ending"
                  ? "终章记录"
                  : "执政官终端"
                : "文明余晖"}
            </span>
          </div>
          <div
            className={`save-indicator ${saveStatus === "unavailable" || saveStatus === "invalid" ? "save-warning" : ""}`}
            role="status"
          >
            <span className="status-light" />
            <span>{saveLabels[saveStatus]}</span>
          </div>
        </header>

        <main id="main-content" className="main-content">
          {!playing ? (
            <>
              <div className="page-eyebrow">
                <span className="eyebrow-line" />
                <span className="mono">THE LAST CENTURY OF HUMANITY</span>
                <span className="edition mono">
                  INTERACTIVE NARRATIVE / 001
                </span>
              </div>
              <section className="home-hero">
                <div className="hero-copy">
                  <span className="archive-tag mono">
                    人类文明档案 · 第 2847 号
                  </span>
                  <h1>
                    文明<span>余晖</span>
                    <small>LAST LIGHT</small>
                  </h1>
                  <p className="hero-lead">
                    恒星只剩一百年。
                    <br />
                    文明的未来，由你落笔。
                  </p>
                  <p className="hero-description">
                    作为人类最后一百年的执政官，
                    <br className="desktop-break" />
                    在生存、秩序与记忆之间，作出你的选择。
                  </p>
                  <div className="hero-actions">
                    <button
                      className="button-primary"
                      disabled={saveStatus === "checking"}
                      onClick={() => (state ? setPlaying(true) : begin())}
                    >
                      {state
                        ? state.phase === "ending"
                          ? "查看文明档案"
                          : "继续执政"
                        : "开始执政"}
                      <Icon name="arrow" size={19} />
                    </button>
                    {state && (
                      <button
                        className="button-text"
                        onClick={() => setConfirmRestart(true)}
                      >
                        重新开始
                        <Icon name="restart" size={15} />
                      </button>
                    )}
                  </div>
                  <div className="hero-meta">
                    <span>约 5–10 分钟</span>
                    <span>3 次重大决策</span>
                    <span>2 个测试结局</span>
                  </div>
                </div>
                <div className="hero-visual">
                  <StellarScene />
                  <div className="visual-footer">
                    <span className="mono">STELLAR COLLAPSE ESTIMATE</span>
                    <strong>
                      100<span>年</span>
                    </strong>
                  </div>
                </div>
              </section>
              <section className="home-intro">
                <div className="section-label">
                  <span>你将决定，什么值得留下</span>
                  <span className="mono">YOUR MANDATE</span>
                </div>
                <div className="mandate-grid">
                  {[
                    {
                      icon: "orbit" as const,
                      title: "为生存寻找出路",
                      body: "调配有限资源，推动科技，让远航成为一种可能。",
                      code: "01 / SURVIVAL",
                    },
                    {
                      icon: "archive" as const,
                      title: "在分歧中维系文明",
                      body: "公开真相，回应冲突。每一道决议，都在重塑信任。",
                      code: "02 / SOCIETY",
                    },
                    {
                      icon: "book" as const,
                      title: "让记忆抵达未来",
                      body: "保存我们的语言、故事与名字，让文明不止于生存。",
                      code: "03 / LEGACY",
                    },
                  ].map((item) => (
                    <div className="mandate" key={item.code}>
                      <Icon name={item.icon} size={25} />
                      <h2>{item.title}</h2>
                      <p>{item.body}</p>
                      <span className="mono">{item.code}</span>
                    </div>
                  ))}
                </div>
              </section>
              <div className="home-footnote">
                <span className="tiny-square" />
                <p>没有完美的答案。只有你愿意承担的未来。</p>
                <span className="mono">LOCAL SAVE · NO ACCOUNT REQUIRED</span>
              </div>
            </>
          ) : (
            state && (
              <>
                <div className="session-heading">
                  <div className="page-eyebrow">
                    <span className="eyebrow-line" />
                    <span className="mono">
                      {state.phase === "ending"
                        ? "FINAL TRANSMISSION"
                        : `CHAPTER ${String(activeStep).padStart(2, "0")} / CIVILIZATION RECORD`}
                    </span>
                  </div>
                  <div className="year-stamp">
                    <strong>{year}</strong>
                    <span>
                      年 ·{" "}
                      {2947 - year > 0
                        ? `距灾变约 ${2947 - year} 年`
                        : "最后的记录"}
                    </span>
                  </div>
                </div>
                <div className="game-grid">
                  <article
                    className={`narrative-panel ${ending ? "ending-panel" : ""}`}
                  >
                    {state.phase === "prologue" ? (
                      <>
                        <span className="archive-tag">序章 · 末日的开端</span>
                        <h1
                          className="narrative-title prologue-title"
                          tabIndex={-1}
                          ref={heading}
                        >
                          {prologue.title}
                        </h1>
                        <div className="prologue-image">
                          <StellarScene />
                        </div>
                        <div className="story-prose">
                          {prologue.paragraphs.map((text) => (
                            <p key={text}>{text}</p>
                          ))}
                        </div>
                        <blockquote className="prologue-quote">
                          “我们不能决定还有多少时间。
                          <br />
                          但我们可以决定，时间里留下些什么。”
                        </blockquote>
                        <button
                          className="button-primary"
                          onClick={() => commit(advance(state))}
                        >
                          接任执政官
                          <Icon name="arrow" size={18} />
                        </button>
                      </>
                    ) : ending ? (
                      <>
                        <span className="archive-tag">{ending.subtitle}</span>
                        <h1
                          className="narrative-title"
                          tabIndex={-1}
                          ref={heading}
                        >
                          {ending.title}
                        </h1>
                        <div className="ending-image">
                          <StellarScene variant={ending.id} />
                          <span className="ending-image-label mono">
                            {ending.id === "ark"
                              ? "THE JOURNEY CONTINUES"
                              : "WE WERE HERE"}
                          </span>
                        </div>
                        <div className="story-prose">
                          {ending.paragraphs.map((text) => (
                            <p key={text}>{text}</p>
                          ))}
                        </div>
                        <blockquote className="ending-quote">
                          {ending.lastLine}
                        </blockquote>
                        <div className="legacy-assessment">
                          <Icon name="book" size={22} />
                          <div>
                            <h2>
                              {getLegacyQuality(metrics.legacy).title}
                              <span>传承 {metrics.legacy}/100</span>
                            </h2>
                            <p>
                              {getLegacyQuality(metrics.legacy).description}
                            </p>
                          </div>
                        </div>
                        <div className="ending-conditions">
                          <h2>结局如何形成</h2>
                          <p>
                            {ending.id === "ark"
                              ? "三项远航条件均已满足，方舟获得启航许可。"
                              : "远航条件未能同时满足，文明转向封存与记录。"}
                          </p>
                          <div>
                            {Object.entries(arkRequirements).map(
                              ([key, minimum]) => (
                                <span
                                  className={
                                    metrics[
                                      key as keyof typeof arkRequirements
                                    ] >= minimum
                                      ? "condition-met"
                                      : "condition-missed"
                                  }
                                  key={key}
                                >
                                  {
                                    metricInfo[
                                      key as keyof typeof arkRequirements
                                    ].label
                                  }{" "}
                                  {metrics[key as keyof typeof arkRequirements]}{" "}
                                  / 需 {minimum}{" "}
                                  {metrics[
                                    key as keyof typeof arkRequirements
                                  ] >= minimum
                                    ? "✓"
                                    : "未达成"}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                        <section className="history-section">
                          <div className="section-label">
                            <span>你的执政记录</span>
                            <span className="mono">DECISION LOG</span>
                          </div>
                          <ol>
                            {history.map((choice, index) => (
                              <li key={choice.id}>
                                <span className="mono">
                                  {events[index].year}
                                </span>
                                <div>
                                  <h3>{events[index].title}</h3>
                                  <p>{choice.title}</p>
                                </div>
                                <Icon name="check" size={15} />
                              </li>
                            ))}
                          </ol>
                        </section>
                        <div className="ending-actions">
                          <button
                            className="button-primary"
                            onClick={() => setConfirmRestart(true)}
                          >
                            重新开始
                            <Icon name="restart" size={18} />
                          </button>
                          <button
                            className="button-text"
                            onClick={() => setPlaying(false)}
                          >
                            返回档案概览
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="archive-tag">
                          {currentEvent.subtitle}
                        </span>
                        <h1
                          className="narrative-title"
                          tabIndex={-1}
                          ref={heading}
                        >
                          {currentEvent.title}
                        </h1>
                        <p className="event-subheading mono">
                          DIRECTIVE {String(eventIndex + 1).padStart(2, "0")} ·{" "}
                          {state.phase === "aftermath"
                            ? "FILED"
                            : "AWAITING DECISION"}
                        </p>
                        {state.phase === "decision" ? (
                          <>
                            <div className="story-prose">
                              {currentEvent.paragraphs.map((text) => (
                                <p key={text}>{text}</p>
                              ))}
                            </div>
                            <div className="advisor">
                              <span className="advisor-monogram">
                                {currentEvent.advisor.name[0]}
                              </span>
                              <div>
                                <p>“{currentEvent.advisor.quote}”</p>
                                <span>
                                  {currentEvent.advisor.name}
                                  <small>{currentEvent.advisor.role}</small>
                                </span>
                              </div>
                            </div>
                            <Decision
                              key={currentEvent.id}
                              event={currentEvent}
                              onChoose={(id) => commit(choose(state, id))}
                            />
                          </>
                        ) : (
                          <div className="aftermath">
                            <div className="aftermath-label">
                              <Icon name="check" size={16} />
                              决策已归档
                            </div>
                            <h2>{history.at(-1)?.title}</h2>
                            <Delta delta={history.at(-1)!.delta} />
                            <div className="story-prose">
                              <p>{history.at(-1)?.consequence}</p>
                            </div>
                            <div className="aftermath-note">
                              <span className="tiny-square" />
                              <p>
                                指标已更新。这一决定将成为文明历史的一部分。
                              </p>
                            </div>
                            <button
                              className="button-primary"
                              onClick={() => commit(advance(state))}
                            >
                              {state.decisions.length === events.length
                                ? "见证文明的结局"
                                : "继续时间线"}
                              <Icon name="arrow" size={18} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                  <MetricsPanel metrics={metrics} state={state} />
                </div>
                <div className="game-footer">
                  <span className="mono">LAST LIGHT / V0.1</span>
                  <button
                    className="button-text"
                    onClick={() => setConfirmRestart(true)}
                  >
                    <Icon name="restart" size={14} />
                    重新开始
                  </button>
                </div>
              </>
            )
          )}
        </main>
        <footer className="site-footer">
          <span>文明档案终端</span>
          <span className="mono">AN ACCOUNT OF WHAT REMAINS.</span>
          <span className="mono">LL—001</span>
        </footer>
      </div>

      <dialog
        ref={dialog}
        className="restart-dialog"
        onCancel={() => setConfirmRestart(false)}
        onClose={() => setConfirmRestart(false)}
        aria-labelledby="restart-title"
        aria-describedby="restart-description"
      >
        <span className="archive-tag mono">NEW CIVILIZATION RECORD</span>
        <h2 id="restart-title">开启新的文明档案？</h2>
        <p id="restart-description">
          这将覆盖当前设备上的游戏进度，从 2847 年重新开始。已有决策无法恢复。
        </p>
        <div className="dialog-actions">
          <button
            className="button-secondary"
            onClick={() => setConfirmRestart(false)}
            autoFocus
          >
            保留当前档案
          </button>
          <button className="button-primary" onClick={begin}>
            确认重新开始
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </dialog>
    </div>
  );
}
