import { arkRequirements, endings, events, initialMetrics } from "./story";
import {
  metricKeys,
  type Choice,
  type Ending,
  type GameState,
  type Metrics,
} from "./types";

export function newGame(): GameState {
  return { phase: "prologue", decisions: [] };
}

export function applyDelta(metrics: Metrics, delta: Metrics): Metrics {
  return Object.fromEntries(
    metricKeys.map((key) => [
      key,
      Math.max(0, Math.min(100, metrics[key] + delta[key])),
    ]),
  ) as Metrics;
}

export function getHistory(state: GameState): Choice[] {
  return state.decisions.map((id, index) => {
    const choice = events[index]?.choices.find((entry) => entry.id === id);
    if (!choice) throw new Error("无效的决策记录");
    return choice;
  });
}

export function getMetrics(state: GameState): Metrics {
  return getHistory(state).reduce(
    (metrics, choice) => applyDelta(metrics, choice.delta),
    { ...initialMetrics },
  );
}

export function choose(state: GameState, choiceId: string): GameState {
  if (state.phase !== "decision") throw new Error("当前阶段不能作出决策");
  const event = events[state.decisions.length];
  if (!event?.choices.some((choice) => choice.id === choiceId))
    throw new Error("当前事件不存在此选项");
  return { phase: "aftermath", decisions: [...state.decisions, choiceId] };
}

export function advance(state: GameState): GameState {
  if (state.phase === "prologue") return { ...state, phase: "decision" };
  if (state.phase === "aftermath")
    return {
      ...state,
      phase: state.decisions.length === events.length ? "ending" : "decision",
    };
  throw new Error("当前阶段不能继续");
}

export function getEnding(state: GameState): Ending {
  if (state.phase !== "ending" || state.decisions.length !== events.length)
    throw new Error("尚未到达结局");
  const metrics = getMetrics(state);
  const canLaunch = Object.entries(arkRequirements).every(
    ([key, minimum]) => metrics[key as keyof typeof arkRequirements] >= minimum,
  );
  return canLaunch ? endings.ark : endings.book;
}

export function getLegacyQuality(legacy: number): {
  title: string;
  description: string;
} {
  if (legacy >= 70)
    return {
      title: "丰厚的记忆",
      description:
        "大量语言、知识与个人故事得以保存。未来的读者将看见一个有血有肉的文明。",
    };
  if (legacy >= 45)
    return {
      title: "留存的片段",
      description:
        "核心知识与部分生活记录得以保存。仍有一些声音，消失在档案的空白里。",
    };
  return {
    title: "稀薄的回声",
    description:
      "仅有少量核心记录得以保存。文明留下了存在的证明，却失去了许多普通人的名字。",
  };
}

// Only allow reachable phases and correctly ordered choices. Metrics are always recalculated.
export function validateState(value: unknown): GameState | null {
  if (!value || typeof value !== "object") return null;
  const { phase, decisions } = value as Record<string, unknown>;
  if (!Array.isArray(decisions) || decisions.length > events.length)
    return null;
  if (
    !decisions.every(
      (id, index) =>
        typeof id === "string" &&
        events[index].choices.some((choice) => choice.id === id),
    )
  )
    return null;
  const count = decisions.length;
  const reachable =
    (phase === "prologue" && count === 0) ||
    (phase === "decision" && count < events.length) ||
    (phase === "aftermath" && count > 0) ||
    (phase === "ending" && count === events.length);
  return reachable
    ? { phase: phase as GameState["phase"], decisions: [...decisions] }
    : null;
}
