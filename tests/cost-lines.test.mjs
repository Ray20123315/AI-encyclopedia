import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../public/cost-lines.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/cost-lines.css',import.meta.url),'utf8');

test('成本排行榜已替換為工作負載成本曲線',()=>{
  assert.match(index,/工作負載成本曲線/);
  assert.match(index,/id="曲線軸"/);
  assert.match(index,/id="曲線上限"/);
  assert.match(index,/id="曲線輸入"/);
  assert.match(index,/id="曲線輸出"/);
  assert.match(index,/id="曲線次數"/);
  assert.doesNotMatch(index,/工作負載成本排行榜/);
  assert.doesNotMatch(index,/cost-ranking/);
});

test('成本曲線支援輸入、輸出與請求次數三種 X 軸',()=>{
  assert.match(index,/value="input"/);
  assert.match(index,/value="output"/);
  assert.match(index,/value="requests"/);
  assert.match(script,/cfg\.axis==='input'/);
  assert.match(script,/cfg\.axis==='output'/);
  assert.match(script,/cfg\.axis==='requests'/);
});

test('成本曲線依 context 自動選擇價格 tier',()=>{
  assert.match(script,/function tierFor/);
  assert.match(script,/context_min/);
  assert.match(script,/context_max/);
  assert.match(script,/inputTokens\)\/1e6/);
  assert.match(script,/outputTokens\)\/1e6/);
});

test('折線圖最多比較六個模型並使用 unified hover',()=>{
  assert.match(script,/slice\(0,6\)/);
  assert.match(script,/type:'scatter',mode:'lines'/);
  assert.match(script,/hovermode:'x unified'/);
  assert.match(script,/Plotly\.react\('價格圖'/);
  assert.match(script,/scrollZoom:true/);
  assert.match(css,/cost-curve-chart/);
});
