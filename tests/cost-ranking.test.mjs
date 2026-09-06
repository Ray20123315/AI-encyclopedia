import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../public/cost-ranking.js',import.meta.url),'utf8');

test('價格地圖已改為工作負載成本排行榜',()=>{
  assert.match(index,/工作負載成本排行榜/);
  assert.match(index,/id="排行輸入"/);
  assert.match(index,/id="排行輸出"/);
  assert.match(index,/id="排行次數"/);
  assert.match(index,/id="排行已選"/);
  assert.doesNotMatch(index,/>價格地圖</);
});

test('排行榜依 input/output token 與請求數計算並由低到高排序',()=>{
  assert.match(script,/cfg\.input\/1e6/);
  assert.match(script,/cfg\.output\/1e6/);
  assert.match(script,/perRequest\*cfg\.requests/);
  assert.match(script,/sort\(\(a,b\)=>a\.total-b\.total/);
});

test('成本比較使用水平長條圖而非散點價格圖',()=>{
  assert.match(script,/type:'bar',orientation:'h'/);
  assert.match(script,/Plotly\.react\('價格圖'/);
});
