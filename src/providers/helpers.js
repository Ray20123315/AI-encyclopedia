import { htmlToText, windowNear } from '../core.js';

export function officialSources(...items) {
  return items.map(([id, title, url, required=true, kind='官方文件']) => ({ id, title, url, required, kind }));
}

export function textFrom(fetched, ...keys) {
  return htmlToText(keys.map(k => fetched?.[k] || '').join('\n'));
}

export function discoverIds(text, regex, limit=250) {
  return [...new Set([...String(text || '').matchAll(regex)].map(m => (m[1] || m[0]).trim()))].slice(0, limit);
}

export function prettyId(id='') {
  return id.replace(/[\/_-]+/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
}

export function dollarNumbersNear(text, id, before=20, after=1100) {
  const w = windowNear(text, id, before, after);
  return [...w.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)/g)].map(m => Number(m[1]));
}

export function usdTier(input, output, extra={}) {
  return { currency:'USD', unit:'1M_tokens', mode:'standard', schedule:'all_time', input, output, ...extra };
}

export function cnyTier(input, output, extra={}) {
  return { currency:'CNY', unit:'1M_tokens', mode:'standard', schedule:'all_time', input, output, ...extra };
}

export function modelSource(title, url, publisher, note='') {
  return { title, url, kind:'官方文件', publisher, note };
}

export function mergeDiscovered(seedModels, discovered, makeModel, limit=250) {
  const map = new Map(seedModels.map(m => [m.model_id.toLowerCase(), m]));
  for (const id of discovered.slice(0, limit)) {
    const key = id.toLowerCase();
    if (!map.has(key)) map.set(key, makeModel(id));
  }
  return [...map.values()];
}
