import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botsTable = pgTable("bots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  isPremium: boolean("is_premium").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  languages: text("languages").array().notNull().default([]),
  subscribers: integer("subscribers"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBotSchema = createInsertSchema(botsTable).omit({ id: true, createdAt: true, rating: true, reviewCount: true });
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof botsTable.$inferSelect;
