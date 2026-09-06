import { htmlToText, parseRange, windowNear } from '../core.js';
import { modelSource, prettyId } from './helpers.js';

const CODEX_URL = 'https://learn.chatgpt.com/docs/pricing';
const API_PRICING_URL = 'https://developers.openai.com/api/docs/pricing';
const MODEL_CATALOG_URL = 'https://developers.openai.com/api/docs/models';
const LEGACY_RATE_URL = 'https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing';

export const openaiProvider = {
  id:'openai', name:'OpenAI', type:'模型供應商', homepage:'https://openai.com/',
  description_zh:'GPT、Codex 與多模態模型供應商。API 價格、長短脈絡 tier 與 Codex 訂閱額度分開保存。',
  sources:[
    {id:'codex_pricing',title:'Codex 方案與額度',kind:'官方定價',required:true,urls:['https://learn.chatgpt.com/docs/pricing.md',CODEX_URL,'https://chatgpt.com/codex/pricing/']},
    {id:'api_pricing',title:'OpenAI API 模型定價',kind:'官方定價',required:true,urls:['https://developers.openai.com/api/docs/pricing.md',API_PRICING_URL]},
    {id:'model_catalog',title:'OpenAI API 模型目錄',kind:'官方模型目錄',required:false,urls:['https://developers.openai.com/api/docs/models.md',MODEL_CATALOG_URL]}
  ],
  seed_models:[
    seed('gpt-6-astra','GPT-6 Astra',10,1,12.5,50,[[20,5,45],[100,25,225],[200,100,900]],['low','medium','high','xhigh','max'],{long:[20,2,25,75],context_window:1050000,max_output_tokens:128000}),
    seed('gpt-5.6-sol','GPT-5.6 Sol',4,.4,5,20,[[20,10,100],[100,50,500],[200,200,2000]],['none','low','medium','high','xhigh','max'],{long:[8,.8,10,30],context_window:1050000,max_output_tokens:128000}),
    seed('gpt-5.6-terra','GPT-5.6 Terra',2,.2,2.5,12,[[20,25,200],[100,125,1000],[200,500,4000]],['none','low','medium','high','xhigh','max'],{long:[4,.4,5,18],context_window:1050000,max_output_tokens:128000}),
    seed('gpt-5.6-luna','GPT-5.6 Luna',.2,.02,.25,1.2,[[20,250,2000],[100,1250,10000],[200,5000,40000]],['none','low','medium','high','xhigh','max'],{long:[.4,.04,.5,1.8],context_window:1050000,max_output_tokens:128000}),
    seed('gpt-5.5','GPT-5.5',5,.5,null,30,[[20,15,80],[100,75,400],[200,300,1600]],['low','medium','high','xhigh'],{source:LEGACY_RATE_URL}),
    seed('gpt-5.4-mini','GPT-5.4 mini',.75,.075,null,4.5,[[20,60,350],[100,300,1750],[200,1200,7000]],['low','medium','high','xhigh'],{status:'retired',source:LEGACY_RATE_URL})
  ],
  async parse(fetched) {
    const codexText=htmlToText(fetched.codex_pricing||'');
    const apiText=htmlToText(fetched.api_pricing||'');
    const catalogText=htmlToText(fetched.model_catalog||'');
    if(!codexText && !apiText && !catalogText) return [];

    const map=new Map(this.seed_models.map(m=>[m.model_id,m]));
    const discovered=discoverOpenAIIds(`${catalogText}\n${apiText}`);
    for(const id of discovered){
      if(!map.has(id)) map.set(id,discoveredModel(id));
    }

    const out=[];
    for(const base of map.values()){
      let quotas=base.quotas||[];
      if(codexText && base.quotas?.length){
        const line=codexText.split('\n').find(x=>x.toLowerCase().includes(base.name.toLowerCase())) || windowNear(codexText,base.name,0,1200);
        const ranges=[...line.matchAll(/\d[\d,]*\s*[-—–~]\s*\d[\d,]*/g)].map(m=>parseRange(m[0])).filter(Boolean);
        if(ranges.length>=3) quotas=[quota('Plus',20,ranges[0]),quota('Pro 5x',100,ranges[1]),quota('Pro 20x',200,ranges[2])];
      }

      let pricing=base.pricing||[];
      const parsedPricing=parseStandardApiPricing(apiText,base.model_id);
      if(parsedPricing.length) pricing=parsedPricing;

      out.push({...base,quotas,pricing,sources:[
        ...(base.quotas?.length ? [modelSource('Codex 方案額度',CODEX_URL,'OpenAI')] : []),
        modelSource('OpenAI API 定價',API_PRICING_URL,'OpenAI'),
        modelSource('OpenAI API 模型目錄',MODEL_CATALOG_URL,'OpenAI')
      ]});
    }
    return out;
  }
};

