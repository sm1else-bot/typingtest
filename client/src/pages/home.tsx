import { CircuitBackground } from "@/components/circuit-background";
import { TypingTest } from "@/components/typing-test";
import { ModeSelect } from "@/components/mode-select";
import { CustomCursor } from "@/components/custom-cursor";
import { useState } from "react";
import type { GameMode } from "@shared/schema";

export default function Home() {
  const [mode, setMode] = useState<GameMode>("octopus");

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CustomCursor />
      <CircuitBackground />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary flex items-center justify-center gap-2">
          <span>Test your Typing - TLW/UI</span>
          <span role="img" aria-label="keyboard" className="text-3xl">⌨️</span>
        </h1>

        <div className="max-w-3xl mx-auto">
          <ModeSelect value={mode} onValueChange={setMode} />
          <div className="mt-8">
            <TypingTest mode={mode} />
          </div>
        </div>
      </main>
    </div>
  );
}