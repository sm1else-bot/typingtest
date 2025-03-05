
import { motion } from "framer-motion";

export function CircuitBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Animated Floating Shapes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 15 + Math.random() * 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          {/* Randomly choose between different geometric shapes */}
          {i % 4 === 0 ? (
            <div className="w-16 h-16 border border-primary/30 rotate-45 transform" />
          ) : i % 4 === 1 ? (
            <div className="w-12 h-12 border-2 border-primary/20 rounded-full" />
          ) : i % 4 === 2 ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary/20" strokeWidth="1">
              <polygon points="12 2 19 21 3 9 21 9 5 21" />
            </svg>
          ) : (
            <div className="w-10 h-10 border border-primary/30 transform rotate-12" />
          )}
        </motion.div>
      ))}

      {/* Animated Concentric Circles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute inset-0"
          initial={{ opacity: 0.1, scale: 1 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="100%" height="100%" className="absolute">
            <circle
              cx="50%"
              cy="50%"
              r={100 + i * 40}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray={i % 2 === 0 ? "4 4" : "none"}
              className="text-primary/20"
            />
          </svg>
        </motion.div>
      ))}

      {/* Pulsating Center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-32 h-32 rounded-full bg-primary/10" />
      </motion.div>
    </div>
  );
}
