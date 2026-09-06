import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS } from '../src/providers/index.js';
import { normalizeModel } from '../src/schema.js';

test('v0.2.0 至少涵蓋 16 個官方來源／推論平台與 60 個 fallback 項目',()=>{
 const models=PROVIDERS.flatMap(p=>(p.seed_models||[]).map(m=>normalizeModel(p,m)));
 assert.ok(PROVIDERS.length>=16);
 assert.ok(models.length>=60);
});

test('至少 10 個模型有來源可追溯的公開評測分數',()=>{
 const models=PROVIDERS.flatMap(p=>(p.seed_models||[]).map(m=>normalizeModel(p,m)));
 const scored=models.filter(m=>m.benchmarks.length>0);
 assert.ok(scored.length>=10);
 for(const m of scored)for(const b of m.benchmarks){assert.ok(b.source_url,`${m.uid}/${b.benchmark_id} 缺來源`);assert.ok(b.benchmark_name);assert.notEqual(b.score,null);}
});

test('模型來源至少可回到官方來源',()=>{
 const models=PROVIDERS.flatMap(p=>(p.seed_models||[]).map(m=>normalizeModel(p,m)));
 for(const m of models)assert.ok(m.source_url||m.sources.length,`${m.uid} 缺資料來源`);
});
