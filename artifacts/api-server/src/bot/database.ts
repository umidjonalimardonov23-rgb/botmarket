import pg from "pg";
import { logger } from "../lib/logger.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      bot_type TEXT NOT NULL,
      bot_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      contact TEXT,
      note TEXT,
      status TEXT DEFAULT 'pending',
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    );
  `);
  logger.info("Database initialized");
}

export async function getOrCreateUser(telegramId: string, username: string | undefined, firstName: string | undefined, referredBy?: string) {
  const existing = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
  if (existing.rows[0]) return existing.rows[0];

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await pool.query(
    "INSERT INTO users (telegram_id, username, first_name, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (telegram_id) DO NOTHING",
    [telegramId, username || null, firstName || null, code, referredBy || null]
  );
  const res = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
  return res.rows[0];
}

export async function getUserByTelegramId(telegramId: string) {
  const res = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
  return res.rows[0] || null;
}

export async function getUserByReferralCode(code: string) {
  const res = await pool.query("SELECT * FROM users WHERE referral_code = $1", [code]);
  return res.rows[0] || null;
}

export async function createOrder(userId: string, botType: string, botName: string, price: number, contact: string, note: string) {
  const res = await pool.query(
    "INSERT INTO orders (user_id, bot_type, bot_name, price, contact, note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [userId, botType, botName, price, contact, note]
  );
  return res.rows[0].id as number;
}

export async function getUserOrders(userId: string) {
  const res = await pool.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", [userId]);
  return res.rows;
}

export async function updateOrderStatus(orderId: number, status: string) {
  await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [status, orderId]);
}

export async function getStats() {
  const [totalUsers, totalOrders, pendingOrders, completedOrders, revenue] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users"),
    pool.query("SELECT COUNT(*) FROM orders"),
    pool.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'"),
    pool.query("SELECT COUNT(*) FROM orders WHERE status = 'completed'"),
    pool.query("SELECT COALESCE(SUM(price),0) as total FROM orders WHERE status = 'completed'"),
  ]);
  return {
    totalUsers: parseInt(totalUsers.rows[0].count),
    totalOrders: parseInt(totalOrders.rows[0].count),
    pendingOrders: parseInt(pendingOrders.rows[0].count),
    completedOrders: parseInt(completedOrders.rows[0].count),
    totalRevenue: parseInt(revenue.rows[0].total),
  };
}

export async function getAllPendingOrders() {
  const res = await pool.query("SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10");
  return res.rows;
}
