import crypto from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { User } from "./store";

const router = Router();
const DATA_FILE = path.resolve(process.env.DATA_FILE ?? "./data.json");
const sessions = new Map<string, string>();

function readUsers(): Record<string, User> {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return (JSON.parse(fs.readFileSync(DATA_FILE, "utf8")).users ?? {}) as Record<string, User>; }
  catch { return {}; }
}
function saveUsers(users: Record<string, User>) {
  let db: any = {};
  if (fs.existsSync(DATA_FILE)) { try { db = JSON.parse(fs.readFileSync(DATA_FILE,"utf8")); } catch {} }
  db.users = users;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}
function hash(password:string) { return crypto.createHash("sha256").update(password).digest("hex"); }
function publicUser(u:User, token:string) { return { id:u.id, username:u.username, token }; }

router.post("/register",(req,res)=>{
  const username=String(req.body?.username??"").trim().toLowerCase();
  const password=String(req.body?.password??"");
  if(!/^[a-z0-9_]{3,20}$/.test(username)) return res.status(400).json({error:"Username must be 3-20 characters using letters, numbers, or underscore"});
  if(password.length<6||password.length>128) return res.status(400).json({error:"Password must be 6-128 characters"});
  const users=readUsers();
  if(Object.values(users).some(u=>u.username===username)) return res.status(409).json({error:"Username already exists"});
  const user:User={id:nanoid(12),username,passwordHash:hash(password),createdAt:new Date().toISOString()};
  users[user.id]=user; saveUsers(users);
  const token=nanoid(32); sessions.set(token,user.id);
  res.status(201).json(publicUser(user,token));
});
router.post("/login",(req,res)=>{
  const username=String(req.body?.username??"").trim().toLowerCase(), password=String(req.body?.password??"");
  const user=Object.values(readUsers()).find(u=>u.username===username);
  if(!user||user.passwordHash!==hash(password)) return res.status(401).json({error:"Invalid username or password"});
  const token=nanoid(32); sessions.set(token,user.id); res.json(publicUser(user,token));
});
router.get("/me",(req,res)=>{
  const h=req.header("authorization")??"", token=h.startsWith("Bearer ")?h.slice(7):"";
  const id=sessions.get(token), user=id?readUsers()[id]:null;
  if(!user) return res.status(401).json({error:"Unauthorized"});
  res.json(publicUser(user,token));
});
export function requireAuth(req:Request & {userId?:string},res:Response,next:NextFunction){
 const h=req.header("authorization")??"", token=h.startsWith("Bearer ")?h.slice(7):"";
 const id=sessions.get(token); if(!id) return res.status(401).json({error:"Unauthorized"});
 req.userId=id; next();
}
export default router;