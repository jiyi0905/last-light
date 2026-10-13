import { validateState } from "./engine";
import type { GameState } from "./types";

export const SAVE_KEY = "last-light:v0.1";
const SAVE_VERSION = 1;

export interface SaveStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type LoadResult = {
  state: GameState | null;
  status: "empty" | "loaded" | "invalid" | "unavailable";
};

export function loadGame(store: SaveStore): LoadResult {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (raw === null) return { state: null, status: "empty" };
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      !("version" in value) ||
      value.version !== SAVE_VERSION ||
      !("state" in value)
    ) {
      return { state: null, status: "invalid" };
    }
    const state = validateState(value.state);
    return { state, status: state ? "loaded" : "invalid" };
  } catch (error) {
    return {
      state: null,
      status: error instanceof SyntaxError ? "invalid" : "unavailable",
    };
  }
}

export function saveGame(store: SaveStore, state: GameState): boolean {
  try {
    store.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state }));
    return true;
  } catch {
    return false;
  }
}
