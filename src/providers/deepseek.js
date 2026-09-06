import { htmlToText, windowNear } from '../core.js';

export const deepseekProvider = {
  id:'deepseek', name:'DeepSeek', homepage:'https://www.deepseek.com/',
  sources:[{id:'pricing',required:true,urls:['https://api-docs.deepseek.com/quick_start/pricing/','https://api-docs.deepseek.com/zh-cn/quick_start/pricing/']}],
  seed_models:[
    ds('deepseek-v4-flash','DeepSeek V4 Flash',0.014,0.44,1.32,0.007,0.22,0.66),
    ds('deepseek-v4-pro','DeepSeek V4 Pro',0.044,1.32,3.96,0.022,0.66,1.98),
    {model_id:'deepseek-v4-flash-vision-exp',name:'DeepSeek V4 Flash Vision Exp',family:'V4',status:'experimental',capabilities:['text','vision','reasoning','tools'],pricing:[],source_url:'https://api-docs.deepseek.com/quick_start/pricing/'}
  ],
  async parse(fetched) {
    const text = htmlToText(fetched.pricing || '');
    if (!text) return [];
    const ids = [...new Set([...text.matchAll(/deepseek-v[0-9][a-z0-9.-]*/gi)].map(m => m[0].toLowerCase()))];
    const out=[];
    for (const id of ids) {
      const w=windowNear(text,id,20,1300);
      const dollars=[...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1]));
      let pricing=[];
      if (dollars.length>=6) {
        pricing=[
          {currency:'USD',unit:'1M_tokens',schedule:'off_peak',cached_input:dollars[0],input:dollars[1],output:dollars[2],mode:'standard'},
          {currency:'USD',unit:'1M_tokens',schedule:'peak',cached_input:dollars[3],input:dollars[4],output:dollars[5],mode:'standard'}
        ];
      }
      const seed=this.seed_models.find(m=>m.model_id===id);
      out.push({...(seed||{model_id:id,name:title(id),family:'V4',status:id.includes('exp')?'experimental':'active',capabilities:['text','reasoning','tools']}),pricing:pricing.length?pricing:(seed?.pricing||[]),source_url:'https://api-docs.deepseek.com/quick_start/pricing/'});
    }
    return out;
  }
};
function title(id){return id.split('-').map(x=>x[0]?.toUpperCase()+x.slice(1)).join(' ')}
function ds(id,name,ph,pi,po,oh,oi,oo){return {model_id:id,name,family:'V4',status:'active',context_window:1000000,capabilities:['text','reasoning','tools','coding'],pricing:[{currency:'USD',unit:'1M_tokens',schedule:'peak',cached_input:ph,input:pi,output:po},{currency:'USD',unit:'1M_tokens',schedule:'off_peak',cached_input:oh,input:oi,output:oo}],source_url:'https://api-docs.deepseek.com/quick_start/pricing/'}}
