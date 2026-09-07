import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../public/price-map.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/price-map.css',import.meta.url),'utf8');

test('首頁使用價格點陣圖而非成本曲線或排行榜',()=>{
  assert.match(index,/價格點陣圖/);
  assert.match(index,/id="價格圖模式"/);
  assert.match(index,/id="價格圖重設"/);
  assert.match(index,/\/price-map\.css/);
  assert.match(index,/\/price-map\.js/);
  assert.doesNotMatch(index,/cost-lines/);
  assert.doesNotMatch(index,/工作負載成本曲線/);
  assert.doesNotMatch(index,/工作負載成本排行榜/);
});

test('未勾選時只顯示一個最新可計價模型，勾選後最多六個',()=>{
  assert.match(script,/const fallback=newestComparable\(\)/);
  assert.match(script,/return fallback\?\[fallback\]:\[\]/);
  assert.match(script,/filter\(comparable\)\.slice\(0,6\)/);
  assert.match(script,/預設顯示：/);
});

test('點陣圖使用散點、對數價格座標與滑鼠滾輪縮放',()=>{
  assert.match(script,/type:'scatter',mode:'markers\+text'/);
  assert.match(script,/type:'log'/);
  assert.match(script,/scrollZoom:true/);
  assert.match(css,/cursor:grab/);
});

test('左鍵拖曳只平移，不使用框選或套索；雙擊可重設',()=>{
  assert.match(script,/dragmode:'pan'/);
  assert.doesNotMatch(script,/dragmode:'select'/);
  assert.doesNotMatch(script,/dragmode:'lasso'/);
  assert.match(script,/doubleClick:'reset\+autosize'/);
  assert.match(script,/xaxis\.autorange/);
  assert.match(script,/yaxis\.autorange/);
});
