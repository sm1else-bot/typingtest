import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GameMode } from "@shared/schema";
import { motion } from "framer-motion";

interface Props {
  value: GameMode;
  onValueChange: (value: GameMode) => void;
}

export function ModeSelect({ value, onValueChange }: Props) {
  return (
    <Tabs value={value} onValueChange={onValueChange as any}>
      <TabsList className="w-full">
        {[
          { id: "octopus", label: "Octopus Mode", desc: "Random Words" },
          { id: "dolphin", label: "Dolphin Mode", desc: "Simple Sentences" },
          { id: "owl", label: "Owl Mode", desc: "Sophisticated Literature" },
        ].map((mode) => (
          <TabsTrigger
            key={mode.id}
            value={mode.id}
            className="flex-1 relative overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="font-bold">{mode.label}</div>
              <div className="text-xs opacity-70">{mode.desc}</div>
            </motion.div>
            
            {value === mode.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary/10"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
