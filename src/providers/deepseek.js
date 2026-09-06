import { htmlToText, windowNear } from '../core.js';
import { modelSource } from './helpers.js';
const PRICE='https://api-docs.deepseek.com/quick_start/pricing/';
const V4='https://api-docs.deepseek.com/news/news250825';
export const deepseekProvider={
  id:'deepseek',name:'DeepSeek',type:'模型供應商',homepage:'https://www.deepseek.com/',description_zh:'DeepSeek API 模型；價格保留尖峰／離峰與快取命中差異。',
  sources:[{id:'pricing',title:'DeepSeek API 定價',kind:'官方定價',required:true,url:PRICE},{id:'v4',title:'DeepSeek V4 模型公告',kind:'官方公告',required:false,url:V4}],
  seed_models:[ds('deepseek-v4-flash','DeepSeek V4 Flash',0.014,0.44,1.32,0.007,0.22,0.66),ds('deepseek-v4-pro','DeepSeek V4 Pro',0.044,1.32,3.96,0.022,0.66,1.98),{model_id:'deepseek-v4-flash-vision-exp',name:'DeepSeek V4 Flash Vision Exp',name_zh:'DeepSeek V4 Flash Vision 實驗版',family:'V4',status:'experimental',context_window:1000000,capabilities:['text','vision','reasoning','tools'],pricing:[],source_url:PRICE}],
  async parse(fetched){
   const text=htmlToText(fetched.pricing||''); if(!text)return[];
   const ids=[...new Set([...text.matchAll(/deepseek-v[0-9][a-z0-9.-]*/gi)].map(m=>m[0].toLowerCase()))]; const out=[];
   for(const id of ids){const w=windowNear(text,id,20,1500);const d=[...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));const seed=this.seed_models.find(m=>m.model_id===id);let pricing=[];if(d.length>=6)pricing=[{currency:'USD',unit:'1M_tokens',schedule:'off_peak',cached_input:d[0],input:d[1],output:d[2],mode:'standard'},{currency:'USD',unit:'1M_tokens',schedule:'peak',cached_input:d[3],input:d[4],output:d[5],mode:'standard'}];out.push({...(seed||{model_id:id,name:title(id),name_zh:title(id),family:'V4',status:id.includes('exp')?'experimental':'active',context_window:1000000,capabilities:['text','reasoning','tools']}),pricing:pricing.length?pricing:(seed?.pricing||[]),sources:[modelSource('官方 API 定價',PRICE,'DeepSeek'),modelSource('V4 模型公告',V4,'DeepSeek')]});}return out;
  }
};
function title(id){return id.split('-').map(x=>x[0]?.toUpperCase()+x.slice(1)).join(' ')}
function ds(id,name,ph,pi,po,oh,oi,oo){return{model_id:id,name,name_zh:name,family:'V4',status:'active',context_window:1000000,capabilities:['text','reasoning','tools','coding'],reasoning_efforts:['high','max'],pricing:[{currency:'USD',unit:'1M_tokens',schedule:'peak',cached_input:ph,input:pi,output:po},{currency:'USD',unit:'1M_tokens',schedule:'off_peak',cached_input:oh,input:oi,output:oo}],source_url:PRICE,sources:[modelSource('官方 API 定價',PRICE,'DeepSeek')]}}
