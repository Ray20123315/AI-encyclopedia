import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
new vm.Script(app,{filename:'public/app.js'});
for(const required of ['搜尋','已勾選','資料來源','成本試算','自動評測','全部收合'])if(!html.includes(required)&&!app.includes(required))throw new Error(`前端缺少必要中文功能字串：${required}`);
for(const asset of ['/style.css','/app.js'])if(!html.includes(asset))throw new Error(`index.html 未引用 ${asset}`);
console.log('前端檢查通過：中文介面、搜尋勾選、來源收合、自動評測與靜態資產皆存在。');
