export const metricKeys = [
  "resources",
  "technology",
  "stability",
  "legacy",
] as const;
export type Metric = (typeof metricKeys)[number];
export type Metrics = Record<Metric, number>;
export type Phase = "prologue" | "decision" | "aftermath" | "ending";

export interface Choice {
  id: string;
  title: string;
  description: string;
  delta: Metrics;
  consequence: string;
}

export interface StoryEvent {
  id: string;
  year: number;
  title: string;
  subtitle: string;
  paragraphs: string[];
  advisor: { name: string; role: string; quote: string };
  choices: Choice[];
}

export interface GameState {
  phase: Phase;
  decisions: string[];
}

export interface Ending {
  id: "ark" | "book";
  title: string;
  subtitle: string;
  paragraphs: string[];
  lastLine: string;
}
