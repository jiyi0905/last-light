import { describe, expect, it } from "vitest";
import {
  advance,
  applyDelta,
  choose,
  getEnding,
  getHistory,
  getLegacyQuality,
  getMetrics,
  newGame,
  validateState,
} from "./engine";
import { events, initialMetrics } from "./story";
import { metricKeys, type GameState } from "./types";

function play(ids: string[]): GameState {
  let state = advance(newGame());
  for (const id of ids) state = advance(choose(state, id));
  return state;
}

describe("deterministic game rules", () => {
  it("starts at the prologue with independent initial state", () => {
    expect(newGame()).toEqual({ phase: "prologue", decisions: [] });
    expect(getMetrics(newGame())).toEqual(initialMetrics);
    const first = newGame();
    first.decisions.push("changed");
    expect(newGame().decisions).toEqual([]);
  });

  it("applies a decision once, records its outcome and advances in order", () => {
    const before = advance(newGame());
    const after = choose(before, "truth-open");
    expect(before).toEqual({ phase: "decision", decisions: [] });
    expect(after).toEqual({ phase: "aftermath", decisions: ["truth-open"] });
    expect(getMetrics(after)).toEqual({
      resources: 55,
      technology: 50,
      stability: 50,
      legacy: 55,
    });
    expect(() => choose(after, "truth-open")).toThrow();
    expect(advance(after).phase).toBe("decision");
    expect(getHistory(after)[0].consequence).toContain("公报发布");
  });

  it("clamps every metric to 0–100 without mutating inputs", () => {
    const delta = {
      resources: -100,
      technology: 100,
      stability: -100,
      legacy: 100,
    };
    expect(applyDelta(initialMetrics, delta)).toEqual({
      resources: 0,
      technology: 100,
      stability: 0,
      legacy: 100,
    });
    expect(initialMetrics).toEqual({
      resources: 60,
      technology: 40,
      stability: 65,
      legacy: 45,
    });
    expect(delta.technology).toBe(100);
  });

  it("rejects choices from a different event and invalid transitions", () => {
    expect(() => choose(newGame(), "truth-open")).toThrow();
    expect(() => choose(advance(newGame()), "scarcity-ark")).toThrow();
    expect(() => choose(advance(newGame()), "unknown")).toThrow();
    expect(() => advance(advance(newGame()))).toThrow();
    expect(() => getEnding(newGame())).toThrow();
    expect(() =>
      getHistory({ phase: "decision", decisions: ["unknown"] }),
    ).toThrow();
  });

  it("reaches the ark when all three thresholds are met", () => {
    const state = play(["truth-gradual", "scarcity-ark", "fracture-pact"]);
    expect(state.phase).toBe("ending");
    expect(getMetrics(state)).toEqual({
      resources: 50,
      technology: 75,
      stability: 55,
      legacy: 40,
    });
    expect(getEnding(state).id).toBe("ark");
    expect(() => advance(state)).toThrow();
    expect(() => choose(state, "fracture-pact")).toThrow();
  });

  it("requires stability even when resources and technology are sufficient", () => {
    const state = play(["truth-open", "scarcity-ark", "fracture-pact"]);
    expect(getMetrics(state)).toEqual({
      resources: 50,
      technology: 80,
      stability: 35,
      legacy: 55,
    });
    expect(getEnding(state).id).toBe("book");
  });

  it("preserves rich archives with a distinct non-ark route", () => {
    const state = play(["truth-open", "scarcity-book", "fracture-assembly"]);
    expect(getMetrics(state)).toEqual({
      resources: 40,
      technology: 60,
      stability: 70,
      legacy: 90,
    });
    expect(getEnding(state).id).toBe("book");
    expect(getLegacyQuality(getMetrics(state).legacy).title).toBe("丰厚的记忆");
  });

  it.each([
    [0, "稀薄的回声"],
    [44, "稀薄的回声"],
    [45, "留存的片段"],
    [69, "留存的片段"],
    [70, "丰厚的记忆"],
    [100, "丰厚的记忆"],
  ])("classifies legacy %i as %s", (value, title) => {
    expect(getLegacyQuality(value as number).title).toBe(title);
  });

  const combinations = events[0].choices.flatMap((a) =>
    events[1].choices.flatMap((b) => events[2].choices.map((c) => [a, b, c])),
  );
  it.each(
    combinations.map((choices) => ({
      name: choices.map((choice) => choice.id).join(" / "),
      choices,
    })),
  )("completes and validates route $name", ({ choices }) => {
    const state = play(choices.map((choice) => choice.id));
    const expected = { ...initialMetrics };
    for (const choice of choices) {
      for (const key of metricKeys)
        expected[key] = Math.max(
          0,
          Math.min(100, expected[key] + choice.delta[key]),
        );
    }
    expect(getMetrics(state)).toEqual(expected);
    expect(getHistory(state)).toHaveLength(3);
    expect(validateState(state)).toEqual(state);
    expect(getEnding(state).id).toBe(
      expected.resources >= 50 &&
        expected.technology >= 65 &&
        expected.stability >= 45
        ? "ark"
        : "book",
    );
    expect(play(choices.map((choice) => choice.id))).toEqual(state);
  });
});

describe("save state validation", () => {
  it.each([
    null,
    false,
    "bad",
    {},
    { phase: "prologue", decisions: ["truth-open"] },
    { phase: "aftermath", decisions: [] },
    { phase: "ending", decisions: [] },
    {
      phase: "decision",
      decisions: ["truth-open", "scarcity-ark", "fracture-pact"],
    },
    { phase: "unknown", decisions: [] },
    { phase: "decision", decisions: ["scarcity-ark"] },
    { phase: "decision", decisions: ["truth-open", "truth-open"] },
    {
      phase: "ending",
      decisions: ["truth-open", "scarcity-ark", "fracture-pact", "extra"],
    },
    { phase: "decision", decisions: [null] },
    { phase: "decision", decisions: "truth-open" },
  ])("rejects malformed or unreachable state %#", (value) => {
    expect(validateState(value)).toBeNull();
  });

  it("restores each reachable phase and discards forged metrics", () => {
    let state = newGame();
    expect(validateState(state)).toEqual(state);
    state = advance(state);
    for (const event of events) {
      expect(validateState(state)).toEqual(state);
      state = choose(state, event.choices[0].id);
      expect(validateState(state)).toEqual(state);
      state = advance(state);
    }
    const loaded = validateState({ ...state, metrics: { resources: 999 } });
    expect(loaded).toEqual(state);
    expect(getMetrics(loaded!).resources).not.toBe(999);
  });
});
