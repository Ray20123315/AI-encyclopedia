import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const A='https://cohere.com/blog/command-a';
const APLUS='https://cohere.com/blog/command-a-plus';
const DOC='https://docs.cohere.com/docs/models';
export const cohereProvider={
 id:'cohere',name:'Cohere',type:'模型供應商',homepage:'https://cohere.com/',description_zh:'Command、Embed、Rerank 等企業模型；基準分數僅保留官方明確公布項目。',
 sources:[{id:'models',title:'Cohere 模型文件',kind:'官方模型目錄',required:false,url:DOC},{id:'command_a',title:'Command A 公告',kind:'官方公告',required:false,url:A},{id:'command_aplus',title:'Command A+ 公告與評測',kind:'官方公告',required:false,url:APLUS}],
 seed_models:[
  {model_id:'command-a-plus-05-2026',name:'Command A+',name_zh:'Command A+',family:'Command A',status:'active',context_window:128000,max_output_tokens:64000,capabilities:['text','vision','reasoning','tools','coding'],pricing:[],source_url:APLUS,sources:[modelSource('Command A+ 官方公告與評測',APLUS,'Cohere')]},
  {model_id:'command-a-03-2025',name:'Command A',name_zh:'Command A',family:'Command A',status:'active',context_window:256000,capabilities:['text','tools','rag'],pricing:[{currency:'USD',unit:'1M_tokens',mode:'standard',input:2.5,output:10}],source_url:A,sources:[modelSource('Command A 官方公告與定價',A,'Cohere')]}
 ],
 async parse(fetched){const text=htmlToText(`${fetched.models||''}\n${fetched.command_a||''}\n${fetched.command_aplus||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/\b(command-[a-z0-9._-]+)\b/gi)].map(m=>m[1].toLowerCase()))];const map=new Map(this.seed_models.map(m=>[m.model_id,m]));for(const id of ids.slice(0,100)){if(!map.has(id))map.set(id,{model_id:id,name:prettyId(id),name_zh:prettyId(id),family:'Command',status:'active',capabilities:['text'],pricing:[],source_url:DOC});}return[...map.values()];}
};
