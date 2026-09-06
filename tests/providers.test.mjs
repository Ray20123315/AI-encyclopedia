import test from 'node:test';
import assert from 'node:assert/strict';
import { openaiProvider } from '../src/providers/openai.js';
import { anthropicProvider } from '../src/providers/anthropic.js';
import { deepseekProvider } from '../src/providers/deepseek.js';
import { qwenProvider } from '../src/providers/qwen.js';
import { doubaoProvider } from '../src/providers/doubao.js';
import { normalizeModel, primaryPrice } from '../src/schema.js';

test('OpenAI parses Codex ranges and rate card', async () => {
  const pricing = `GPT-6 Astra | 5-45 | 25-225 | 100-900\nGPT-5.6 Sol | 10-100 | 50-500 | 200-2,000\nGPT-5.6 Terra | 25-200 | 125-1,000 | 500-4,000\nGPT-5.6 Luna | 250-2,000 | 1,250-10,000 | 5,000-40,000\nGPT-5.5 | 15-80 | 75-400 | 300-1,600\nGPT-5.4 mini | 60-350 | 300-1,750 | 1,200-7,000`;
  const rate = `GPT-6 Astra $10 $1 $50\nGPT-5.6 Sol $4 $0.4 $20\nGPT-5.6 Terra $2 $0.2 $12\nGPT-5.6 Luna $0.2 $0.02 $1.2\nGPT-5.5 $5 $0.5 $30\nGPT-5.4 mini $0.75 $0.075 $4.5`;
  const models = await openaiProvider.parse({codex_pricing: pricing, rate_card: rate});
  const astra = models.find(m => m.model_id === 'gpt-6-astra');
  assert.deepEqual(astra.quotas[0].min, 5);
  assert.deepEqual(astra.quotas[0].max, 45);
  assert.equal(astra.pricing[0].output, 50);
});

test('Anthropic parses current model prices', async () => {
  const models = await anthropicProvider.parse({
    sonnet:'Claude Sonnet 5 is available today at $2 per million input tokens and $10 per million output tokens.',
    opus:'Pricing for Opus 5 starts at $5 per million input tokens and $25 per million output tokens.',
    fable:'Claude Fable 5.1 is priced at $10 per million input tokens and $50 per million output tokens.'
  });
  assert.equal(models.find(m=>m.model_id==='claude-sonnet-5').pricing[0].input, 2);
  assert.equal(models.find(m=>m.model_id==='claude-opus-5').pricing[0].output, 25);
  assert.equal(models.find(m=>m.model_id==='claude-fable-5.1').pricing[0].input, 10);
});

test('DeepSeek keeps peak/off-peak dimensions', async () => {
  const text = `deepseek-v4-flash OFF-PEAK $0.007 $0.22 $0.66 PEAK $0.014 $0.44 $1.32\ndeepseek-v4-pro OFF-PEAK $0.022 $0.66 $1.98 PEAK $0.044 $1.32 $3.96`;
  const models = await deepseekProvider.parse({pricing:text});
  const flash = models.find(m=>m.model_id==='deepseek-v4-flash');
  assert.equal(flash.pricing.length, 2);
  assert.equal(flash.pricing[0].schedule, 'off_peak');
});

test('Qwen discovers model IDs from official-style catalog text', async () => {
  const models = await qwenProvider.parse({pricing:'qwen3.7-plus $0.4 $1.6 qwen3.6-plus $0.5 $3 qwen3-32b $0.16 $0.64'});
  assert.ok(models.some(m=>m.model_id==='qwen3.7-plus'));
  assert.ok(models.some(m=>m.model_id==='qwen3-32b'));
});

test('Doubao catalogs model even when price parser is unavailable', async () => {
  const models = await doubaoProvider.parse({pricing:'Model: doubao-seed-2.1-pro'});
  assert.ok(models.some(m=>m.model_id==='doubao-seed-2.1-pro'));
});

test('Normalized model has provider-qualified uid and comparable primary price', () => {
  const m = normalizeModel(openaiProvider, openaiProvider.seed_models[1]);
  assert.equal(m.uid, 'openai:gpt-5.6-sol');
  assert.equal(primaryPrice(m).input, 4);
});
