import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "../../data.json");

export interface User {
  id: number;
  username?: string;
  firstName: string;
  refBy?: number;
  refs: number[];
  trialStart: number;
  paidUntil?: number;
  orderCount: number;
  notified?: boolean;
}

export interface Order {
  id: string;
  userId: number;
  userFirstName: string;
  username?: string;
  botType: string;
  botName: string;
  requirements: string;
  status: "pending" | "confirmed" | "done" | "cancelled";
  price: number;
  createdAt: number;
}

interface DB {
  users: Record<number, User>;
  orders: Record<string, Order>;
}

function load(): DB {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as DB;
    }
  } catch {}
  return { users: {}, orders: {} };
}

function save(db: DB): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch {}
}

export function getUser(id: number): User | undefined {
  return load().users[id];
}

export function upsertUser(user: User): void {
  const db = load();
  db.users[user.id] = user;
  save(db);
}

export function createUser(id: number, firstName: string, username?: string, refBy?: number): User {
  const existing = getUser(id);
  if (existing) return existing;
  const user: User = {
    id,
    firstName,
    username,
    refBy,
    refs: [],
    trialStart: Date.now(),
    orderCount: 0,
  };
  if (refBy) {
    const db = load();
    const refUser = db.users[refBy];
    if (refUser) {
      refUser.refs.push(id);
      db.users[refBy] = refUser;
    }
    db.users[id] = user;
    save(db);
  } else {
    upsertUser(user);
  }
  return user;
}

export function createOrder(order: Omit<Order, "id" | "createdAt">): Order {
  const db = load();
  const id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newOrder: Order = { ...order, id, createdAt: Date.now() };
  db.orders[id] = newOrder;
  const user = db.users[order.userId];
  if (user) {
    user.orderCount = (user.orderCount || 0) + 1;
    db.users[order.userId] = user;
  }
  save(db);
  return newOrder;
}

export function getUserOrders(userId: number): Order[] {
  const db = load();
  return Object.values(db.orders)
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function updateOrderStatus(id: string, status: Order["status"]): void {
  const db = load();
  if (db.orders[id]) {
    db.orders[id]!.status = status;
    save(db);
  }
}

export function getExpiredTrialUsers(): User[] {
  const db = load();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return Object.values(db.users).filter((u) => {
    if (u.paidUntil && u.paidUntil > now) return false;
    if (u.notified) return false;
    return now - u.trialStart > oneWeek;
  });
}

export function markNotified(userId: number): void {
  const db = load();
  if (db.users[userId]) {
    db.users[userId]!.notified = true;
    save(db);
  }
}

export function getAllUsers(): User[] {
  return Object.values(load().users);
}

export function getAllOrders(): Order[] {
  return Object.values(load().orders).sort((a, b) => b.createdAt - a.createdAt);
}

export function isTrialActive(user: User): boolean {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (user.paidUntil && user.paidUntil > Date.now()) return true;
  return Date.now() - user.trialStart < oneWeek;
}

export function trialDaysLeft(user: User): number {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (user.paidUntil && user.paidUntil > Date.now()) {
    return Math.ceil((user.paidUntil - Date.now()) / (24 * 60 * 60 * 1000));
  }
  const elapsed = Date.now() - user.trialStart;
  const left = oneWeek - elapsed;
  return Math.max(0, Math.ceil(left / (24 * 60 * 60 * 1000)));
}
