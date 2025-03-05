import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { calculateWPM, calculateAccuracy } from "@/lib/typing";
import type { GameMode } from "@shared/schema";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  mode: GameMode;
}

export function TypingTest({ mode }: Props) {
  const [timeOption, setTimeOption] = useState(30);
  const [timeLeft, setTimeLeft] = useState(timeOption);
  const [isActive, setIsActive] = useState(false);
  const [typed, setTyped] = useState("");
  const [fullTyped, setFullTyped] = useState(""); // Track full typed text for accuracy
  const [showResults, setShowResults] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: textData, refetch } = useQuery({
    queryKey: [`/api/text/${mode}`],
    enabled: false,
  });

  const targetText = textData?.text || "";

  const scoreMutation = useMutation({
    mutationFn: async (score: any) => {
      const response = await apiRequest("POST", "/api/scores", score);
      queryClient.invalidateQueries({ queryKey: ["/api/scores", mode] });
      return response;
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setShowResults(true);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTest = async () => {
    await refetch();
    setTimeLeft(timeOption);
    setTyped("");
    setFullTyped("");
    setIsActive(true);
    setShowResults(false);
    textareaRef.current?.focus();
  };

  const cancelTest = () => {
    setIsActive(false);
    setTyped("");
    setFullTyped("");
    setTimeLeft(timeOption);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isActive) return;

    const newValue = e.target.value;
    if (newValue.endsWith(" ")) {
      // When space is pressed, update full typed text and clear input
      setFullTyped(prev => prev + newValue);
      setTyped("");
    } else {
      setTyped(newValue);
    }
  };

  // Combine current typed text with previously typed text for accuracy calculation
  const completeTypedText = fullTyped + typed;
  const wpm = calculateWPM(completeTypedText, timeOption - timeLeft);
  const accuracy = calculateAccuracy(targetText, completeTypedText);

  const saveScore = async (initials: string) => {
    await scoreMutation.mutateAsync({
      initials,
      wpm,
      accuracy,
      mode,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[15, 30, 60].map(time => (
          <Button
            key={time}
            variant={timeOption === time ? "default" : "outline"}
            onClick={() => setTimeOption(time)}
            disabled={isActive}
          >
            {time}s
          </Button>
        ))}
      </div>

      <Card className="relative">
        <CardContent className="p-4">
          {/* Target Text Display */}
          <div className="mb-4 font-mono text-lg">
            {targetText.split("").map((char, index) => (
              <span
                key={index}
                className={
                  completeTypedText[index] === undefined
                    ? "text-muted-foreground"
                    : completeTypedText[index] === char
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {char}
              </span>
            ))}
          </div>

          {/* Typing Input */}
          <textarea
            ref={textareaRef}
            value={typed}
            onChange={handleTyping}
            disabled={!isActive || !targetText}
            className="w-full h-32 p-4 font-mono bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={isActive ? "Start typing..." : "Click Start to begin..."}
          />

          <div className="absolute bottom-4 right-4 flex gap-2">
            {isActive ? (
              <Button onClick={cancelTest} variant="destructive">
                Cancel
              </Button>
            ) : (
              <motion.div animate={{ scale: 1.1 }}>
                <Button onClick={startTest}>
                  Start
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      <Progress value={(timeLeft / timeOption) * 100} />

      <div className="flex justify-between text-sm">
        <span>Time: {timeLeft}s</span>
        <span>WPM: {wpm}</span>
        <span>Accuracy: {accuracy}%</span>
      </div>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-3xl font-bold text-center">Test Complete!</DialogTitle>
            <DialogDescription className="text-xl text-center pt-4">
              <div className="flex justify-center items-center gap-6">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <span className="text-2xl font-bold">{wpm}</span>
                  <span className="block text-sm">WPM</span>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <span className="text-2xl font-bold">{accuracy}%</span>
                  <span className="block text-sm">Accuracy</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-6 pt-4">
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700" 
              onClick={() => {
                saveScore("YAY");
                setShowResults(false);
              }}
            >
              YAY!
            </Button>
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg bg-red-600 hover:bg-red-700" 
              onClick={() => {
                saveScore("NAY");
                setShowResults(false);
              }}
            >
              NAY!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}