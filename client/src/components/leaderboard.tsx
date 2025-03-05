import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { GameMode } from "@shared/schema";
import { motion } from "framer-motion";

interface Props {
  mode: GameMode;
}

export function Leaderboard({ mode }: Props) {
  const { data: scores } = useQuery({
    queryKey: ["/api/scores", mode],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">High Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {scores?.map((score, i) => (
            <motion.div
              key={score.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex justify-between p-2 bg-accent/10 rounded"
            >
              <span className="font-mono">{score.initials}</span>
              <span className="font-bold">{score.wpm} WPM</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
