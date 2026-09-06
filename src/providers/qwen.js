import { htmlToText, windowNear } from '../core.js';

export const qwenProvider = {
  id:'qwen', name:'Qwen / Alibaba Cloud', homepage:'https://www.alibabacloud.com/product/model-studio',
  sources:[{id:'pricing',required:true,url:'https://www.alibabacloud.com/help/en/model-studio/model-pricing'}],
  seed_models:[
    q('qwen3.7-plus','Qwen3.7 Plus',0.4,1.6,256000),
    q('qwen3.6-plus','Qwen3.6 Plus',0.5,3,256000),
    q('qwen3.5-plus','Qwen3.5 Plus',0.4,2.4,128000),
    q('qwen3-235b-a22b','Qwen3 235B A22B',0.7,8.4,null),
    q('qwen3-32b','Qwen3 32B',0.16,0.64,null)
  ],
  async parse(fetched) {
    const text=htmlToText(fetched.pricing||'');
    if(!text)return[];
    const ids=[...new Set([...text.matchAll(/\bqwen(?:[0-9][a-z0-9.-]*|-[a-z0-9.-]+)\b/gi)].map(m=>m[0].toLowerCase()))];
    const out=[];
    for(const id of ids.slice(0,180)){
      const w=windowNear(text,id,10,900);
      const dollars=[...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));
      const seed=this.seed_models.find(m=>m.model_id===id);
      let pricing=[];
      if(dollars.length>=2){
        const unique=[...new Set(dollars)];
        pricing=[{currency:'USD',unit:'1M_tokens',region:'international',mode:'standard',input:unique[0],output:unique[1]??null,note:'Official Model Studio page may contain context/region/thinking tiers; inspect source for exact tier.'}];
      }
      out.push({
        ...(seed||{model_id:id,name:pretty(id),family:family(id),status:'active',capabilities:['text']}),
        pricing:pricing.length?pricing:(seed?.pricing||[]),
        source_url:'https://www.alibabacloud.com/help/en/model-studio/model-pricing',
        source_note:'Qwen has region/context/thinking tiered prices; dashboard keeps raw model catalog and primary comparable tier.'
      });
    }
    return out;
  }
};
function q(id,name,input,output,contextMax){return{model_id:id,name,family:family(id),status:'active',capabilities:['text','reasoning','tools'],pricing:[{currency:'USD',unit:'1M_tokens',region:'international',mode:'standard',context_max:contextMax,input,output}],source_url:'https://www.alibabacloud.com/help/en/model-studio/model-pricing'}}
function pretty(id){return id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function family(id){const m=id.match(/qwen([0-9]+(?:\.[0-9]+)?)/);return m?`Qwen ${m[1]}`:'Qwen'}
