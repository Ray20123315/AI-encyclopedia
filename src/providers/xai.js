import { htmlToText, windowNear } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const PRICE='https://docs.x.ai/developers/pricing';
const MODELS='https://docs.x.ai/developers/models';
const NEWS46='https://x.ai/news/grok-4-6';
export const xaiProvider={
 id:'xai',name:'xAI / Grok',type:'模型供應商',homepage:'https://x.ai/',description_zh:'Grok 系列 API。長脈絡超過 200K 可能採不同價格。',
 sources:[{id:'pricing',title:'Grok API 定價',kind:'官方定價',required:true,url:PRICE},{id:'models',title:'Grok 模型目錄',kind:'官方模型目錄',required:true,url:MODELS}],
 seed_models:[
   gx('grok-4.6','Grok 4.6',2,.5,6,500000,{long:[4,1,12],reasoning:['low','medium','high','xhigh'],sources:[modelSource('Grok API 定價',PRICE,'xAI'),modelSource('Grok 4.6 公告與評測',NEWS46,'xAI')]}),
   gx('grok-4.5','Grok 4.5',2,.3,6,500000,{long:[4,.6,12]}),
   gx('grok-4.3','Grok 4.3',1.25,.2,2.5,1000000,{long:[2.5,.4,5]}),
   gx('grok-4.20-0309-reasoning','Grok 4.20 0309 Reasoning',1.25,.2,2.5,1000000,{long:[2.5,.4,5]}),
   gx('grok-4.20-multi-agent-0309','Grok 4.20 Multi-Agent 0309',1.25,.2,2.5,1000000,{long:[2.5,.4,5],caps:['multi_agent']}),
   gx('grok-4-1-fast-reasoning','Grok 4.1 Fast Reasoning',.2,.05,.5,2000000,{reasoning:['reasoning']})
 ],
 async parse(fetched){const text=htmlToText(`${fetched.pricing||''}\n${fetched.models||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b(grok-[a-z0-9.-]+)\b/gi)].map(m=>m[1].toLowerCase()))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,120)){if(map.has(id))continue;const w=windowNear(text,id,30,1000);const d=[...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));map.set(id,{model_id:id,name:prettyId(id),name_zh:prettyId(id),family:'Grok',status:'active',capabilities:['text','reasoning','tools'],pricing:d.length>=2?[{currency:'USD',unit:'1M_tokens',mode:'standard',input:d[0],output:d[d.length>=3?2:1],cached_input:d.length>=3?d[1]:null}]:[],source_url:PRICE});}return[...map.values()].map(m=>({...m,sources:m.sources?.length?m.sources:[modelSource('Grok 官方模型與定價',PRICE,'xAI')]}));}
};
function gx(id,name,input,cached,output,ctx,opt={}){const pricing=[{currency:'USD',unit:'1M_tokens',mode:'standard',context_max:199999,input,cached_input:cached,output}];if(opt.long)pricing.push({currency:'USD',unit:'1M_tokens',mode:'standard',context_min:200000,input:opt.long[0],cached_input:opt.long[1],output:opt.long[2],note:'長脈絡 ≥ 200K'});return{model_id:id,name,name_zh:name,family:'Grok 4',status:'active',context_window:ctx,capabilities:['text','vision','reasoning','tools','coding',...(opt.caps||[])],reasoning_efforts:opt.reasoning||[],pricing,source_url:PRICE,sources:opt.sources||[modelSource('Grok API 定價',PRICE,'xAI')]}}
