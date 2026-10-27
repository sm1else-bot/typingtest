import type { GameMode, Duration } from "@shared/schema";
export interface PersonalBest {
  mode: GameMode;
  duration: Duration;
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  completedAt: string;
}
const KEY = "typing-test.personal-bests.v1";
export function readBests(
  storage?: Pick<Storage, "getItem">,
): PersonalBest[] {
  try {
    const records = JSON.parse((storage ?? window.localStorage).getItem(KEY) || "[]");
    return Array.isArray(records)
      ? records.filter(
          (r: PersonalBest) =>
            ["octopus", "dolphin", "owl"].includes(r?.mode) &&
            [15, 30, 60].includes(r?.duration) &&
            [r.netWpm, r.grossWpm, r.accuracy].every(
              (n) => Number.isFinite(n) && n >= 0,
            ) &&
            r.accuracy <= 100 &&
            typeof r.completedAt === "string",
        )
      : [];
  } catch {
    return [];
  }
}
export function saveBest(
  score: PersonalBest,
  storage?: Pick<Storage, "getItem" | "setItem">,
): boolean {
  try {
    const available = storage ?? window.localStorage;
    const records = readBests(available);
    const existing = records.find(
      (r) => r.mode === score.mode && r.duration === score.duration,
    );
    if (existing && existing.netWpm >= score.netWpm) return true;
    available.setItem(
      KEY,
      JSON.stringify([
        ...records.filter(
          (r) => r.mode !== score.mode || r.duration !== score.duration,
        ),
        score,
      ]),
    );
    return true;
  } catch {
    return false;
  }
}
