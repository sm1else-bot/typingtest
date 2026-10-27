/** Gross WPM counts every inserted character, including spaces and corrected attempts.
 * Net WPM counts correct characters still present in the submitted text.
 * Accuracy is correct insertion attempts / all insertion attempts. Backspace removes
 * text but never erases an earlier mistake from accuracy or earns typing credit.
 */
export interface Session {
  target: string;
  duration: number;
  status: "ready" | "running" | "finished";
  typed: string;
  startedAt: number | null;
  endedAt: number | null;
  attempts: number;
  correctAttempts: number;
}
export function calculateWPM(
  textOrCount: string | number,
  seconds: number,
): number {
  const count =
    typeof textOrCount === "string"
      ? Array.from(textOrCount).length
      : textOrCount;
  return seconds > 0 && Number.isFinite(seconds)
    ? (Math.max(0, count) * 12) / seconds
    : 0;
}
export function calculateAccuracy(
  correctAttempts: number,
  attempts: number,
): number {
  return attempts > 0
    ? Math.min(100, Math.max(0, (correctAttempts / attempts) * 100))
    : 0;
}
export function createSession(target: string, duration: number): Session {
  return {
    target,
    duration,
    status: "ready",
    typed: "",
    startedAt: null,
    endedAt: null,
    attempts: 0,
    correctAttempts: 0,
  };
}
export function advanceSession(session: Session, now: number): Session {
  if (session.status !== "running" || session.startedAt === null)
    return session;
  const deadline = session.startedAt + session.duration * 1000;
  return now >= deadline
    ? { ...session, status: "finished", endedAt: deadline }
    : session;
}
export function applyInput(
  previous: Session,
  value: string,
  now: number,
): Session {
  const session = advanceSession(previous, now);
  if (session.status === "finished") return session;
  const target = Array.from(session.target),
    before = Array.from(session.typed);
  const after = Array.from(value).slice(0, target.length);
  let prefix = 0,
    suffix = 0;
  while (
    prefix < before.length &&
    prefix < after.length &&
    before[prefix] === after[prefix]
  )
    prefix++;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  )
    suffix++;
  const inserted = after.slice(prefix, after.length - suffix);
  if (!inserted.length && !session.attempts) return session;
  const startedAt = session.startedAt ?? now;
  const next: Session = {
    ...session,
    typed: after.join(""),
    status: "running",
    startedAt,
    attempts: session.attempts + inserted.length,
    correctAttempts:
      session.correctAttempts +
      inserted.filter((char, i) => char === target[prefix + i]).length,
  };
  if (after.length === target.length)
    return { ...next, status: "finished", endedAt: now };
  return next;
}
export function statistics(session: Session, now: number) {
  const end =
    session.endedAt ??
    Math.min(now, (session.startedAt ?? now) + session.duration * 1000);
  const elapsed =
    session.startedAt === null
      ? 0
      : Math.max(0, (end - session.startedAt) / 1000);
  const original = Array.from(session.target),
    typed = Array.from(session.typed);
  const correct = typed.filter((char, i) => char === original[i]).length;
  return {
    elapsed,
    remaining: Math.max(0, session.duration - elapsed),
    correct,
    incorrect: typed.length - correct,
    attempts: session.attempts,
    grossWpm: calculateWPM(session.attempts, elapsed),
    netWpm: calculateWPM(correct, elapsed),
    accuracy: calculateAccuracy(session.correctAttempts, session.attempts),
  };
}
