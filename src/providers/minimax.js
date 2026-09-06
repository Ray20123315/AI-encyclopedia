import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const PRICE='https://platform.minimax.io/subscribe/token-plan?tab=api-enterprise';
const M27='https://github.com/MiniMax-AI/MiniMax-M2.7';
export const minimaxProvider={
 id:'minimax',name:'MiniMax',type:'模型供應商',homepage:'https://www.minimax.io/',description_zh:'MiniMax M 系列與多媒體模型；同一模型可能依 context 與 highspeed 分層。',
 sources:[{id:'pricing',title:'MiniMax Token Plan',kind:'官方定價',required:true,url:PRICE},{id:'m27',title:'MiniMax M2.7 官方模型卡',kind:'官方模型卡',required:false,url:M27}],
 seed_models:[
  {model_id:'minimax-m3',name:'MiniMax M3',name_zh:'MiniMax M3',family:'M3',status:'active',context_window:1000000,capabilities:['text','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',context_max:512000,input:.3,cached_input:.06,output:1.2,note:'官方永久 50% off 現價'},{currency:'USD',unit:'1M_tokens',mode:'standard',context_min:512001,context_max:1000000,input:.6,cached_input:.12,output:2.4,note:'512K–1M；官方永久 50% off 現價'}],source_url:PRICE},
  mm('minimax-m2.7','MiniMax M2.7',.3,.06,.375,1.2),
  mm('minimax-m2.7-highspeed','MiniMax M2.7 Highspeed',.6,.06,.375,2.4)
 ],
 async parse(fetched){const text=htmlToText(`${fetched.pricing||''}\n${fetched.m27||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b(MiniMax[-_ ]?M[0-9][a-z0-9._-]*)\b/gi)].map(m=>m[1].toLowerCase().replace(/[ _]/g,'-')))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,80)){if(!map.has(id))map.set(id,{model_id:id,name:prettyId(id),name_zh:prettyId(id),family:'MiniMax',status:'active',capabilities:['text'],pricing:[],source_url:PRICE});}return[...map.values()].map(m=>({...m,sources:[modelSource('MiniMax 官方 Token Plan',PRICE,'MiniMax'),...(m.model_id==='minimax-m2.7'?[modelSource('M2.7 官方模型卡與評測',M27,'MiniMax')]:[])]}));}
};
function mm(id,name,input,cached,write,output){return{model_id:id,name,name_zh:name,family:'M2.7',status:'active',capabilities:['text','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',input,cached_input:cached,cache_write:write,output}],source_url:PRICE}}
