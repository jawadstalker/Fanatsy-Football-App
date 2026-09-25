import crypto from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { User } from "./store";

type StoredSession = { userId: string; expiresAt: number };
type Db = {
  users?: Record<string, User>;
  sessions?: Record<string, StoredSession>;
  [key: string]: unknown;
};

const router = Router();
const DATA_FILE = path.resolve(process.env.DATA_FILE ?? "./data.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_AUTH_ATTEMPTS = 8;
const RATE_WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function readDb(): Db {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Db; }
  catch { return {}; }
}

function writeDb(db: Db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(temp, DATA_FILE);
}

function readUsers(): Record<string, User> {
  return readDb().users ?? {};
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password: string, stored: string): { valid: boolean; needsUpgrade: boolean } {
  if (stored.startsWith("scrypt$")) {
    const [, salt, expected] = stored.split("$");
    if (!salt || !expected) return { valid: false, needsUpgrade: false };
    const actual = crypto.scryptSync(password, salt, 64).toString("hex");
    const valid = actual.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
    return { valid, needsUpgrade: false };
  }

  const legacy = crypto.createHash("sha256").update(password).digest("hex");
  return {
    valid: legacy.length === stored.length &&
      crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(stored)),
    needsUpgrade: true,
  };
}

function publicUser(u: User, token: string) {
  return { id: u.id, username: u.username, token };
}

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function allowAuthAttempt(req: Request): boolean {
  const now = Date.now();
  const key = clientKey(req);
  const current = attempts.get(key);
  if (!current || now >= current.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_AUTH_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

function createSession(userId: string): string {
  const db = readDb();
  db.sessions = db.sessions ?? {};
  const token = nanoid(48);
  db.sessions[token] = { userId, expiresAt: Date.now() + SESSION_TTL_MS };
  writeDb(db);
  return token;
}

function getUserFromToken(token: string): User | null {
  if (!token) return null;
  const db = readDb();
  const session = db.sessions?.[token];
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    delete db.sessions![token];
    writeDb(db);
    return null;
  }
  return db.users?.[session.userId] ?? null;
}

function bearerToken(req: Request): string {
  const header = req.header("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

router.post("/register", (req, res) => {
  if (!allowAuthAttempt(req)) return res.status(429).json({ error: "Too many authentication attempts. Try again later." });

  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 3-20 characters using letters, numbers, or underscore" });
  }
  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: "Password must be 6-128 characters" });
  }

  const db = readDb();
  db.users = db.users ?? {};
  if (Object.values(db.users).some((u) => u.username === username)) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const user: User = {
    id: nanoid(12),
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.users[user.id] = user;
  db.sessions = db.sessions ?? {};
  const token = nanoid(48);
  db.sessions[token] = { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS };
  writeDb(db);

  res.status(201).json(publicUser(user, token));
});

router.post("/login", (req, res) => {
  if (!allowAuthAttempt(req)) return res.status(429).json({ error: "Too many authentication attempts. Try again later." });

  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const db = readDb();
  const user = Object.values(db.users ?? {}).find((u) => u.username === username);

  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  const check = verifyPassword(password, user.passwordHash);
  if (!check.valid) return res.status(401).json({ error: "Invalid username or password" });

  if (check.needsUpgrade) {
    user.passwordHash = hashPassword(password);
    db.users![user.id] = user;
  }

  db.sessions = db.sessions ?? {};
  const token = nanoid(48);
  db.sessions[token] = { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS };
  writeDb(db);

  res.json(publicUser(user, token));
});

router.get("/me", (req, res) => {
  const token = bearerToken(req);
  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json(publicUser(user, token));
});

export function requireAuth(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  const user = getUserFromToken(bearerToken(req));
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  req.userId = user.id;
  next();
}

export default router;
