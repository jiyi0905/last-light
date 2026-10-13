import { describe, expect, it } from "vitest";
import { advance, choose, getMetrics, newGame } from "./engine";
import { loadGame, SAVE_KEY, saveGame, type SaveStore } from "./storage";

function memoryStore(): SaveStore {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
  };
}

describe("local progress", () => {
  it("handles an empty device", () => {
    expect(loadGame(memoryStore())).toEqual({ state: null, status: "empty" });
  });

  it("round trips the decision aftermath and recalculates metrics", () => {
    const store = memoryStore();
    const state = choose(advance(newGame()), "truth-open");
    expect(saveGame(store, state)).toBe(true);
    expect(loadGame(store)).toEqual({ state, status: "loaded" });
    expect(getMetrics(loadGame(store).state!)).toEqual(getMetrics(state));
    expect(JSON.parse(store.getItem(SAVE_KEY)!)).not.toHaveProperty("metrics");
  });

  it("overwrites only its own key when restarting", () => {
    const store = memoryStore();
    store.setItem("unrelated-app", "preserve-me");
    saveGame(store, choose(advance(newGame()), "truth-open"));
    saveGame(store, newGame());
    expect(loadGame(store).state).toEqual(newGame());
    expect(store.getItem("unrelated-app")).toBe("preserve-me");
  });

  it.each([
    "not json",
    "null",
    '{"version":99,"state":{}}',
    '{"version":1,"state":{"phase":"ending","decisions":[]}}',
  ])("reports invalid data without overwriting it: %s", (raw) => {
    const store = memoryStore();
    store.setItem(SAVE_KEY, raw);
    expect(loadGame(store)).toEqual({ state: null, status: "invalid" });
    expect(store.getItem(SAVE_KEY)).toBe(raw);
  });

  it("gracefully handles denied storage and quota errors", () => {
    const denied: SaveStore = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(loadGame(denied)).toEqual({ state: null, status: "unavailable" });
    expect(saveGame(denied, newGame())).toBe(false);
  });
});
