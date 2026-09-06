import { htmlToText, windowNear } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const MODELS='https://console.groq.com/docs/models';
export const groqProvider={
 id:'groq',name:'GroqCloud',type:'推論平台',homepage:'https://groq.com/',description_zh:'高速推論平台。模型原作者另列於模型 ID；此處價格代表 GroqCloud 部署。',
 sources:[{id:'models',title:'GroqCloud 支援模型與定價',kind:'官方模型目錄／定價',required:true,url:MODELS}],
 seed_models:[
  gr('openai/gpt-oss-120b','GPT OSS 120B（Groq）',.15,.075,.6,131072,65536),
  gr('openai/gpt-oss-20b','GPT OSS 20B（Groq）',.075,null,.3,131072,65536),
  gr('qwen/qwen3.6-27b','Qwen3.6 27B（Groq）',.6,null,3,131072,16384),
  gr('qwen/qwen3.8-27b','Qwen3.8 27B（Groq）',.8,null,4,131042,16384)
 ],
 async parse(fetched){const text=htmlToText(fetched.models||'');if(!text)return[];const ids=[...new Set([...text.matchAll(/\b([a-z0-9._-]+\/[a-z0-9._-]+)\b/gi)].map(m=>m[1].toLowerCase()))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,200)){const w=windowNear(text,id,40,950);const d=[...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));const seed=map.get(id);if(seed&&d.length>=2){seed.pricing=[{currency:'USD',unit:'1M_tokens',mode:'standard',input:d[0],output:d[d.length>=3?2:1],cached_input:d.length>=3?d[1]:seed.pricing[0]?.cached_input??null,region:'groqcloud'}];}else if(!seed){map.set(id,{model_id:id,name:`${prettyId(id)}（Groq）`,name_zh:`${prettyId(id)}（Groq）`,family:id.split('/')[0],status:'active',capabilities:['text'],pricing:d.length>=2?[{currency:'USD',unit:'1M_tokens',mode:'standard',input:d[0],output:d[d.length>=3?2:1],region:'groqcloud'}]:[],deployments:[{platform:'GroqCloud',model_id:id}],source_url:MODELS});}}return[...map.values()].map(m=>({...m,sources:[modelSource('GroqCloud 官方支援模型與定價',MODELS,'Groq')]}));}
};
function gr(id,name,input,cached,output,ctx,max){return{model_id:id,name,name_zh:name,family:id.split('/')[0],status:'active',context_window:ctx,max_output_tokens:max,capabilities:['text','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',region:'groqcloud',input,cached_input:cached,output}],deployments:[{platform:'GroqCloud',model_id:id}],source_url:MODELS}}
