import { htmlToText } from '../core.js';

export const anthropicProvider = {
  id: 'anthropic',
  name: 'Anthropic',
  homepage: 'https://www.anthropic.com/',
  sources: [
    { id:'sonnet', required:false, url:'https://www.anthropic.com/claude/sonnet' },
    { id:'opus', required:false, url:'https://www.anthropic.com/claude/opus' },
    { id:'fable', required:false, url:'https://www.anthropic.com/claude/fable' },
    { id:'lifecycle', required:false, url:'https://docs.anthropic.com/en/docs/about-claude/model-deprecations' }
  ],
  seed_models: [
    claude('claude-sonnet-5','Claude Sonnet 5','Sonnet',2,10,['low','medium','high','xhigh']),
    claude('claude-opus-5','Claude Opus 5','Opus',5,25,['low','medium','high','xhigh']),
    claude('claude-fable-5.1','Claude Fable 5.1','Fable',10,50,['medium','high','xhigh'])
  ],
  async parse(fetched) {
    const rows = [];
    for (const spec of [
      ['sonnet','claude-sonnet-5','Claude Sonnet 5','Sonnet'],
      ['opus','claude-opus-5','Claude Opus 5','Opus'],
      ['fable','claude-fable-5.1','Claude Fable 5.1','Fable']
    ]) {
      const [sourceKey,id,name,family] = spec;
      const text = htmlToText(fetched[sourceKey] || '');
      if (!text) continue;
      const patterns = [
        /\$\s*([0-9]+(?:\.[0-9]+)?)\s*(?:per|\/)\s*(?:one\s+)?million\s+input\s+tokens[\s\S]{0,180}?\$\s*([0-9]+(?:\.[0-9]+)?)\s*(?:per|\/)\s*(?:one\s+)?million\s+output\s+tokens/i,
        /priced at\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*per million input tokens\s*and\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*per million output tokens/i,
        /starts at\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*per million input tokens\s*and\s*\$\s*([0-9]+(?:\.[0-9]+)?)\s*per million output tokens/i
      ];
      let match = null;
      for (const p of patterns) { match = text.match(p); if (match) break; }
      const seed = this.seed_models.find(m => m.model_id === id);
      const input = match ? Number(match[1]) : seed.pricing[0].input;
      const output = match ? Number(match[2]) : seed.pricing[0].output;
      rows.push(claude(id,name,family,input,output,seed.reasoning_efforts, sourceKey==='opus' ? 2.5 : null));
    }
    return rows;
  }
};

function claude(id,name,family,input,output,efforts,fastSpeed=null) {
  return {
    model_id:id,name,family,status:'active',context_window:null,
    capabilities:['text','reasoning','tools','coding','vision'],reasoning_efforts:efforts,
    pricing:[
      {currency:'USD',unit:'1M_tokens',input,output,cached_input:input*0.1,cache_write:input*1.25,mode:'standard',note:'Cache write uses 5-minute default multiplier where applicable'},
      ...(fastSpeed ? [{currency:'USD',unit:'1M_tokens',input:input*2,output:output*2,mode:'fast',note:`~${fastSpeed}x speed; 2x base price`}]:[])
    ],
    source_url:`https://www.anthropic.com/claude/${family.toLowerCase()}`
  };
}
