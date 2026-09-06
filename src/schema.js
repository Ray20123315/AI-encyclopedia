export const DATA_SCHEMA_VERSION = 1;

export function modelUid(providerId, modelId) {
  return `${providerId}:${modelId}`;
}

export function normalizePriceTier(tier = {}) {
  return {
    currency: tier.currency || 'USD',
    unit: tier.unit || '1M_tokens',
    region: tier.region || 'global',
    mode: tier.mode || 'standard',
    schedule: tier.schedule || 'all_time',
    context_min: tier.context_min ?? null,
    context_max: tier.context_max ?? null,
    input: tier.input ?? null,
    cached_input: tier.cached_input ?? null,
    cache_write: tier.cache_write ?? null,
    output: tier.output ?? null,
    batch_input: tier.batch_input ?? null,
    batch_output: tier.batch_output ?? null,
    note: tier.note || ''
  };
}

export function normalizeModel(provider, model = {}) {
  const modelId = model.model_id || model.id;
  if (!provider?.id || !modelId) throw new Error('provider.id and model.model_id are required');
  return {
    uid: modelUid(provider.id, modelId),
    provider_id: provider.id,
    provider_name: provider.name,
    model_id: modelId,
    name: model.name || modelId,
    family: model.family || '',
    status: model.status || 'active',
    released_at: model.released_at || null,
    retired_at: model.retired_at || null,
    context_window: model.context_window ?? null,
    max_output_tokens: model.max_output_tokens ?? null,
    capabilities: Array.isArray(model.capabilities) ? [...new Set(model.capabilities)] : [],
    reasoning_efforts: Array.isArray(model.reasoning_efforts) ? model.reasoning_efforts : [],
    pricing: Array.isArray(model.pricing) ? model.pricing.map(normalizePriceTier) : [],
    quotas: Array.isArray(model.quotas) ? model.quotas : [],
    source_url: model.source_url || provider.sources?.[0] || null,
    source_note: model.source_note || '',
    confidence: model.confidence || 'official',
    synced_at: model.synced_at || new Date().toISOString()
  };
}

export function primaryPrice(model) {
  const tiers = model?.pricing || [];
  const candidates = tiers.filter(t => t.currency === 'USD' && t.mode === 'standard' && t.schedule === 'all_time');
  const tier = candidates[0] || tiers.find(t => t.currency === 'USD') || tiers[0] || null;
  return tier;
}
