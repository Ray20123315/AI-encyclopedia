import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const K3='https://github.com/MoonshotAI/Kimi-K3';
const API='https://platform.moonshot.ai/';
export const moonshotProvider={
 id:'moonshot',name:'Moonshot AI / Kimi',type:'模型供應商',homepage:'https://www.moonshot.ai/',description_zh:'Kimi 系列模型；官方模型倉庫用於能力與評測，API 平台用於可用性。',
 sources:[{id:'k3',title:'Kimi K3 官方倉庫',kind:'官方模型卡',required:true,url:K3},{id:'api',title:'Moonshot API 平台',kind:'官方平台',required:false,url:API}],
 seed_models:[
  {model_id:'kimi-k3',name:'Kimi K3',name_zh:'Kimi K3',family:'Kimi K3',status:'active',context_window:1048576,capabilities:['text','vision','reasoning','tools','coding'],reasoning_efforts:['max'],pricing:[],source_url:K3,sources:[modelSource('Kimi K3 官方模型卡與評測',K3,'Moonshot AI'),modelSource('Moonshot API 平台',API,'Moonshot AI')]},
  {model_id:'kimi-k2.7-code',name:'Kimi K2.7 Code',name_zh:'Kimi K2.7 Code',family:'Kimi K2',status:'active',context_window:256000,capabilities:['text','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',input:.95,cached_input:.19,output:4,note:'公開部署商標示與 Moonshot 公開費率一致；原廠 API 頁若可解析將優先覆蓋。'}],source_url:API,sources:[modelSource('Moonshot API 平台',API,'Moonshot AI')]}
 ],
 async parse(fetched){const text=htmlToText(`${fetched.k3||''}\n${fetched.api||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b(Kimi[-_ ]?K?\d(?:[.\w-]+)?)/gi)].map(m=>m[1].toLowerCase().replace(/[ _]/g,'-')))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,100)){if(!map.has(id))map.set(id,{model_id:id,name:prettyId(id),name_zh:prettyId(id),family:'Kimi',status:'active',capabilities:['text'],pricing:[],source_url:K3});}return[...map.values()];}
};
