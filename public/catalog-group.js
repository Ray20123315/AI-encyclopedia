const CATALOG_UI_VERSION='0.3.3';
const 數字排序=new Intl.Collator('zh-Hant',{numeric:true,sensitivity:'base'});
const 展開集合=new Set(readExpanded());
let 資料快取=null,快取時間=0,排程=null,處理中=false,observer=null;

function readExpanded(){
  try{return JSON.parse(localStorage.getItem('ai-encyclopedia:catalog-expanded')||'[]')}catch{return[]}
}
function saveExpanded(){
  try{localStorage.setItem('ai-encyclopedia:catalog-expanded',JSON.stringify([...展開集合]))}catch{}
}
function safeDate(v){const t=Date.parse(v||'');return Number.isFinite(t)?t:null}
function dateFromId(value=''){
  const s=String(value);
  let m=s.match(/(?:^|[^0-9])(20\d{2})[-_./]?(0[1-9]|1[0-2])[-_./]?([0-2]\d|3[01])(?:[^0-9]|$)/);
  if(m){const t=Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]));if(Number.isFinite(t))return t}
  m=s.match(/(?:^|[-_.])(20\d{2})[-_.](0[1-9]|1[0-2])(?:[-_.]|$)/);
  if(m)return Date.UTC(Number(m[1]),Number(m[2])-1,1);
  m=s.match(/(?:^|[-_.])(\d{2})(0[1-9]|1[0-2])(?:[-_.]|$)/);
  if(m){const y=2000+Number(m[1]);if(y>=2020&&y<=2099)return Date.UTC(y,Number(m[2])-1,1)}
  return null;
}
export function modelRecency(model={}){
  return safeDate(model.released_at)??dateFromId(model.model_id)??dateFromId(model.name)??null;
}
export function compareModelsNewest(a,b){
  const ad=modelRecency(a),bd=modelRecency(b);
  if(ad!=null||bd!=null){if(ad==null)return 1;if(bd==null)return-1;if(ad!==bd)return bd-ad}
  const an=a.name_zh||a.name||a.model_id||'',bn=b.name_zh||b.name||b.model_id||'';
  return 數字排序.compare(bn,an);
}
export function groupModelsNewest(models=[]){
  const map=new Map();
  for(const model of models){
    const key=model.provider_id||model.provider_name||'unknown';
    if(!map.has(key))map.set(key,[]);
    map.get(key).push(model);
  }
  const groups=[...map.entries()].map(([provider_id,items])=>({provider_id,items:items.sort(compareModelsNewest)}));
  groups.sort((a,b)=>{
    const am=modelRecency(a.items[0]),bm=modelRecency(b.items[0]);
    if(am!=null||bm!=null){if(am==null)return 1;if(bm==null)return-1;if(am!==bm)return bm-am}
    return (a.items[0]?.provider_name||'').localeCompare(b.items[0]?.provider_name||'','zh-Hant');
  });
  return groups;
}
function 顯示日期(model){
  const t=modelRecency(model);if(t==null)return'版本排序';
  const exact=safeDate(model.released_at)!=null;
  return`${exact?'發布':'版本'} ${new Date(t).toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:exact?'2-digit':undefined})}`;
}
async function 取得資料(force=false){
  if(!force&&資料快取&&Date.now()-快取時間<15000)return 資料快取;
  const r=await fetch('/api/data',{cache:'no-store'});if(!r.ok)return 資料快取;
  資料快取=await r.json();快取時間=Date.now();return 資料快取;
}
function 建工具列(){
  const ph=document.querySelector('.catalog-panel>.ph');if(!ph||ph.querySelector('.catalog-tools'))return;
  const old=ph.querySelector(':scope>span');if(old)old.remove();
  const box=document.createElement('div');box.className='catalog-tools';
  box.innerHTML='<span class="catalog-sort-badge">最新優先</span><button type="button" data-catalog-expand>全部展開</button><button type="button" data-catalog-collapse>全部收合</button>';
  ph.appendChild(box);
  box.querySelector('[data-catalog-expand]').onclick=()=>{document.querySelectorAll('.catalog-provider-row').forEach(row=>展開集合.add(row.dataset.provider));saveExpanded();套用收合();};
  box.querySelector('[data-catalog-collapse]').onclick=()=>{展開集合.clear();saveExpanded();套用收合();};
}
function 套用收合(){
  const searching=Boolean(document.getElementById('搜尋')?.value?.trim());
  for(const header of document.querySelectorAll('.catalog-provider-row')){
    const id=header.dataset.provider,open=searching||展開集合.has(id);
    header.classList.toggle('is-open',open);
    header.querySelector('[data-provider-toggle]')?.setAttribute('aria-expanded',String(open));
    for(const row of document.querySelectorAll(`.catalog-model-row[data-provider="${CSS.escape(id)}"]`))row.hidden=!open;
  }
}
function 排程分組(forceData=false){
  clearTimeout(排程);排程=setTimeout(()=>分組(forceData).catch(console.error),40);
}
async function 分組(forceData=false){
  if(處理中)return;
  const body=document.getElementById('模型表');if(!body)return;
  const raw=[...body.children].filter(x=>x.tagName==='TR'&&!x.classList.contains('catalog-provider-row'));
  if(!raw.length)return;
  處理中=true;
  if(observer)observer.disconnect();
  try{
    const data=await 取得資料(forceData);if(!data)return;
    const byUid=new Map((data.models||[]).map(m=>[m.uid,m]));
    const rows=raw.map(row=>{
      const uid=row.querySelector('[data-select]')?.dataset.select;
      return{row,uid,model:byUid.get(uid)};
    }).filter(x=>x.model);
    const byProvider=new Map();
    for(const item of rows){const id=item.model.provider_id;if(!byProvider.has(id))byProvider.set(id,[]);byProvider.get(id).push(item)}
    const groups=[...byProvider.entries()].map(([id,items])=>({id,items:items.sort((a,b)=>compareModelsNewest(a.model,b.model))}));
    groups.sort((a,b)=>{
      const am=modelRecency(a.items[0].model),bm=modelRecency(b.items[0].model);
      if(am!=null||bm!=null){if(am==null)return 1;if(bm==null)return-1;if(am!==bm)return bm-am}
      return a.items[0].model.provider_name.localeCompare(b.items[0].model.provider_name,'zh-Hant');
    });
    body.replaceChildren();
    for(const group of groups){
      const latest=group.items[0].model,provider=latest.provider_name,header=document.createElement('tr');
      header.className='catalog-provider-row';header.dataset.provider=group.id;
      const mark=(provider.match(/[A-Za-z0-9]+/g)?.join('').slice(0,2)||provider.slice(0,2)).toUpperCase();
      header.innerHTML=`<td colspan="12"><button type="button" class="catalog-provider-toggle" data-provider-toggle aria-expanded="false"><span class="catalog-provider-mark">${escapeHtml(mark)}</span><span class="catalog-provider-copy"><strong>${escapeHtml(provider)}</strong><small>${escapeHtml(latest.provider_type||'模型供應商')} · ${group.items.length} 項</small></span><span class="catalog-provider-latest"><small>最新</small><b>${escapeHtml(latest.name_zh||latest.name||latest.model_id)}</b><em>${escapeHtml(顯示日期(latest))}</em></span><span class="catalog-provider-chevron"></span></button></td>`;
      header.querySelector('[data-provider-toggle]').onclick=()=>{展開集合.has(group.id)?展開集合.delete(group.id):展開集合.add(group.id);saveExpanded();套用收合();};
      body.appendChild(header);
      for(const item of group.items){item.row.classList.add('catalog-model-row');item.row.dataset.provider=group.id;body.appendChild(item.row)}
    }
    建工具列();套用收合();
    const version=document.getElementById('程式版本');if(version)version.textContent=`介面 v${CATALOG_UI_VERSION} · API v${data.meta?.app_version||'-'}`;
  }finally{
    處理中=false;
    if(observer)observer.observe(body,{childList:true});
  }
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function init(){
  const body=document.getElementById('模型表');if(!body)return;
  observer=new MutationObserver(()=>排程分組(false));observer.observe(body,{childList:true});
  document.getElementById('搜尋')?.addEventListener('input',()=>setTimeout(套用收合,0));
  document.getElementById('立即讀取')?.addEventListener('click',()=>{資料快取=null;setTimeout(()=>排程分組(true),700)});
  建工具列();排程分組(true);
}
if(typeof document!=='undefined')document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
