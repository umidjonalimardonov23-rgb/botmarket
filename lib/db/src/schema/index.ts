import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const botTypesTable = pgTable("bot_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  emoji: text("emoji").notNull(),
  features: text("features").array().notNull().default([]),
  popular: boolean("popular").notNull().default(false),
  imageUrl: text("image_url"),
  serverMonthlyPrice: integer("server_monthly_price").notNull().default(50000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const telegramUsersTable = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  referralCode: text("referral_code").notNull(),
  referredBy: text("referred_by"),
  trialStartedAt: timestamp("trial_started_at"),
  trialBotId: integer("trial_bot_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  botTypeId: integer("bot_type_id").notNull(),
  botTypeName: text("bot_type_name").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  telegramId: text("telegram_id").notNull(),
  telegramUsername: text("telegram_username"),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalPrice: integer("total_price").notNull(),
  notes: text("notes"),
  referralCode: text("referral_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBotTypeSchema = createInsertSchema(botTypesTable).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(telegramUsersTable).omit({ id: true, createdAt: true });

export type BotType = typeof botTypesTable.$inferSelect;
export type InsertBotType = z.infer<typeof insertBotTypeSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type TelegramUser = typeof telegramUsersTable.$inferSelect;
export type InsertTelegramUser = z.infer<typeof insertUserSchema>;
