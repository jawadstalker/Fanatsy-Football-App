import React,{useState}from"react";
import{View,Text,TextInput,Pressable,ActivityIndicator}from"react-native";
import{colors}from"@/theme/tokens";
export function AuthForm({mode,loading,error,onSubmit}:{mode:"login"|"register";loading:boolean;error:string|null;onSubmit:(username:string,password:string)=>void}){
 const[u,setU]=useState("");const[p,setP]=useState("");
 const ok=u.trim().length>=3&&p.length>=6&&!loading;
 return <View className="px-4">
  <Text className="text-xs font-body text-muted mb-1">Username</Text>
  <TextInput value={u} onChangeText={setU} autoCapitalize="none" placeholder="Your username" placeholderTextColor={colors.muted} className="rounded-lg px-3 py-2.5 mb-3 border font-body" style={{backgroundColor:colors.surface,borderColor:colors.line,color:colors.ink}}/>
  <Text className="text-xs font-body text-muted mb-1">Password</Text>
  <TextInput value={p} onChangeText={setP} secureTextEntry autoCapitalize="none" placeholder="At least 6 characters" placeholderTextColor={colors.muted} className="rounded-lg px-3 py-2.5 mb-3 border font-body" style={{backgroundColor:colors.surface,borderColor:colors.line,color:colors.ink}}/>
  {error&&<Text className="text-[11px] font-body text-danger mb-2">{error}</Text>}
  <Pressable onPress={()=>onSubmit(u.trim(),p)} disabled={!ok} className="rounded-lg py-2.5 items-center" style={{backgroundColor:ok?colors.turf:colors.line}}>
   {loading?<ActivityIndicator color={colors.base}/>:<Text className="text-sm font-body-medium" style={{color:colors.base}}>{mode==="login"?"Sign in":"Create account"}</Text>}
  </Pressable>
 </View>
}