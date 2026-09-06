import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const MODELS='https://docs.together.ai/docs/serverless-models';
const PRICE='https://www.together.ai/pricing';
export const togetherProvider={
 id:'together',name:'Together AI',type:'推論平台',homepage:'https://www.together.ai/',description_zh:'開源／開放權重模型推論平台；自官方 serverless catalog 發現模型。',
 sources:[{id:'models',title:'Together Serverless 模型目錄',kind:'官方模型目錄',required:true,url:MODELS},{id:'pricing',title:'Together 官方定價',kind:'官方定價',required:false,url:PRICE}],
 seed_models:[
  td('moonshotai/Kimi-K2.5','Kimi K2.5（Together）'),td('Qwen/Qwen3-235B-A22B','Qwen3 235B A22B（Together）'),td('meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8','Llama 4 Maverick（Together）')
 ],
 async parse(fetched){const text=htmlToText(`${fetched.models||''}\n${fetched.pricing||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b([A-Za-z0-9._-]+\/[A-Za-z0-9._:+-]+)\b/g)].map(m=>m[1]))];const map=new Map(this.seed_models.map(m=>[m.model_id.toLowerCase(),m]));for(const id of ids.slice(0,260)){const key=id.toLowerCase();if(!map.has(key))map.set(key,td(id,`${prettyId(id)}（Together）`));}return[...map.values()].map(m=>({...m,sources:[modelSource('Together 官方 Serverless 模型目錄',MODELS,'Together AI'),modelSource('Together 官方定價',PRICE,'Together AI')]}));}
};
function td(id,name){return{model_id:id,name,name_zh:name,family:id.split('/')[0],status:'active',capabilities:['text'],pricing:[],deployments:[{platform:'Together AI',model_id:id}],source_url:MODELS}}
