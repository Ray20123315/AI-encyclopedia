import { htmlToText, windowNear } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const PRICE='https://ai.google.dev/gemini-api/docs/pricing?hl=zh-TW';
const LATEST='https://ai.google.dev/gemini-api/docs/latest-model';
const CARD31='https://deepmind.google/models/model-cards/gemini-3-1-pro/';
const CARD35='https://deepmind.google/models/model-cards/gemini-3-5-flash/';
export const googleProvider={
 id:'google',name:'Google Gemini',type:'模型供應商',homepage:'https://ai.google.dev/',description_zh:'Gemini Developer API 模型；保留標準／批次／Flex／Priority、長脈絡與多媒體價格。',
 sources:[{id:'pricing',title:'Gemini API 定價',kind:'官方定價',required:true,url:PRICE},{id:'latest',title:'Gemini 最新模型',kind:'官方文件',required:false,url:LATEST}],
 seed_models:[
  g('gemini-3.7-flash','Gemini 3.7 Flash',.75,3.75,.075,1000000,{note:'2026-12-31 前促銷價；之後官方公告為 $1.50 / $7.50。'}),
  g('gemini-3.6-flash','Gemini 3.6 Flash',.75,3.75,.075,1000000,{note:'2026-12-31 前促銷價；之後官方公告為 $1.50 / $7.50。'}),
  g('gemini-3.5-flash','Gemini 3.5 Flash',1.5,9,.15,1000000),
  g('gemini-3.5-flash-lite','Gemini 3.5 Flash-Lite',.3,2.5,.03,1000000),
  {...g('gemini-3.1-pro-preview','Gemini 3.1 Pro Preview',2,12,.2,1000000),pricing:[
    {currency:'USD',unit:'1M_tokens',mode:'standard',context_max:200000,input:2,cached_input:.2,output:12},
    {currency:'USD',unit:'1M_tokens',mode:'standard',context_min:200001,input:4,cached_input:.4,output:18,note:'提示詞超過 200K'},
    {currency:'USD',unit:'1M_tokens',mode:'batch',context_max:200000,input:1,cached_input:.2,output:6},
    {currency:'USD',unit:'1M_tokens',mode:'batch',context_min:200001,input:2,cached_input:.4,output:9}
  ],sources:[modelSource('Gemini API 定價',PRICE,'Google'),modelSource('Gemini 3.1 Pro 模型卡',CARD31,'Google DeepMind')]},
  g('gemini-3.1-flash-lite','Gemini 3.1 Flash-Lite',.25,1.5,.025,1000000),
  {model_id:'gemini-3.1-flash-image',name:'Gemini 3.1 Flash Image',name_zh:'Gemini 3.1 Flash 圖像',family:'Gemini 3.1',status:'active',capabilities:['text','vision','image_generation','reasoning'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',input:.5,output:3,media:'text'},{currency:'USD',unit:'1M_tokens',mode:'standard',output:60,media:'image',note:'圖像輸出另按 token 對應解析度換算。'}],source_url:PRICE},
  {model_id:'gemini-omni-1.1-flash',name:'Gemini Omni 1.1 Flash',name_zh:'Gemini Omni 1.1 Flash',family:'Gemini Omni',status:'active',capabilities:['text','vision','audio','video','reasoning'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',input:1.5,output:9,media:'text'},{currency:'USD',unit:'1M_tokens',mode:'standard',output:17.5,media:'video'}],source_url:PRICE}
 ],
 async parse(fetched){
   const text=htmlToText(`${fetched.pricing||''}\n${fetched.latest||''}`);if(!text)return[];
   const ids=[...new Set([...text.matchAll(/`?(gemini-[a-z0-9.-]+)`?/gi)].map(m=>m[1].toLowerCase()))];
   const map=new Map(this.seed_models.map(m=>[m.model_id,m]));
   for(const id of ids.slice(0,180)){
     if(map.has(id))continue;
     const w=windowNear(text,id,60,1800);const d=[...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));
     map.set(id,{model_id:id,name:prettyId(id),name_zh:prettyId(id),family:'Gemini',status:id.includes('preview')?'preview':'active',capabilities:['text','reasoning'],pricing:d.length>=2?[{currency:'USD',unit:'1M_tokens',mode:'standard',input:d[0],output:d[1],note:'自官方定價頁鄰近區段解析；多媒體／長脈絡 tier 請查看來源。'}]:[],source_url:PRICE});
   }
   return [...map.values()].map(m=>({...m,sources:m.sources?.length?m.sources:[modelSource('Gemini API 官方定價',PRICE,'Google')]}));
 }
};
function g(id,name,input,output,cached,ctx,opt={}){return{model_id:id,name,name_zh:name,family:id.split('-').slice(0,2).join(' ').replace('gemini','Gemini'),status:'active',context_window:ctx,capabilities:['text','vision','audio','video','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',input,cached_input:cached,output,note:opt.note||''}],source_url:PRICE,sources:[modelSource('Gemini API 官方定價',PRICE,'Google')]}}
