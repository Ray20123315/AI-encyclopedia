import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS } from '../src/providers/index.js';
import { normalizeModel } from '../src/schema.js';
import { benchmarkFeedsForProvider } from '../src/benchmarks-auto.js';

test('v0.3.0 至少涵蓋 16 個官方來源／推論平台與 60 個 fallback 項目',()=>{
 const models=PROVIDERS.flatMap(p=>(p.seed_models||[]).map(m=>normalizeModel(p,m)));
 assert.ok(PROVIDERS.length>=16);
 assert.ok(models.length>=60);
});

test('fallback 種子不得內建人工 Benchmark 分數',()=>{
 const models=PROVIDERS.flatMap(p=>(p.seed_models||[]).map(m=>normalizeModel(p,m)));
 for(const m of models)assert.equal(m.benchmarks.length,0,`${m.uid} 不應內建 Benchmark 分數`);
});

test('自動 Benchmark feed 必須保留官方來源與模型映射',()=>{
 const feeds=PROVIDERS.flatMap(p=>benchmarkFeedsForProvider(p.id));
 const providerIds=new Set(feeds.map(f=>f.provider_id));
 assert.ok(feeds.length>=10,'自動 Benchmark feed 數量過少');
 assert.ok(providerIds.size>=8,'自動 Benchmark provider 覆蓋過少');
 for(const f of feeds){
   assert.ok(/^https:\/\//.test(f.url),`${f.id} 缺有效官方來源 URL`);
   assert.ok(f.title&&f.publisher,`${f.id} 缺來源名稱／發布者`);
   assert.ok(Array.isArray(f.models)&&f.models.length>0,`${f.id} 缺模型映射`);
 }
});

test('模型來源至少可回到官方來源',()=>{
 const models=PROVIDERS.flatMap(p=>(p.seed_models||[]).map(m=>normalizeModel(p,m)));
 for(const m of models)assert.ok(m.source_url||m.sources.length,`${m.uid} 缺資料來源`);
});
