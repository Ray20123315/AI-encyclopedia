import test from 'node:test';
import assert from 'node:assert/strict';
import {modelRecency,compareModelsNewest,groupModelsNewest} from '../public/catalog-group.js';

test('模型目錄依供應商分組，組內最新發布優先',()=>{
  const models=[
    {provider_id:'openai',provider_name:'OpenAI',model_id:'gpt-5.5',name:'GPT-5.5',released_at:'2026-05-01'},
    {provider_id:'google',provider_name:'Google Gemini',model_id:'gemini-3.5-flash',name:'Gemini 3.5 Flash',released_at:'2026-08-20'},
    {provider_id:'openai',provider_name:'OpenAI',model_id:'gpt-5.6-sol',name:'GPT-5.6 Sol',released_at:'2026-08-15'}
  ];
  const groups=groupModelsNewest(models);
  assert.equal(groups[0].provider_id,'google');
  assert.equal(groups[1].provider_id,'openai');
  assert.deepEqual(groups[1].items.map(x=>x.model_id),['gpt-5.6-sol','gpt-5.5']);
});

test('沒有 released_at 時可由常見日期版 model id 推斷新舊',()=>{
  const newer={model_id:'qwen3-plus-2509',name:'Qwen3 Plus 2509'};
  const older={model_id:'qwen3-plus-2507',name:'Qwen3 Plus 2507'};
  assert.ok(modelRecency(newer)>modelRecency(older));
  assert.ok(compareModelsNewest(newer,older)<0);
});

test('沒有日期時以數字版本自然排序',()=>{
  const newer={model_id:'gpt-5.6',name:'GPT-5.6'};
  const older={model_id:'gpt-5.5',name:'GPT-5.5'};
  assert.ok(compareModelsNewest(newer,older)<0);
});
