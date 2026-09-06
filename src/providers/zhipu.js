import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const LLMS='https://docs.z.ai/llms.txt';
const GLM53='https://docs.z.ai/guides/llm/glm-5.3';
const PRICE='https://open.bigmodel.cn/pricing';
export const zhipuProvider={
 id:'zhipu',name:'Z.ai / 智譜 GLM',type:'模型供應商',homepage:'https://z.ai/',description_zh:'GLM 系列。官方文件索引可自動發現新模型；未能解析定價時保留模型與來源。',
 sources:[{id:'catalog',title:'Z.ai 文件索引',kind:'官方模型目錄',required:true,url:LLMS},{id:'pricing',title:'BigModel 官方定價',kind:'官方定價',required:false,url:PRICE}],
 seed_models:[
  zm('glm-5.3','GLM-5.3',1000000,128000,['low','high','max'],GLM53),
  zm('glm-5.2','GLM-5.2',1000000,128000,['low','high','max'],'https://docs.z.ai/guides/llm/glm-5.2'),
  zm('glm-5.1','GLM-5.1',200000,null,['low','high','max'],'https://docs.z.ai/guides/llm/glm-5.1'),
  zm('glm-5-turbo','GLM-5-Turbo',200000,128000,[],'https://docs.z.ai/guides/llm/glm-5-turbo'),
  zm('glm-4.7','GLM-4.7',200000,128000,[],'https://docs.z.ai/guides/llm/glm-4.7'),
  zm('glm-4.6','GLM-4.6',200000,128000,[],'https://docs.z.ai/guides/llm/glm-4.6'),
  {...zm('glm-4-32b-0414-128k','GLM-4-32B-0414-128K',128000,16000,[],'https://docs.z.ai/guides/llm/glm-4-32b-0414-128k'),pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',input:.1,output:null,note:'官方模型頁標示 $0.1 / 百萬 tokens，但未在該段拆分輸入／輸出，因此不推測 output。'}]}
 ],
 async parse(fetched){const text=htmlToText(`${fetched.catalog||''}\n${fetched.pricing||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b(glm-[0-9][a-z0-9.-]*(?:-[a-z0-9.-]+)?)\b/gi)].map(m=>m[1].toLowerCase()))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,160)){if(!map.has(id))map.set(id,zm(id,prettyId(id),null,null,[],`https://docs.z.ai/guides/llm/${id}`));}return[...map.values()];}
};
function zm(id,name,ctx,out,reasoning,url){return{model_id:id,name,name_zh:name,family:id.startsWith('glm-5')?'GLM-5':'GLM-4',status:'active',context_window:ctx,max_output_tokens:out,capabilities:['text','reasoning','tools','coding'],reasoning_efforts:reasoning,pricing:[],source_url:url,sources:[modelSource('官方模型文件',url,'Z.ai'),modelSource('BigModel 官方定價',PRICE,'智譜')]}}
