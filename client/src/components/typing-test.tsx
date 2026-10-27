import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  applyInput,
  advanceSession,
  createSession,
  statistics,
  type Session,
} from "@/lib/typing";
import { getRandomText } from "@/lib/passages";
import { saveBest } from "@/lib/personal-bests";
import { PersonalBests } from "./leaderboard";
import type { GameMode, Duration } from "@shared/schema";

export function TypingTest({ mode }: { mode: GameMode }) {
  const [duration, setDuration] = useState<Duration>(30);
  const [session, setSession] = useState<Session>(() => createSession("", 30));
  const current = useRef(session),
    textareaRef = useRef<HTMLTextAreaElement>(null),
    passageRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => performance.now());
  const [showResults, setShowResults] = useState(false);
  const [bestVersion, setBestVersion] = useState(0);
  const [storageWarning, setStorageWarning] = useState(false);
  const saved = useRef(false);
  function publish(next: Session, time: number) {
    current.current = next;
    setSession(next);
    setNow(time);
  }
  function reset(nextDuration = duration, arm = false) {
    saved.current = false;
    setShowResults(false);
    publish(
      createSession(arm ? getRandomText(mode, nextDuration) : "", nextDuration),
      performance.now(),
    );
    if (arm)
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        if (passageRef.current) passageRef.current.scrollTop = 0;
      });
  }
  // Timer callbacks only sample the monotonic deadline; they never increment elapsed time.
  useEffect(() => {
    if (session.status !== "running") return;
    const tick = () => {
      const time = performance.now();
      publish(advanceSession(current.current, time), time);
    };
    const interval = window.setInterval(tick, 50);
    const deadline = current.current.startedAt! + duration * 1000;
    const timeout = window.setTimeout(
      tick,
      Math.max(0, deadline - performance.now()),
    );
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [session.status, duration]);
  useEffect(() => {
    if (session.status !== "finished" || saved.current) return;
    saved.current = true;
    const result = statistics(session, now);
    setStorageWarning(
      !saveBest({
        mode,
        duration,
        netWpm: result.netWpm,
        grossWpm: result.grossWpm,
        accuracy: result.accuracy,
        completedAt: new Date().toISOString(),
      }),
    );
    setBestVersion((v) => v + 1);
    setShowResults(true);
  }, [session.status, session, now, mode, duration]);
  const passage = useMemo(() => {
    const typed = Array.from(session.typed);
    return session.target ? (
      Array.from(session.target).map((char, index) => (
        <span
          key={index}
          data-current={index === typed.length}
          className={
            typed[index] === undefined
              ? "text-muted-foreground"
              : typed[index] === char
                ? "text-green-400"
                : "text-red-400 underline decoration-2"
          }
        >
          {char}
        </span>
      ))
    ) : (
      <span className="text-muted-foreground">
        Choose a duration, then press Start.
      </span>
    );
  }, [session.target, session.typed]);
  const result = statistics(session, now);
  const active = session.target !== "" && session.status !== "finished";
  useEffect(() => {
    passageRef.current
      ?.querySelector("[data-current=true]")
      ?.scrollIntoView({ block: "nearest" });
  }, [session.typed.length]);
  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="group" aria-label="Test duration">
        {([15, 30, 60] as Duration[]).map((time) => (
          <Button
            key={time}
            aria-pressed={duration === time}
            variant={duration === time ? "default" : "outline"}
            onClick={() => {
              setDuration(time);
              reset(time);
            }}
          >
            {time}s
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <div
            ref={passageRef}
            data-testid="passage"
            className="mb-4 font-mono text-lg leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap break-words"
            aria-label="Text to type"
          >
            {passage}
          </div>
          <label htmlFor="typing-input" className="sr-only">
            Type the passage
          </label>
          <textarea
            id="typing-input"
            ref={textareaRef}
            value={session.typed}
            onChange={(e) => {
              const time = performance.now();
              publish(applyInput(current.current, e.target.value, time), time);
            }}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            disabled={!active}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full h-32 p-4 font-mono bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={
              active
                ? "Timer starts with your first character."
                : "Press Start to begin."
            }
          />
          <div className="flex justify-end gap-2 mt-3">
            {active && (
              <Button onClick={() => reset()} variant="outline">
                Cancel
              </Button>
            )}
            <Button onClick={() => reset(duration, true)}>
              {active || session.status === "finished" ? "Restart" : "Start"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Progress
        aria-label="Time remaining"
        value={(result.remaining / duration) * 100}
      />
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm tabular-nums"
        aria-label="Live statistics"
      >
        <span data-testid="time">Time: {Math.ceil(result.remaining)}s</span>
        <span data-testid="net">Net WPM: {Math.round(result.netWpm)}</span>
        <span data-testid="gross">
          Gross WPM: {Math.round(result.grossWpm)}
        </span>
        <span data-testid="accuracy">
          Accuracy: {Math.round(result.accuracy)}%
        </span>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">How scoring works</summary>
        <p className="mt-2">
          Five characters, including spaces, equal one word. Gross WPM counts
          all inserted characters. Net WPM counts correct characters still in
          your text. Accuracy counts correct insertions out of all attempts;
          correcting an error does not erase that attempt. Backspaces add no
          typing credit. Paste is disabled. The timer starts on your first
          character and continues if you leave the tab.
        </p>
      </details>
      {storageWarning && (
        <p role="status" className="text-sm">
          Local storage is unavailable. This result could not be saved.
        </p>
      )}
      <PersonalBests key={`${mode}-${bestVersion}`} mode={mode} />
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Test complete
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode.charAt(0).toUpperCase() + mode.slice(1)} mode ·{" "}
              {result.elapsed.toFixed(2)} seconds
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <strong className="text-2xl">{Math.round(result.netWpm)}</strong>
              <span className="block text-xs">Net WPM</span>
            </div>
            <div>
              <strong className="text-2xl">
                {Math.round(result.grossWpm)}
              </strong>
              <span className="block text-xs">Gross WPM</span>
            </div>
            <div>
              <strong className="text-2xl">
                {Math.round(result.accuracy)}%
              </strong>
              <span className="block text-xs">Accuracy</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {result.correct} correct characters · {result.incorrect} uncorrected
            errors · {result.attempts} insertion attempts
          </p>
          <Button onClick={() => reset(duration, true)}>Try again</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
