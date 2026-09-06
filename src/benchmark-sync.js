import { benchmarkFeedsForProvider, parseBenchmarkFeed } from './benchmarks-auto.js';

function scoreCount(map){return [...map.values()].reduce((n,a)=>n+a.length,0)}
function mergeMaps(target,source){for(const[modelId,scores]of source){const old=target.get(modelId)||[],seen=new Set(old.map(x=>x.benchmark_id));for(const s of scores)if(!seen.has(s.benchmark_id)){old.push(s);seen.add(s.benchmark_id)}if(old.length)target.set(modelId,old)}return target}
function stripHtml(s=''){return String(s).replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim()}

export function htmlTablesToPipeText(raw=''){
  const rows=[];
  for(const match of String(raw).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=[];
    for(const cell of match[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi))cells.push(stripHtml(cell[1]));
    if(cells.length>=2)rows.push(cells.join(' | '));
  }
  return rows.join('\n');
}

function makeScore(feed,benchmarkId,benchmarkName,category,score,unit='%',setting=''){
  return{benchmark_id:benchmarkId,benchmark_name:benchmarkName,category,score,unit,setting,source_url:feed.url,source_publisher:feed.publisher,source_type:'官方自動同步',source_title:feed.title,observed_at:new Date().toISOString(),auto:true,tested_at:null};
}

function parseQwenRowFeed(raw,feed){
  const out=new Map();
  const aliases=feed.models?.[0]?.aliases||[];
  const modelId=feed.models?.[0]?.model_id;
  if(!modelId)return out;
  const rows=String(raw).split(/\r?\n/);
  for(const line of rows){
    if(!line.includes('|'))continue;
    if(!aliases.some(a=>line.toLowerCase().includes(a.toLowerCase())))continue;
    if(!/ARC[- ]AGI\s*1/i.test(line))continue;
    const cells=line.split('|').map(x=>x.trim()).filter(Boolean);
    const scoreCell=[...cells].reverse().find(x=>/^\d+(?:\.\d+)?%?$/.test(x));
    if(!scoreCell)continue;
    const score=Number(scoreCell.replace('%',''));
    if(Number.isFinite(score))out.set(modelId,[makeScore(feed,'arc-agi-1','ARC-AGI 1','抽象推理',score,'%','官方可重現評測')]);
  }
  return out;
}

function parseCohereInline(raw,feed){
  const text=stripHtml(raw),modelId=feed.models?.[0]?.model_id,out=new Map(),scores=[];
  if(!modelId)return out;
  const defs=[
    ['tau2-telecom','τ²-Bench Telecom','代理／工具',/(?:τ²|tau.?2)[- ]?Bench\s+Telecom[^.]{0,90}?improved\s+from\s+\d+(?:\.\d+)?%?\s+to\s+(\d+(?:\.\d+)?)/i],
    ['terminal-bench-hard','Terminal-Bench Hard','代理／程式',/Terminal[- ]Bench\s+Hard[^.]{0,90}?(?:reaching|reached|scored?)\s+(\d+(?:\.\d+)?)/i],
    ['mmmu-pro','MMMU-Pro','多模態',/achieved\s+(\d+(?:\.\d+)?)%\s+on\s+MMMU[- ]?Pro/i],
    ['mmmu','MMMU','多模態',/and\s+(\d+(?:\.\d+)?)%\s+on\s+MMMU\b/i],
    ['mathvista','MathVista','多模態',/MathVista[^.]{0,90}?increased\s+from\s+\d+(?:\.\d+)?%?\s+to\s+(\d+(?:\.\d+)?)/i],
    ['charxiv-reasoning','CharXiv Reasoning','多模態',/CharXiv\s+reasoning[^.]{0,90}?improved\s+from\s+\d+(?:\.\d+)?%?\s+to\s+(\d+(?:\.\d+)?)/i],
    ['aa-intelligence','Artificial Analysis Intelligence Index','綜合',/achieved\s+(?:a\s+)?score\s+of\s+(\d+(?:\.\d+)?)\s+on\s+the\s+Artificial\s+Analysis\s+Intelligence\s+Index/i]
  ];
  for(const[id,name,category,re]of defs){const m=text.match(re);if(m){const n=Number(m[1]);if(Number.isFinite(n))scores.push(makeScore(feed,id,name,category,n,id==='aa-intelligence'?'指數':'%','官方發布頁'))}}
  if(scores.length)out.set(modelId,scores);
  return out;
}

export function parseBenchmarkFeedResilient(raw,feed){
  const merged=new Map();
  mergeMaps(merged,parseBenchmarkFeed(raw,feed));
  if(/<tr\b/i.test(String(raw))){
    const normalized=htmlTablesToPipeText(raw);
    if(normalized)mergeMaps(merged,parseBenchmarkFeed(normalized,{...feed,mode:'table'}));
  }
  if(feed.id==='qwen3-eval')mergeMaps(merged,parseQwenRowFeed(raw,feed));
  if(feed.id==='cohere-command-a-plus')mergeMaps(merged,parseCohereInline(raw,feed));
  return merged;
}

export async function syncBenchmarksForProvider(providerId,fetcher){
  const feeds=benchmarkFeedsForProvider(providerId),byModel=new Map(),source_status={},freshModelIds=new Set();
  for(const feed of feeds){
    const key=`benchmark:${feed.id}`;
    try{
      const configured=feed.urls||feed.url;
      const result=await fetcher(configured);
      const parsed=parseBenchmarkFeedResilient(result.text,feed),count=scoreCount(parsed);
      if(count===0)throw new Error('benchmark parser returned 0 scores');
      mergeMaps(byModel,parsed);
      for(const[modelId,scores]of parsed)if(scores.length)freshModelIds.add(modelId);
      source_status[key]={ok:true,title:feed.title,kind:'官方評測',configured_url:configured,resolved_url:result.url||feed.url,score_count:count};
    }catch(err){
      source_status[key]={ok:false,title:feed.title,kind:'官方評測',configured_url:feed.urls||feed.url,error:String(err?.message||err)};
    }
  }
  return{byModel,source_status,freshModelIds:[...freshModelIds],feed_count:feeds.length};
}
