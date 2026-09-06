import test from 'node:test';
import assert from 'node:assert/strict';
import { openaiProvider } from '../src/providers/openai.js';
import { anthropicProvider } from '../src/providers/anthropic.js';
import { deepseekProvider } from '../src/providers/deepseek.js';
import { qwenProvider } from '../src/providers/qwen.js';
import { doubaoProvider } from '../src/providers/doubao.js';
import { googleProvider } from '../src/providers/google.js';
import { xaiProvider } from '../src/providers/xai.js';
import { zhipuProvider } from '../src/providers/zhipu.js';
import { minimaxProvider } from '../src/providers/minimax.js';
import { mistralProvider } from '../src/providers/mistral.js';
import { groqProvider } from '../src/providers/groq.js';
import { PROVIDERS } from '../src/providers/index.js';
import { normalizeModel, primaryPrice, DATA_SCHEMA_VERSION } from '../src/schema.js';

test('資料結構版本為 v2',()=>assert.equal(DATA_SCHEMA_VERSION,2));

test('OpenAI 解析 Codex 額度，並使用目前 GPT-5.6 定價', async()=>{
 const pricing=`GPT-6 Astra | 5-45 | 25-225 | 100-900\nGPT-5.6 Sol | 10-100 | 50-500 | 200-2,000\nGPT-5.6 Terra | 25-200 | 125-1,000 | 500-4,000\nGPT-5.6 Luna | 250-2,000 | 1,250-10,000 | 5,000-40,000\nGPT-5.5 | 15-80 | 75-400 | 300-1,600\nGPT-5.4 mini | 60-350 | 300-1,750 | 1,200-7,000`;
 const release=`GPT-5.6 Sol $5 input / $30 output. GPT-5.6 Terra $2.50 input / $15 output. GPT-5.6 Luna $1 input / $6 output.`;
 const models=await openaiProvider.parse({codex_pricing:pricing,gpt56_release:release});
 const sol=models.find(m=>m.model_id==='gpt-5.6-sol');
 assert.equal(sol.quotas[0].min,10);assert.equal(sol.quotas[0].max,100);assert.equal(sol.pricing[0].input,5);assert.equal(sol.pricing[0].output,30);
});

test('Anthropic 保留 Sonnet / Opus / Fable / Mythos',async()=>{
 const models=await anthropicProvider.parse({sonnet:'Claude Sonnet 5 $2 per million input tokens and $10 per million output tokens.',opus:'Claude Opus 5 $5 per million input tokens and $25 per million output tokens.',fable:'Claude Fable 5.1 $10 per million input tokens and $50 per million output tokens.',mythos:'Claude Mythos 5.1 $10 per million input tokens and $50 per million output tokens.'});
 assert.ok(models.some(m=>m.model_id==='claude-mythos-5.1'));assert.equal(models.find(m=>m.model_id==='claude-sonnet-5').pricing[0].input,2);
});

test('DeepSeek 保留尖峰／離峰價格維度',async()=>{
 const text=`deepseek-v4-flash OFF-PEAK $0.007 $0.22 $0.66 PEAK $0.014 $0.44 $1.32\ndeepseek-v4-pro OFF-PEAK $0.022 $0.66 $1.98 PEAK $0.044 $1.32 $3.96`;
 const models=await deepseekProvider.parse({pricing:text});const flash=models.find(m=>m.model_id==='deepseek-v4-flash');assert.equal(flash.pricing.length,2);assert.equal(flash.pricing[0].schedule,'off_peak');
});

test('Qwen 可從官方目錄風格文字自動發現模型 ID',async()=>{
 const models=await qwenProvider.parse({pricing:'qwen3.8-27b $0.8 $4 qwen3.7-plus $0.4 $1.6 qwen3-32b $0.16 $0.64'});assert.ok(models.some(m=>m.model_id==='qwen3.8-27b'));assert.ok(models.some(m=>m.model_id==='qwen3-32b'));
});

test('豆包價格解析失敗時仍能收錄模型，不猜價格',async()=>{const models=await doubaoProvider.parse({pricing:'Model: doubao-seed-2.1-pro doubao-seed-2.2-lite'});assert.ok(models.some(m=>m.model_id==='doubao-seed-2.2-lite'));});

test('Gemini 可發現新增模型並保留既有多 tier 價格',async()=>{const models=await googleProvider.parse({pricing:'gemini-3.1-pro-preview $2 $12 gemini-3.8-flash $0.8 $4'});assert.ok(models.some(m=>m.model_id==='gemini-3.8-flash'));assert.ok(models.find(m=>m.model_id==='gemini-3.1-pro-preview').pricing.length>=4);});

test('Grok 保留 200K 以上長脈絡價格 tier',async()=>{const models=await xaiProvider.parse({pricing:'grok-4.6 $2 $0.50 $6 $4 $1 $12',models:'grok-4.6 grok-4.3'});assert.equal(models.find(m=>m.model_id==='grok-4.6').pricing.length,2);});

test('Z.ai 從官方文件索引發現 GLM 模型',async()=>{const models=await zhipuProvider.parse({catalog:'GLM-5.3 GLM-5.2 glm-5.4-preview'});assert.ok(models.some(m=>m.model_id==='glm-5.4-preview'));assert.equal(models.find(m=>m.model_id==='glm-5.3').context_window,1000000);});

test('MiniMax M3 保留 512K 前後價格',async()=>{const models=await minimaxProvider.parse({pricing:'MiniMax-M3 MiniMax-M2.7'});assert.equal(models.find(m=>m.model_id==='minimax-m3').pricing.length,2);});

test('Mistral 定價解析可更新旗艦模型',async()=>{const models=await mistralProvider.parse({pricing:'Mistral Large 3 $0.5 $0.05 $1.5 Mistral Medium 3.5 $1.5 $0.15 $7.5'});assert.equal(models.find(m=>m.model_id==='mistral-large-3').pricing[0].output,1.5);});

test('Groq 以部署平台身分保留 provider/model ID',async()=>{const models=await groqProvider.parse({models:'openai/gpt-oss-120b $0.15 $0.075 $0.60 qwen/qwen3.8-27b $0.80 $4.00'});assert.ok(models.some(m=>m.model_id==='openai/gpt-oss-120b'));});

test('所有 Provider ID 唯一且至少有可顯示模型種子',()=>{const ids=PROVIDERS.map(p=>p.id);assert.equal(new Set(ids).size,ids.length);assert.ok(PROVIDERS.length>=16);for(const p of PROVIDERS)assert.ok((p.seed_models||[]).length>0,`${p.id} 缺少 fallback seed`);});

test('正規化模型具有 provider-qualified uid、來源與評測',()=>{const m=normalizeModel(openaiProvider,openaiProvider.seed_models[1]);assert.equal(m.uid,'openai:gpt-5.6-sol');assert.equal(primaryPrice(m).input,5);assert.ok(m.benchmarks.length>=3);assert.ok(m.sources.length>=1);});
