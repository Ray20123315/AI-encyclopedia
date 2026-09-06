import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../public/cost-ranking.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/cost-ranking.css',import.meta.url),'utf8');
const scale=await readFile(new URL('../public/ui-scale.css',import.meta.url),'utf8');

test('價格地圖已改為可上下捲動的工作負載成本排行榜',()=>{
  assert.match(index,/工作負載成本排行榜/);
  assert.match(index,/id="排行捲動區"/);
  assert.match(index,/可上下捲動/);
  assert.match(index,/value="all" selected>全部/);
  assert.match(index,/id="排行回頂"/);
  assert.doesNotMatch(index,/>價格地圖</);
  assert.match(css,/overflow-y:auto/);
  assert.match(css,/scroll-behavior:smooth/);
});

test('排行榜依 input/output token 與請求數計算並由低到高排序',()=>{
  assert.match(script,/cfg\.input\/1e6/);
  assert.match(script,/cfg\.output\/1e6/);
  assert.match(script,/perRequest\*cfg\.requests/);
  assert.match(script,/sort\(\(a,b\)=>a\.total-b\.total/);
  assert.match(script,/cfg\.limit==='all'/);
});

test('成本比較使用水平長條圖並支援鍵盤上下移動',()=>{
  assert.match(script,/type:'bar',orientation:'h'/);
  assert.match(script,/Plotly\.react\('價格圖'/);
  assert.match(script,/PageDown/);
  assert.match(script,/PageUp/);
  assert.match(script,/scrollTo\(\{top:0,behavior:'smooth'\}\)/);
});

test('全站介面以 CSS zoom 等比放大',()=>{
  assert.match(index,/\/ui-scale\.css/);
  assert.match(scale,/--ui-scale:1\.12/);
  assert.match(scale,/zoom:var\(--ui-scale\)/);
});
