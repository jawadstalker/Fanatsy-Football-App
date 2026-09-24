import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as auth from "@/api/auth";

interface AuthState {
  token: string | null;
  username: string | null;
  loading: boolean;
  error: string | null;
  login: (username:string,password:string)=>Promise<boolean>;
  register: (username:string,password:string)=>Promise<boolean>;
  logout: ()=>void;
}

export const useAuthStore=create<AuthState>()(persist((set)=>({
  token:null, username:null, loading:false, error:null,
  login:async(username,password)=>{set({loading:true,error:null});try{const u=await auth.login(username.trim(),password);set({token:u.token,username:u.username,loading:false});return true}catch(e){set({error:(e as Error).message,loading:false});return false}},
  register:async(username,password)=>{set({loading:true,error:null});try{const u=await auth.register(username.trim(),password);set({token:u.token,username:u.username,loading:false});return true}catch(e){set({error:(e as Error).message,loading:false});return false}},
  logout:()=>set({token:null,username:null,error:null})
}),{name:"auth-store",storage:createJSONStorage(()=>AsyncStorage),partialize:s=>({token:s.token,username:s.username})}));
