import { htmlToText, parseRange, windowNear } from '../core.js';

export const openaiProvider = {
  id: 'openai',
  name: 'OpenAI',
  homepage: 'https://openai.com/',
  sources: [
    { id: 'codex_pricing', required: true, urls: ['https://learn.chatgpt.com/docs/pricing.md', 'https://learn.chatgpt.com/docs/pricing', 'https://chatgpt.com/codex/pricing/'] },
    { id: 'rate_card', required: false, url: 'https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing' }
  ],
  seed_models: [
    seed('gpt-6-astra', 'GPT-6 Astra', 10, 1, 50, [[20,5,45],[100,25,225],[200,100,900]], ['low','medium','high','xhigh','max']),
    seed('gpt-5.6-sol', 'GPT-5.6 Sol', 4, .4, 20, [[20,10,100],[100,50,500],[200,200,2000]], ['low','medium','high','xhigh','max']),
    seed('gpt-5.6-terra', 'GPT-5.6 Terra', 2, .2, 12, [[20,25,200],[100,125,1000],[200,500,4000]], ['low','medium','high','xhigh','max']),
    seed('gpt-5.6-luna', 'GPT-5.6 Luna', .2, .02, 1.2, [[20,250,2000],[100,1250,10000],[200,5000,40000]], ['low','medium','high','xhigh','max']),
    seed('gpt-5.5', 'GPT-5.5', 5, .5, 30, [[20,15,80],[100,75,400],[200,300,1600]], ['low','medium','high','xhigh']),
    seed('gpt-5.4-mini', 'GPT-5.4 mini', .75, .075, 4.5, [[20,60,350],[100,300,1750],[200,1200,7000]], ['low','medium','high','xhigh'], 'retired')
  ],
  async parse(fetched) {
    const pricingText = htmlToText(fetched.codex_pricing || '');
    const rateText = htmlToText(fetched.rate_card || '');
    if (!pricingText) return [];
    const specs = [
      ['gpt-6-astra','GPT-6 Astra'],['gpt-5.6-sol','GPT-5.6 Sol'],['gpt-5.6-terra','GPT-5.6 Terra'],
      ['gpt-5.6-luna','GPT-5.6 Luna'],['gpt-5.5','GPT-5.5'],['gpt-5.4-mini','GPT-5.4 mini']
    ];
    const seeds = Object.fromEntries(this.seed_models.map(m => [m.model_id, m]));
    const out = [];
    for (const [id, name] of specs) {
      const w = windowNear(pricingText, name, 50, 1500);
      const ranges = [...w.matchAll(/\d[\d,]*\s*[-—–~]\s*\d[\d,]*/g)].map(m => parseRange(m[0])).filter(Boolean);
      const quotas = ranges.length >= 3 ? [
        quota('Plus', 20, ranges[0]), quota('Pro 5x', 100, ranges[1]), quota('Pro 20x', 200, ranges[2])
      ] : seeds[id].quotas;
      let pricing = seeds[id].pricing;
      if (rateText) {
        const rw = windowNear(rateText, name, 50, 700);
        const dollars = [...rw.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m => Number(m[1]));
        if (dollars.length >= 3) pricing = [{ currency:'USD', unit:'1M_tokens', input:dollars[0], cached_input:dollars[1], output:dollars[2], mode:'standard' }];
      }
      out.push({ ...seeds[id], quotas, pricing, source_url:'https://learn.chatgpt.com/docs/pricing' });
    }
    return out;
  }
};

function quota(plan, fee, range) {
  return { product:'Codex', plan, monthly_fee_usd:fee, window_hours:5, min:range[0], max:range[1], unit:'local_messages_estimate' };
}
function seed(id, name, input, cached, output, quotaRows, reasoning, status='active') {
  return {
    model_id:id, name, family:id.startsWith('gpt-6')?'GPT-6':'GPT-5', status,
    capabilities:['text','reasoning','tools','coding'], reasoning_efforts:reasoning,
    pricing:[{currency:'USD',unit:'1M_tokens',input,cached_input:cached,output,mode:'standard'}],
    quotas:[quota('Plus', quotaRows[0][0], [quotaRows[0][1], quotaRows[0][2]]), quota('Pro 5x', quotaRows[1][0], [quotaRows[1][1], quotaRows[1][2]]), quota('Pro 20x', quotaRows[2][0], [quotaRows[2][1], quotaRows[2][2]])],
    source_url:'https://learn.chatgpt.com/docs/pricing'
  };
}
