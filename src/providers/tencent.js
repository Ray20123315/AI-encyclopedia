import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const HY4='https://github.com/Tencent-Hunyuan/Hy4-preview';
const CLOUD='https://cloud.tencent.com/product/hunyuan/pricing';
export const tencentProvider={
 id:'tencent',name:'騰訊混元 / Hy',type:'模型供應商',homepage:'https://hunyuan.tencent.com/',description_zh:'騰訊混元 Hy 系列；開源模型卡與騰訊雲定價分開追蹤。',
 sources:[{id:'hy4',title:'Hy4 preview 官方倉庫',kind:'官方模型卡',required:true,url:HY4},{id:'pricing',title:'騰訊混元官方定價',kind:'官方定價',required:false,url:CLOUD}],
 seed_models:[
  {model_id:'hy4-preview',name:'Hy4 preview',name_zh:'混元 Hy4 預覽版',family:'Hy4',status:'preview',context_window:1000000,capabilities:['text','reasoning','tools','coding'],reasoning_efforts:['high','no_think'],pricing:[{currency:'CNY',unit:'1M_tokens',mode:'standard',input:6,cached_input:.3,output:18,note:'騰訊雲公開費率；實際地域/帳戶以控制台為準。'}],source_url:HY4,sources:[modelSource('Hy4 preview 官方模型卡與評測',HY4,'Tencent Hunyuan'),modelSource('騰訊雲混元定價',CLOUD,'騰訊雲')]},
  {model_id:'hy3',name:'Hy3',name_zh:'混元 Hy3',family:'Hy3',status:'active',capabilities:['text','reasoning','tools'],pricing:[{currency:'CNY',unit:'1M_tokens',mode:'standard',input:1,cached_input:.25,output:4}],source_url:CLOUD,sources:[modelSource('騰訊雲混元定價',CLOUD,'騰訊雲')]}
 ],
 async parse(fetched){const text=htmlToText(`${fetched.hy4||''}\n${fetched.pricing||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b(Hy[0-9][a-z0-9._-]*)\b/gi)].map(m=>m[1].toLowerCase()))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,80)){if(!map.has(id))map.set(id,{model_id:id,name:prettyId(id),name_zh:`混元 ${prettyId(id)}`,family:'Hy',status:'active',capabilities:['text'],pricing:[],source_url:HY4});}return[...map.values()];}
};
