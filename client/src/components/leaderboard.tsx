import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { readBests } from "@/lib/personal-bests";
import type { GameMode } from "@shared/schema";
export function PersonalBests({ mode }: { mode: GameMode }) {
  const [records] = useState(() => readBests());
  const scores = records
    .filter((r) => r.mode === mode)
    .sort((a, b) => a.duration - b.duration);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary text-lg">Personal bests</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Saved in this browser only. Not a global leaderboard.
        </p>
        {scores.length ? (
          <ul className="space-y-2">
            {scores.map((score) => (
              <li
                key={score.duration}
                className="flex justify-between gap-2 text-sm"
              >
                <span>{score.duration}s</span>
                <span>
                  {Math.round(score.netWpm)} net WPM ·{" "}
                  {Math.round(score.accuracy)}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete a test to save your first result.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
