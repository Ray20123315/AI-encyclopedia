import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const PRICE='https://fireworks.ai/pricing';
const CATALOG='https://fireworks.ai/models';
export const fireworksProvider={
 id:'fireworks',name:'Fireworks AI',type:'推論平台',homepage:'https://fireworks.ai/',description_zh:'Serverless / Fast / Priority / On-Demand 推論平台；平台價格與原廠 API 價格分開看。',
 sources:[{id:'pricing',title:'Fireworks 官方定價',kind:'官方定價',required:true,url:PRICE},{id:'catalog',title:'Fireworks 模型庫',kind:'官方模型目錄',required:false,url:CATALOG}],
 seed_models:[
  fw('accounts/fireworks/models/minimax-m3','MiniMax M3（Fireworks）',.3,.06,1.2,512000),
  fw('accounts/fireworks/models/glm-5p2','GLM 5.2（Fireworks）',1.4,.14,4.4,1040000),
  fw('accounts/fireworks/models/kimi-k2p7-code','Kimi K2.7 Code（Fireworks）',.95,.19,4,256000),
  fw('accounts/fireworks/models/inkling','Inkling（Fireworks）',1,.17,4.05,1040000)
 ],
 async parse(fetched){const text=htmlToText(`${fetched.pricing||''}\n${fetched.catalog||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b(accounts\/fireworks\/(?:models|routers)\/[a-z0-9._-]+)\b/gi)].map(m=>m[1].toLowerCase()))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,240)){if(!map.has(id))map.set(id,{model_id:id,name:`${prettyId(id.split('/').pop())}（Fireworks）`,name_zh:`${prettyId(id.split('/').pop())}（Fireworks）`,family:'Fireworks 部署',status:'active',capabilities:['text'],pricing:[],deployments:[{platform:'Fireworks AI',model_id:id}],source_url:CATALOG});}return[...map.values()].map(m=>({...m,sources:[modelSource('Fireworks 官方定價',PRICE,'Fireworks AI'),modelSource('Fireworks 模型庫',CATALOG,'Fireworks AI')]}));}
};
function fw(id,name,input,cached,output,ctx){return{model_id:id,name,name_zh:name,family:'Fireworks 部署',status:'active',context_window:ctx,capabilities:['text','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',region:'fireworks-serverless',input,cached_input:cached,output}],deployments:[{platform:'Fireworks AI',model_id:id}],source_url:PRICE}}
