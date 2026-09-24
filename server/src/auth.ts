import crypto from "crypto";
import { Router } from "express";
import { nanoid } from "nanoid";
import { User } from "./store";
import fs from "fs";
import path from "path";

const router=Router();
const DATA_FILE=path.resolve(process.env.DATA_FILE??"./data.json");
const sessions=new Map<string,string>();

function db(){if(!fs.existsSync(DATA_FILE))return {users:{}} as {users:Record<string,User>};try{return JSON.parse(fs.readFileSync(DATA_FILE,"utf8")) as {users:Record<string,User>}}catch{return {users:{}}}}
function save(d:{users:Record<string,User>}){fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});fs.writeFileSync(DATA_FILE,JSON.stringify(d,null,2),"utf8")}
function hash(password:string){return crypto.createHash("sha256").update(password).digest("hex")}
function publicUser(u:User,token:string){return{id:u.id,username:u.username,token}}

router.post("/register",(req,res)=>{
 const username=String(req.body?.username??"").trim().toLowerCase(),password=String(req.body?.password??"");
 if(!/^[a-z0-9_]{3,20}$/.test(username))return res.status(400).json({error:"Username must be 3-20 characters using letters, numbers, or underscore"});
 if(password.length<6||password.length>128)return res.status(400).json({error:"Password must be 6-128 characters"});
 const d=db(); if(Object.values(d.users).some(u=>u.username===username))return res.status(409).json({error:"Username already exists"});
 const u={id:nanoid(12),username,passwordHash:hash(password),createdAt:new Date().toISOString()};d.users[u.id]=u;save(d);
 const token=nanoid(32);sessions.set(token,u.id);res.status(201).json(publicUser(u,token));
});
router.post("/login",(req,res)=>{
 const username=String(req.body?.username??"").trim().toLowerCase(),password=String(req.body?.password??"");
 const u=Object.values(db().users).find(x=>x.username===username);
 if(!u||u.passwordHash!==hash(password))return res.status(401).json({error:"Invalid username or password"});
 const token=nanoid(32);sessions.set(token,u.id);res.json(publicUser(u,token));
});
router.get("/me",(req,res)=>{
 const h=req.header("authorization")??"";const token=h.startsWith("Bearer ")?h.slice(7):"";
 const id=sessions.get(token);const u=id?db().users[id]:null;
 if(!u)return res.status(401).json({error:"Unauthorized"});
 res.json(publicUser(u,token));
});
export function requireAuth(req:any,res:any,next:any){const h=req.header("authorization")??"";const token=h.startsWith("Bearer ")?h.slice(7):"";const id=sessions.get(token);if(!id)return res.status(401).json({error:"Unauthorized"});req.userId=id;next()}
export default router;