function discoverOpenAIIds(text=''){
  const regex=/\b(?:gpt-[a-z0-9][a-z0-9._-]*|sora-[a-z0-9][a-z0-9._-]*|text-embedding-[a-z0-9][a-z0-9._-]*|o[1-9](?:-[a-z0-9][a-z0-9._-]*)?)\b/gi;
  return [...new Set([...text.matchAll(regex)].map(m=>m[0].toLowerCase()))].slice(0,250);
}

function parseStandardApiPricing(text,id){
  if(!text) return [];
  const line=text.split('\n').find(x=>x.toLowerCase().includes(id.toLowerCase()) && /\$\s*[0-9]/.test(x));
  if(!line) return [];
  const d=[...line.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));
  if(d.length>=8){
    return [
      {currency:'USD',unit:'1M_tokens',mode:'standard',schedule:'all_time',input:d[0],cached_input:d[1],cache_write:d[2],output:d[3],note:'Standard · Short context'},
      {currency:'USD',unit:'1M_tokens',mode:'standard',schedule:'all_time',input:d[4],cached_input:d[5],cache_write:d[6],output:d[7],note:'Standard · Long context'}
    ];
  }
  if(d.length>=4) return [{currency:'USD',unit:'1M_tokens',mode:'standard',schedule:'all_time',input:d[0],cached_input:d[1],cache_write:d[2],output:d[3]}];
  return [];
}

function discoveredModel(id){
  const lower=id.toLowerCase();
  let family='OpenAI';
  let caps=['text'];
  if(lower.startsWith('sora-')){family='Sora';caps=['video_generation'];}
  else if(lower.includes('image')){family='GPT Image';caps=['image_generation','image_editing'];}
  else if(lower.includes('realtime')||lower.includes('transcribe')||lower.includes('tts')){family='Realtime / Audio';caps=['audio'];}
  else if(lower.startsWith('text-embedding-')){family='Embedding';caps=['embeddings'];}
  else if(/^o\d/.test(lower)){family='o-series';caps=['text','reasoning'];}
  else if(lower.startsWith('gpt-')){family='GPT';caps=['text'];}
  return {model_id:id,name:prettyOpenAI(id),name_zh:prettyOpenAI(id),family,status:'active',capabilities:caps,pricing:[],quotas:[],source_url:MODEL_CATALOG_URL};
}

function prettyOpenAI(id){
  return prettyId(id).replace(/^Gpt\b/,'GPT').replace(/^Sora\b/,'Sora').replace(/^O([1-9])\b/,'o$1');
}
function quota(plan,fee,range){return{product:'Codex',plan,monthly_fee_usd:fee,window_hours:5,min:range[0],max:range[1],unit:'local_messages_estimate'}}
function seed(id,name,input,cached,cacheWrite,output,quotaRows,reasoning,opt={}){
  const source=opt.source||API_PRICING_URL;
  const pricing=[{currency:'USD',unit:'1M_tokens',input,cached_input:cached,cache_write:cacheWrite,output,mode:'standard',schedule:'all_time',note:'Standard · Short context'}];
  if(Array.isArray(opt.long)) pricing.push({currency:'USD',unit:'1M_tokens',input:opt.long[0],cached_input:opt.long[1],cache_write:opt.long[2],output:opt.long[3],mode:'standard',schedule:'all_time',note:'Standard · Long context'});
  return{model_id:id,name,name_zh:name,family:id.startsWith('gpt-6')?'GPT-6':'GPT-5',status:opt.status||'active',context_window:opt.context_window??null,max_output_tokens:opt.max_output_tokens??null,capabilities:['text','reasoning','tools','coding'],reasoning_efforts:reasoning,
    pricing,
    quotas:[quota('Plus',quotaRows[0][0],[quotaRows[0][1],quotaRows[0][2]]),quota('Pro 5x',quotaRows[1][0],[quotaRows[1][1],quotaRows[1][2]]),quota('Pro 20x',quotaRows[2][0],[quotaRows[2][1],quotaRows[2][2]])],
    source_url:source,sources:[modelSource('官方模型與定價',source,'OpenAI')]};
}
