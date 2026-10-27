import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateWPM,
  calculateAccuracy,
  createSession,
  applyInput,
  advanceSession,
  statistics,
} from "../client/src/lib/typing.ts";
import { getRandomText, texts } from "../client/src/lib/passages.ts";
import {
  readBests,
  saveBest,
  type PersonalBest,
} from "../client/src/lib/personal-bests.ts";
const target = "abc def ghi ".repeat(500);
test("standard gross WPM includes spaces without a multiplier", () => {
  assert.equal(calculateWPM("a b c", 60), 1);
  assert.equal(calculateWPM(250, 30), 100);
  assert.equal(calculateWPM(0, 0), 0);
  assert.equal(calculateWPM(10, -1), 0);
});
test("armed tests do not charge idle time and first input starts the clock", () => {
  let s = createSession(target, 30);
  assert.equal(statistics(s, 90000).elapsed, 0);
  s = applyInput(s, "a", 90000);
  assert.equal(s.startedAt, 90000);
  assert.equal(statistics(s, 91000).elapsed, 1);
});
test("fractional seconds drive live WPM, which can legitimately decrease while idle", () => {
  const s = applyInput(createSession(target, 30), "abc d", 100);
  assert.equal(statistics(s, 600).grossWpm, 120);
  assert.equal(statistics(s, 1100).grossWpm, 60);
});
test("mistakes, backspaces and corrections retain the insertion history", () => {
  let s = applyInput(createSession(target, 30), "ax", 1000);
  assert.equal(statistics(s, 2000).accuracy, 50);
  s = applyInput(s, "a", 2000);
  s = applyInput(s, "ab", 3000);
  const result = statistics(s, 4000);
  assert.equal(result.attempts, 3);
  assert.ok(Math.abs(result.accuracy - (100 * 2) / 3) < 1e-10);
  assert.equal(result.correct, 2);
  assert.equal(result.incorrect, 0);
  assert.equal(result.netWpm, 8);
  assert.equal(result.grossWpm, 12);
});
test("spaces stay in one editable input and backspace can cross a word boundary", () => {
  let s = applyInput(createSession(target, 30), "abc ", 0);
  s = applyInput(s, "abc", 100);
  s = applyInput(s, "ab", 200);
  assert.equal(s.typed, "ab");
  assert.equal(s.attempts, 4);
  assert.equal(statistics(s, 1000).correct, 2);
});
test("selection replacements count inserted characters, not an unchanged suffix", () => {
  let s = applyInput(createSession(target, 30), "abc def", 0);
  s = applyInput(s, "axc def", 100);
  assert.equal(s.attempts, 8);
  assert.equal(statistics(s, 1000).incorrect, 1);
  assert.equal(s.correctAttempts, 7);
});
for (const duration of [15, 30, 60]) {
  test(`${duration}s exact deadline ignores late typing and delayed ticks`, () => {
    let s = applyInput(createSession(target, duration), "a", 10000);
    s = applyInput(s, "abc def", 10000 + duration * 1000 - 1);
    const finished = applyInput(s, "abc def ghi", 10000 + duration * 1000);
    assert.equal(finished.typed, "abc def");
    assert.equal(finished.endedAt, 10000 + duration * 1000);
    assert.equal(statistics(finished, 1e9).elapsed, duration);
    assert.equal(statistics(finished, 1e9).remaining, 0);
    assert.deepEqual(advanceSession(s, 1e9), finished);
    assert.deepEqual(applyInput(finished, "x", 1e9), finished);
  });
}
test("passage completion freezes early at the input timestamp", () => {
  let s = applyInput(createSession("abc", 30), "a", 1000);
  s = applyInput(s, "abc", 2000);
  assert.equal(s.status, "finished");
  assert.equal(statistics(s, 99999).elapsed, 1);
  assert.equal(statistics(s, 99999).netWpm, 36);
});
test("restart creates completely fresh statistical state", () => {
  const old = applyInput(createSession(target, 30), "wrong", 1000);
  const fresh = createSession("new passage", 15);
  assert.equal(fresh.typed, "");
  assert.equal(fresh.attempts, 0);
  assert.equal(fresh.startedAt, null);
  assert.equal(fresh.status, "ready");
  assert.equal(statistics(fresh, 90000).remaining, 15);
  assert.notEqual(old, fresh);
});
test("all modes preserve original passages and supply enough text for long tests", () => {
  for (const mode of ["octopus", "dolphin", "owl"] as const) {
    assert.ok(texts[mode].length >= 3);
    assert.ok(getRandomText(mode, 60, () => 0).length >= 2400);
  }
});
test("accuracy has defined empty and zero-error behavior", () => {
  assert.equal(calculateAccuracy(0, 0), 0);
  assert.equal(calculateAccuracy(5, 5), 100);
  assert.equal(calculateAccuracy(3, 4), 75);
});
test("personal bests persist per mode AND duration, retaining the better net score", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const score: PersonalBest = {
    mode: "octopus",
    duration: 15,
    netWpm: 100,
    grossWpm: 110,
    accuracy: 90,
    completedAt: "2026-10-27T00:00:00Z",
  };
  assert.equal(saveBest(score, storage), true);
  saveBest({ ...score, netWpm: 50 }, storage);
  saveBest({ ...score, duration: 30 }, storage);
  saveBest({ ...score, mode: "owl" }, storage);
  assert.equal(readBests(storage).length, 3);
  assert.equal(readBests(storage)[0].netWpm, 100);
  assert.deepEqual(readBests({ getItem: () => "{broken" }), []);
  assert.equal(
    saveBest(
      { ...score, netWpm: 200 },
      {
        ...storage,
        setItem: () => {
          throw Error("blocked");
        },
      },
    ),
    false,
  );
});
