import { htmlToText, windowNear } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const PRICE='https://www.alibabacloud.com/help/en/model-studio/model-pricing';
export const qwenProvider={
 id:'qwen',name:'Qwen / 阿里雲百鍊',type:'模型供應商',homepage:'https://www.alibabacloud.com/product/model-studio',description_zh:'通義千問／Qwen 模型。官方同一模型常依區域、上下文長度、思考模式分層計價。',
 sources:[{id:'pricing',title:'Model Studio 模型與定價',kind:'官方定價',required:true,url:PRICE}],
 seed_models:[q('qwen3.8-27b','Qwen3.8 27B',.8,4,131072),q('qwen3.7-plus','Qwen3.7 Plus',.4,1.6,256000),q('qwen3.6-plus','Qwen3.6 Plus',.5,3,256000),q('qwen3.5-plus','Qwen3.5 Plus',.4,2.4,128000),q('qwen3-235b-a22b-instruct-2507','Qwen3 235B A22B Instruct 2507',.7,8.4,null),q('qwen3-32b','Qwen3 32B',.16,.64,null)],
 async parse(fetched){const text=htmlToText(fetched.pricing||'');if(!text)return[];const ids=[...new Set([...text.matchAll(/\bqwen(?:[0-9][a-z0-9.-]*|-[a-z0-9.-]+)\b/gi)].map(m=>m[0].toLowerCase()))];const out=[];for(const id of ids.slice(0,250)){const w=windowNear(text,id,10,1200);const d=[...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));const seed=this.seed_models.find(m=>m.model_id===id);let pricing=[];if(d.length>=2){const u=[...new Set(d)];pricing=[{currency:'USD',unit:'1M_tokens',region:'international',mode:'standard',input:u[0],output:u[1]??null,note:'主表只取鄰近文字的第一個可比較 tier；完整區域／脈絡／思考價格請開啟來源頁。'}];}out.push({...(seed||{model_id:id,name:prettyId(id),name_zh:prettyId(id),family:family(id),status:'active',capabilities:['text']}),pricing:pricing.length?pricing:(seed?.pricing||[]),sources:[modelSource('官方 Model Studio 定價',PRICE,'Alibaba Cloud')],source_note:'Qwen 價格有多維度 tier；主表不代表所有條件。'});}return out;}
};
function q(id,name,input,output,contextMax){return{model_id:id,name,name_zh:name,family:family(id),status:'active',capabilities:['text','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',region:'international',mode:'standard',context_max:contextMax,input,output}],source_url:PRICE,sources:[modelSource('官方 Model Studio 定價',PRICE,'Alibaba Cloud')]}}
function family(id){const m=id.match(/qwen([0-9]+(?:\.[0-9]+)?)/);return m?`Qwen ${m[1]}`:'Qwen'}
