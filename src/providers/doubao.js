import { htmlToText } from '../core.js';

export const doubaoProvider = {
  id:'doubao', name:'Doubao / Volcengine Ark', homepage:'https://www.volcengine.com/product/ark',
  sources:[
    {id:'pricing',required:false,urls:['https://www.volcengine.com/product/ark/pricing','https://console.volcengine.com/ark/pricing']},
    {id:'seed21',required:false,url:'https://www.volcengine.com/docs/82379/2549861?lang=zh'}
  ],
  seed_models:[{
    model_id:'doubao-seed-2.1-pro',name:'Doubao Seed 2.1 Pro',family:'Seed 2.1',status:'active',
    capabilities:['text','reasoning','tools','coding'],context_window:256000,
    pricing:[{currency:'CNY',unit:'1M_tokens',region:'cn-beijing',mode:'standard',input:6,cached_input:1.2,output:30,note:'Public official-domain documentation/price references; verify console for account-specific discounts.'}],
    source_url:'https://www.volcengine.com/product/ark/pricing'
  }],
  async parse(fetched) {
    const text=htmlToText(`${fetched.pricing||''}\n${fetched.seed21||''}`);
    if(!text)return[];
    const ids=[...new Set([...text.matchAll(/doubao[-_][a-z0-9._-]+/gi)].map(m=>m[0].toLowerCase().replace(/_/g,'-')))];
    if(!ids.length)return[];
    return ids.slice(0,100).map(id=>{
      const seed=this.seed_models.find(m=>m.model_id===id);
      return seed||{model_id:id,name:id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),family:'Doubao',status:'active',capabilities:['text'],pricing:[],source_url:'https://www.volcengine.com/product/ark/pricing',source_note:'Volcengine pricing pages are dynamic; model is catalogued even when a comparable public price tier cannot be parsed.'};
    });
  }
};
