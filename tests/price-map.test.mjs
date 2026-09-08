import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const script=await readFile(new URL('../public/price-map.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/price-map.css',import.meta.url),'utf8');

test('首頁使用價格點陣圖且預設說明為全部模型',()=>{
  assert.match(index,/價格點陣圖/);
  assert.match(index,/預設顯示全部可計價模型/);
  assert.match(index,/懸停看摘要/);
  assert.match(index,/點擊看詳情/);
  assert.match(index,/id="價格圖重設"/);
  assert.match(index,/\/price-map\.css/);
  assert.match(index,/\/price-map\.js/);
  assert.doesNotMatch(index,/工作負載成本曲線/);
  assert.doesNotMatch(index,/工作負載成本排行榜/);
});

test('未勾選時顯示全部目前可見可計價模型，勾選後最多六個',()=>{
  assert.match(script,/return\{models:可見模型\(\)\.filter\(comparable\),mode:'all'\}/);
  assert.match(script,/filter\(comparable\)\s*\.slice\(0,6\)/);
  assert.match(script,/預設顯示全部/);
  assert.doesNotMatch(script,/newestComparable/);
});

test('大量模型以供應商分組的 scattergl 呈現',()=>{
  assert.match(script,/function providerGroups/);
  assert.match(script,/type:'scattergl',mode:'markers'/);
  assert.match(script,/showlegend:traces\.length>1/);
  assert.match(script,/type:'log'/);
  assert.match(css,/cursor:grab/);
});

test('hover 只顯示簡要價格資訊，點擊資料點開模型詳情',()=>{
  assert.match(script,/hovertemplate:/);
  assert.match(script,/輸入 \$%\{x\}\/1M/);
  assert.match(script,/輸出 \$%\{y\}\/1M/);
  assert.match(script,/點擊查看詳細說明/);
  assert.match(script,/plotly_click/);
  assert.match(script,/開詳情\(uid\)/);
});

test('滾輪縮放、左鍵拖曳平移，不使用框選或套索；雙擊可重設',()=>{
  assert.match(script,/scrollZoom:true/);
  assert.match(script,/dragmode:'pan'/);
  assert.match(script,/clickmode:'event'/);
  assert.doesNotMatch(script,/dragmode:'select'/);
  assert.doesNotMatch(script,/dragmode:'lasso'/);
  assert.match(script,/doubleClick:'reset\+autosize'/);
  assert.match(script,/xaxis\.autorange/);
  assert.match(script,/yaxis\.autorange/);
});
