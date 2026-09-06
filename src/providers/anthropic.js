import { htmlToText, windowNear } from '../core.js';
import { modelSource } from './helpers.js';

const SONNET='https://www.anthropic.com/research/claude-sonnet-5';
const OPUS='https://www.anthropic.com/claude/opus';
const FABLE='https://www.anthropic.com/claude/fable';
const MYTHOS='https://www.anthropic.com/claude/mythos';

export const anthropicProvider={
  id:'anthropic',name:'Anthropic / Claude',type:'模型供應商',homepage:'https://www.anthropic.com/',
  description_zh:'Claude 模型供應商；保留標準、Fast、快取與批次等價格差異。',
  sources:[
    {id:'sonnet',title:'Claude Sonnet 5',kind:'官方模型頁',required:true,url:SONNET},
    {id:'opus',title:'Claude Opus 系列',kind:'官方模型頁',required:true,url:OPUS},
    {id:'fable',title:'Claude Fable 系列',kind:'官方模型頁',required:true,url:FABLE},
    {id:'mythos',title:'Claude Mythos 系列',kind:'官方模型頁',required:false,url:MYTHOS}
  ],
  seed_models:[
    cl('claude-sonnet-5','Claude Sonnet 5',2,10,SONNET,{reasoning:['low','medium','high','xhigh']}),
    cl('claude-opus-5','Claude Opus 5',5,25,OPUS,{context:1000000,reasoning:['low','medium','high','xhigh','max'],fast:true}),
    cl('claude-fable-5.1','Claude Fable 5.1',10,50,FABLE,{cached:.25,context:1000000}),
    cl('claude-mythos-5.1','Claude Mythos 5.1',10,50,MYTHOS,{status:'restricted',context:1000000})
  ],
  async parse(fetched){
    const sourceById={
      'claude-sonnet-5':['sonnet',SONNET], 'claude-opus-5':['opus',OPUS],
      'claude-fable-5.1':['fable',FABLE], 'claude-mythos-5.1':['mythos',MYTHOS]
    };
    const out=[];
    for(const seed of this.seed_models){
      const [key,url]=sourceById[seed.model_id]; const text=htmlToText(fetched[key]||'');
      let pricing=seed.pricing;
      if(text){
        const w=windowNear(text,seed.name,80,2500)||text;
        const m=w.match(/\$\s*([0-9]+(?:\.[0-9]+)?)\s*(?:per|\/).*?input[\s\S]{0,180}?\$\s*([0-9]+(?:\.[0-9]+)?)\s*(?:per|\/).*?output/i);
        if(m) pricing=seed.pricing.map((p,i)=>i===0?{...p,input:Number(m[1]),output:Number(m[2])}:p);
      }
      out.push({...seed,pricing,sources:[modelSource('官方模型與定價',url,'Anthropic')]});
    }
    return out;
  }
};
function cl(id,name,input,output,url,opt={}){
 const cached=opt.cached??input*.1;
 const pricing=[{currency:'USD',unit:'1M_tokens',mode:'standard',input,cached_input:cached,cache_write:input*1.25,output,batch_input:input*.5,batch_output:output*.5}];
 if(opt.fast) pricing.push({currency:'USD',unit:'1M_tokens',mode:'fast',input:input*2,output:output*2,note:'官方 Fast mode 約 2.5 倍速度、2 倍基礎價格'});
 return{model_id:id,name,name_zh:name,family:name.includes('Sonnet')?'Sonnet':name.includes('Opus')?'Opus':name.includes('Fable')?'Fable':'Mythos',status:opt.status||'active',context_window:opt.context||null,capabilities:['text','vision','reasoning','tools','coding'],reasoning_efforts:opt.reasoning||[],pricing,source_url:url};
}
