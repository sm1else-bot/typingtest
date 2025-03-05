import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  initials: text("initials").notNull(),
  wpm: integer("wpm").notNull(),
  accuracy: integer("accuracy").notNull(),
  mode: text("mode").notNull(),
});

export const insertScoreSchema = createInsertSchema(scores).pick({
  initials: true,
  wpm: true,
  accuracy: true,
  mode: true,
});

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;

export type GameMode = "octopus" | "dolphin" | "owl";
