import { htmlToText } from '../core.js';
import { modelSource, prettyId } from './helpers.js';
const PRICE='https://www.volcengine.com/product/ark/pricing';
const DOC='https://www.volcengine.com/docs/82379/2549861?lang=zh';
export const doubaoProvider={
 id:'doubao',name:'豆包 / 火山引擎方舟',type:'模型供應商',homepage:'https://www.volcengine.com/product/ark',description_zh:'字節跳動豆包模型。部分價格頁高度動態；無法驗證時只列模型，不猜價格。',
 sources:[{id:'pricing',title:'方舟模型定價',kind:'官方定價',required:false,urls:[PRICE,'https://console.volcengine.com/ark/pricing']},{id:'seed21',title:'Doubao Seed 2.1 文件',kind:'官方文件',required:false,url:DOC}],
 seed_models:[{model_id:'doubao-seed-2.1-pro',name:'Doubao Seed 2.1 Pro',name_zh:'豆包 Seed 2.1 Pro',family:'Seed 2.1',status:'active',capabilities:['text','reasoning','tools','coding'],context_window:256000,pricing:[{currency:'CNY',unit:'1M_tokens',region:'cn-beijing',mode:'standard',input:6,cached_input:1.2,output:30,note:'公開官方頁基準；帳戶折扣以控制台為準。'}],source_url:PRICE,sources:[modelSource('方舟官方定價',PRICE,'火山引擎')]}],
 async parse(fetched){const text=htmlToText(`${fetched.pricing||''}\n${fetched.seed21||''}`);if(!text)return[];const ids=[...new Set([...text.matchAll(/doubao[-_][a-z0-9._-]+/gi)].map(m=>m[0].toLowerCase().replace(/_/g,'-')))];if(!ids.length)return[];return ids.slice(0,160).map(id=>{const seed=this.seed_models.find(m=>m.model_id===id);return seed||{model_id:id,name:prettyId(id),name_zh:prettyId(id),family:'Doubao',status:'active',capabilities:['text'],pricing:[],sources:[modelSource('方舟官方定價',PRICE,'火山引擎')],source_note:'官方價格頁為動態頁，未解析到可驗證 tier 時不顯示價格。'};});}
};
