import { DATA_SCHEMA_VERSION, normalizeModel, primaryPrice } from './schema.js';

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function decodeEntities(s = '') {
  return s
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2F;/gi, '/');
}

export function htmlToText(raw = '') {
  let text = raw;
  if (/<(?:html|body|table|div|script|main|section)\b/i.test(raw)) {
    text = raw
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:tr|p|div|li|h[1-6]|section|article|table|thead|tbody)>/gi, '\n')
      .replace(/<(?:td|th)\b[^>]*>/gi, ' | ')
      .replace(/<[^>]+>/g, ' ');
  }
  return decodeEntities(text)
    .replace(/\u00a0|\u202f/g, ' ')
    .replace(/[−—–]/g, '-')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

export function parseMoney(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(/[$¥￥,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function parseRange(v) {
  const m = String(v).replace(/[—–~]/g, '-').match(/([\d,.]+)\s*-\s*([\d,.]+)/);
  if (!m) return null;
  return [Number(m[1].replace(/,/g, '')), Number(m[2].replace(/,/g, ''))];
}

export function windowNear(text, needle, before = 100, after = 900) {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(String(needle).toLowerCase());
  if (idx < 0) return '';
  return text.slice(Math.max(0, idx - before), idx + after);
}

export async function fetchText(urls, userAgent = 'AI-Encyclopedia/0.2 (+Cloudflare-Worker; public-official-data-sync)') {
  const list = Array.isArray(urls) ? urls : [urls];
  let lastError = null;
  for (const url of list) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), 15000);
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          accept: 'text/markdown,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7',
          'user-agent': userAgent
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.length < 150) throw new Error(`response too short (${text.length})`);
      return { url, text, status: res.status };
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('fetch failed');
}

export async function runProviderSync(provider) {
  const fetched = {};
  const source_status = {};
  for (const source of provider.sources || []) {
    try {
      const result = await fetchText(source.urls || source.url);
      fetched[source.id] = result.text;
      source_status[source.id] = { ok: true, title:source.title || source.title_zh || source.id, kind:source.kind || '官方文件', configured_url:(source.urls || source.url), resolved_url: result.url };
    } catch (err) {
      source_status[source.id] = { ok: false, title:source.title || source.title_zh || source.id, kind:source.kind || '官方文件', configured_url:(source.urls || source.url), error: String(err?.message || err) };
    }
  }

  let parsed = [];
  let parse_error = null;
  try {
    parsed = await provider.parse(fetched, source_status);
  } catch (err) {
    parse_error = String(err?.message || err);
  }

  const now = new Date().toISOString();
  const models = (parsed.length ? parsed : provider.seed_models || [])
    .map(m => normalizeModel(provider, { ...m, synced_at: now }));

  const okSources = Object.values(source_status).filter(s => s.ok).length;
  const requiredSources = (provider.sources || []).filter(s => s.required !== false).length;
  const okRequired = (provider.sources || []).filter(s => s.required !== false && source_status[s.id]?.ok).length;
  const parserWorked = parsed.length > 0;
  const status = parserWorked && okRequired === requiredSources ? 'synced' : parserWorked || okSources > 0 ? 'partial' : 'fallback';

  return {
    provider: {
      id: provider.id,
      name: provider.name,
      homepage: provider.homepage,
      type: provider.type || '模型供應商',
      description_zh: provider.description_zh || '',
      status,
      last_attempt_at: now,
      last_success_at: parserWorked ? now : null,
      source_status,
      parse_error,
      model_count: models.length
    },
    models
  };
}

export function mergeProviderResult(current, result) {
  const next = clone(current);
  const providerId = result.provider.id;
  const existingProvider = next.providers.find(p => p.id === providerId);
  const replacementProvider = {
    ...(existingProvider || {}),
    ...result.provider,
    last_success_at: result.provider.last_success_at || existingProvider?.last_success_at || null
  };
  next.providers = next.providers.filter(p => p.id !== providerId).concat(replacementProvider);

  const hasFresh = result.provider.status === 'synced' || result.provider.status === 'partial';
  if (hasFresh) {
    next.models = next.models.filter(m => m.provider_id !== providerId).concat(result.models);
  } else if (!next.models.some(m => m.provider_id === providerId)) {
    next.models = next.models.concat(result.models);
  }
  next.models.sort((a, b) => a.provider_name.localeCompare(b.provider_name) || a.name.localeCompare(b.name));
  next.meta.updated_at = new Date().toISOString();
  next.meta.schema_version = DATA_SCHEMA_VERSION;
  next.meta.provider_count = next.providers.length;
  next.meta.model_count = next.models.length;
  next.meta.status = next.providers.some(p => p.status === 'fallback') ? 'partial' : 'synced';
  return next;
}

export function snapshotFingerprint(data) {
  const compact = data.models.map(m => ({
    uid: m.uid,
    status: m.status,
    pricing: m.pricing,
    quotas: m.quotas,
    context_window: m.context_window,
    benchmarks: m.benchmarks
  }));
  return JSON.stringify(compact);
}

export function historyPoint(model) {
  const p = primaryPrice(model);
  return {
    uid: model.uid,
    provider_id: model.provider_id,
    model_id: model.model_id,
    input: p?.input ?? null,
    output: p?.output ?? null,
    cached_input: p?.cached_input ?? null,
    currency: p?.currency ?? null,
    unit: p?.unit ?? null
  };
}
