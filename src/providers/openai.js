import { htmlToText, parseRange, windowNear } from '../core.js';
import { modelSource } from './helpers.js';

const PRICING_URL = 'https://openai.com/index/gpt-5-6/';
const CODEX_URL = 'https://learn.chatgpt.com/docs/pricing';
const RATE_URL = 'https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing';

export const openaiProvider = {
  id:'openai', name:'OpenAI', type:'模型供應商', homepage:'https://openai.com/',
  description_zh:'GPT、Codex 與多模態模型供應商。價格與訂閱額度分開保存。',
  sources:[
    {id:'codex_pricing',title:'Codex 方案與額度',kind:'官方定價',required:true,urls:['https://learn.chatgpt.com/docs/pricing.md',CODEX_URL,'https://chatgpt.com/codex/pricing/']},
    {id:'rate_card',title:'ChatGPT / Codex 費率表',kind:'官方定價',required:false,url:RATE_URL},
    {id:'gpt56_release',title:'GPT-5.6 發布與 API 定價',kind:'官方公告',required:false,url:PRICING_URL}
  ],
  seed_models:[
    seed('gpt-6-astra','GPT-6 Astra',10,1,50,[[20,5,45],[100,25,225],[200,100,900]],['low','medium','high','xhigh','max'],{source:'https://openai.com/index/gpt-6-astra/'}),
    seed('gpt-5.6-sol','GPT-5.6 Sol',5,.5,30,[[20,10,100],[100,50,500],[200,200,2000]],['low','medium','high','xhigh','max'],{cache_write:6.25}),
    seed('gpt-5.6-terra','GPT-5.6 Terra',2.5,.25,15,[[20,25,200],[100,125,1000],[200,500,4000]],['low','medium','high','xhigh','max'],{cache_write:3.125}),
    seed('gpt-5.6-luna','GPT-5.6 Luna',1,.1,6,[[20,250,2000],[100,1250,10000],[200,5000,40000]],['low','medium','high','xhigh','max'],{cache_write:1.25}),
    seed('gpt-5.5','GPT-5.5',5,.5,30,[[20,15,80],[100,75,400],[200,300,1600]],['low','medium','high','xhigh']),
    seed('gpt-5.4-mini','GPT-5.4 mini',.75,.075,4.5,[[20,60,350],[100,300,1750],[200,1200,7000]],['low','medium','high','xhigh'],{status:'retired'})
  ],
  async parse(fetched) {
    const pricingText=htmlToText(fetched.codex_pricing||'');
    const rateText=htmlToText(fetched.rate_card||'');
    const releaseText=htmlToText(fetched.gpt56_release||'');
    if(!pricingText && !rateText && !releaseText) return [];
    const seeds=Object.fromEntries(this.seed_models.map(m=>[m.model_id,m]));
    const out=[];
    for(const seedModel of this.seed_models){
      const {model_id:id,name}=seedModel;
      let quotas=seedModel.quotas;
      if(pricingText){
        const line=pricingText.split('\n').find(x=>x.toLowerCase().includes(name.toLowerCase())) || windowNear(pricingText,name,0,1200);
        const ranges=[...line.matchAll(/\d[\d,]*\s*[-—–~]\s*\d[\d,]*/g)].map(m=>parseRange(m[0])).filter(Boolean);
        if(ranges.length>=3) quotas=[quota('Plus',20,ranges[0]),quota('Pro 5x',100,ranges[1]),quota('Pro 20x',200,ranges[2])];
      }
      let pricing=seedModel.pricing;
      const seedTier=seedModel.pricing[0];
      if(id.startsWith('gpt-5.6') && releaseText){
        const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const m=releaseText.match(new RegExp(`${escaped}[\\s\\S]{0,180}?\\$\\s*([0-9]+(?:\\.[0-9]+)?)[\\s\\S]{0,100}?\\$\\s*([0-9]+(?:\\.[0-9]+)?)`,'i'));
        if(m) pricing=[{...seedTier,input:Number(m[1]),cached_input:seedTier.cached_input,output:Number(m[2])}];
      } else if(rateText){
        const line=rateText.split('\n').find(x=>x.toLowerCase().includes(name.toLowerCase())) || windowNear(rateText,name,0,500);
        const dollars=[...line.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));
        if(dollars.length>=3) pricing=[{...seedTier,input:dollars[0],cached_input:dollars[1],output:dollars[2]}];
        else if(dollars.length>=2) pricing=[{...seedTier,input:dollars[0],output:dollars[1]}];
      }
      out.push({...seedModel,quotas,pricing,sources:[
        modelSource('Codex 方案額度',CODEX_URL,'OpenAI'),
        modelSource('API 定價／模型資料',id.startsWith('gpt-5.6')?PRICING_URL:(seedModel.source_url||RATE_URL),'OpenAI')
      ]});
    }
    return out;
  }
};

function quota(plan,fee,range){return{product:'Codex',plan,monthly_fee_usd:fee,window_hours:5,min:range[0],max:range[1],unit:'local_messages_estimate'}}
function seed(id,name,input,cached,output,quotaRows,reasoning,opt={}){
  const source=opt.source||PRICING_URL;
  return{model_id:id,name,name_zh:name,family:id.startsWith('gpt-6')?'GPT-6':'GPT-5',status:opt.status||'active',capabilities:['text','reasoning','tools','coding'],reasoning_efforts:reasoning,
    pricing:[{currency:'USD',unit:'1M_tokens',input,cached_input:cached,cache_write:opt.cache_write??null,output,mode:'standard'}],
    quotas:[quota('Plus',quotaRows[0][0],[quotaRows[0][1],quotaRows[0][2]]),quota('Pro 5x',quotaRows[1][0],[quotaRows[1][1],quotaRows[1][2]]),quota('Pro 20x',quotaRows[2][0],[quotaRows[2][1],quotaRows[2][2]])],
    source_url:source,sources:[modelSource('官方模型與定價',source,'OpenAI')]};
}
