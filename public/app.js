const UI_VERSION='0.3.1';
const 狀態={
  data:null,
  搜尋:'',來源:'all',類型:'all',幣別:'all',評測:'all',
  已選:new Set(),來源搜尋:'',
  圖表修訂:0,
  篩選動畫:null
};
const $=id=>document.getElementById(id);
const 數字=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:4});
const 金額=new Intl.NumberFormat('en-US',{maximumFractionDigits:4});
const 圖表設定={displayModeBar:false,responsive:true,displaylogo:false,scrollZoom:false};
const 圖色=['#3ad8ff','#9b8cff','#34d399','#f6c85f','#fb7185','#60a5fa','#f97316','#22d3ee','#c084fc','#4ade80'];

const 轉義=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const 狀態中文=s=>({active:'使用中',preview:'預覽',experimental:'實驗',retired:'已退役',restricted:'受限存取',synced:'已同步',partial:'部分同步',fallback:'後備資料',seeded_fallback:'初始後備',none:'未設定'})[s]||s||'-';
function 主價格(m){const t=m.pricing||[];return t.find(x=>x.currency==='USD'&&x.mode==='standard'&&x.schedule==='all_time'&&(x.context_min==null||x.context_min===0))||t.find(x=>x.currency==='USD'&&x.mode==='standard')||t.find(x=>x.currency==='USD')||t[0]||null}
function 價格(v,c){return v==null?'-':`${c||''} ${金額.format(v)}`}
function 脈絡(v){if(!v)return'-';if(v>=1e6)return`${數字.format(v/1e6)}M`;if(v>=1e3)return`${數字.format(v/1e3)}K`;return 數字.format(v)}
function 日期(v){if(!v)return'-';const d=new Date(v);return Number.isNaN(d.getTime())?'-':d.toLocaleString('zh-TW')}
function 可見模型(){
  if(!狀態.data)return[];
  return 狀態.data.models.filter(m=>{
    const q=狀態.搜尋.trim().toLowerCase();
    if(q&&!`${m.name} ${m.name_zh} ${m.model_id} ${m.provider_name} ${m.family}`.toLowerCase().includes(q))return false;
    if(狀態.來源!=='all'&&m.provider_id!==狀態.來源)return false;
    if(狀態.類型!=='all'&&m.provider_type!==狀態.類型)return false;
    if(狀態.幣別!=='all'&&!m.pricing.some(p=>p.currency===狀態.幣別))return false;
    if(狀態.評測==='has'&&!m.benchmarks?.length)return false;
    return true;
  });
}
function 延後圖表(fn){cancelAnimationFrame(狀態.篩選動畫);狀態.篩選動畫=requestAnimationFrame(()=>requestAnimationFrame(fn))}

function 畫摘要(){
  const d=狀態.data,healthy=d.providers.filter(p=>p.status==='synced').length;
  $('來源數').textContent=d.providers.length;
  $('模型數').textContent=d.models.length;
  $('有分數數').textContent=d.meta.benchmark_model_count??d.models.filter(m=>m.benchmarks?.length).length;
  $('評測總數').textContent=`${d.meta.benchmark_score_count??d.models.reduce((n,m)=>n+(m.benchmarks?.length||0),0)} 筆評測`;
  $('健康數').textContent=`${healthy}/${d.providers.length}`;
  $('可見數').textContent=可見模型().length;
  $('更新時間').textContent=d.meta.updated_at?`更新 ${日期(d.meta.updated_at)}`:'資料 -';
  $('程式版本').textContent=`介面 v${UI_VERSION} · API v${d.meta.app_version||'-'}`;
  const global=$('全域狀態');
  global.querySelector('b').textContent=狀態中文(d.meta.status);
  global.className='runtime-item '+(d.meta.status==='synced'?'ok':'warn');
}
function 建篩選(){
  const sel=$('來源篩選'),v=sel.value;
  sel.innerHTML='<option value="all">全部來源</option>'+狀態.data.providers.slice().sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant')).map(p=>`<option value="${轉義(p.id)}">${轉義(p.name)}</option>`).join('');
  sel.value=[...sel.options].some(o=>o.value===v)?v:'all';
}
function 畫目錄(){
  const body=$('模型表');body.innerHTML='';
  for(const m of 可見模型()){
    const p=主價格(m),checked=狀態.已選.has(m.uid),tr=document.createElement('tr');
    tr.innerHTML=`<td><input type="checkbox" data-select="${轉義(m.uid)}" ${checked?'checked':''}></td><td><b>${轉義(m.provider_name)}</b><br><span class="muted">${轉義(m.provider_type)}</span></td><td><span class="link model" data-history="${轉義(m.uid)}">${轉義(m.name_zh||m.name)}</span><br><span class="muted">${轉義(m.model_id)}</span></td><td>${狀態中文(m.status)}</td><td class="price-in">${價格(p?.input,p?.currency)}</td><td class="price-out">${價格(p?.output,p?.currency)}</td><td>${p?.currency||'-'}</td><td>${脈絡(m.context_window)}</td><td class="score">${m.benchmarks?.length||0}</td><td>${m.pricing?.length||0}</td><td><div class="caps">${(m.capabilities||[]).slice(0,6).map(c=>`<span class="cap">${轉義(c)}</span>`).join('')}</div></td><td><span class="link" data-detail="${轉義(m.uid)}">詳情</span></td>`;
    body.appendChild(tr);
  }
  document.querySelectorAll('[data-select]').forEach(x=>x.onchange=()=>切換勾選(x.dataset.select,x.checked));
  document.querySelectorAll('[data-detail]').forEach(x=>x.onclick=()=>開詳情(x.dataset.detail));
  document.querySelectorAll('[data-history]').forEach(x=>x.onclick=()=>載入歷史(x.dataset.history));
}
function 切換勾選(uid,on){
  if(on){if(狀態.已選.size>=6){alert('最多勾選 6 個模型。');畫目錄();return}狀態.已選.add(uid)}else 狀態.已選.delete(uid);
  畫勾選列();畫比較();畫目錄();
}
function 勾選模型(){return[...狀態.已選].map(uid=>狀態.data.models.find(m=>m.uid===uid)).filter(Boolean)}
function 畫勾選列(){
  $('已選數').textContent=狀態.已選.size;
  $('已選清單').innerHTML=勾選模型().map(m=>`<span class="chip">${轉義(m.name_zh||m.name)}<button data-remove="${轉義(m.uid)}" aria-label="移除">×</button></span>`).join('')||'<span class="muted">尚未勾選模型</span>';
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>切換勾選(b.dataset.remove,false));
}

function 圖表版型({xTitle='',yTitle='',log=false,legend=false,hover='closest',uirevision='chart'}={}){
  return{
    paper_bgcolor:'transparent',plot_bgcolor:'transparent',
    font:{color:'#cbd8e5',family:'Inter, Noto Sans TC, system-ui',size:11},
    margin:{l:56,r:18,t:18,b:50},
    hovermode:hover,
    dragmode:'pan',
    transition:{duration:260,easing:'cubic-in-out'},
    uirevision,
    xaxis:{title:{text:xTitle,font:{size:10,color:'#71879a'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,type:log?'log':'linear',fixedrange:false,tickfont:{color:'#71879a',size:10}},
    yaxis:{title:{text:yTitle,font:{size:10,color:'#71879a'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,type:log?'log':'linear',fixedrange:false,tickfont:{color:'#71879a',size:10}},
    legend:{orientation:'h',y:1.08,x:0,font:{size:10,color:'#91a6b8'},bgcolor:'rgba(0,0,0,0)'},
    showlegend:legend,
    hoverlabel:{bgcolor:'#081019',bordercolor:'rgba(58,216,255,.35)',font:{color:'#eef8ff',size:11},namelength:40}
  };
}
function 平滑畫圖(id,traces,layout,config={}){
  狀態.圖表修訂+=1;
  layout.datarevision=狀態.圖表修訂;
  return Plotly.react(id,traces,layout,{...圖表設定,...config});
}
function 畫價格圖(){
  const ms=可見模型().map(m=>[m,主價格(m)]).filter(([,p])=>p?.currency==='USD'&&p.input>0&&p.output>0),groups=new Map();
  for(const[m,p]of ms){if(!groups.has(m.provider_id))groups.set(m.provider_id,[]);groups.get(m.provider_id).push([m,p])}
  let ci=0;
  const traces=[...groups.values()].map(arr=>({
    type:'scattergl',mode:'markers',name:arr[0][0].provider_name,
    x:arr.map(x=>x[1].input),y:arr.map(x=>x[1].output),text:arr.map(x=>x[0].name_zh||x[0].name),
    customdata:arr.map(x=>[x[0].benchmarks?.length||0,x[0].model_id]),
    marker:{size:9,color:圖色[ci++%圖色.length],opacity:.82,line:{width:.7,color:'rgba(255,255,255,.22)'}},
    hovertemplate:'<b>%{text}</b><br><span style="color:#7dd3fc">輸入</span> $%{x}/M<br><span style="color:#c4b5fd">輸出</span> $%{y}/M<br>自動評測 %{customdata[0]} 筆<br><span style="color:#71879a">%{customdata[1]}</span><extra></extra>'
  }));
  const layout=圖表版型({xTitle:'輸入 USD / 1M tokens',yTitle:'輸出 USD / 1M tokens',log:true,legend:true,uirevision:'價格地圖'});
  layout.dragmode='zoom';
  平滑畫圖('價格圖',traces,layout);
}
async function 載入歷史(uid){
  const m=狀態.data.models.find(x=>x.uid===uid);if(!m)return;
  $('歷史標題').textContent=m.name_zh||m.name;
  try{
    const r=await fetch(`/api/history?uid=${encodeURIComponent(uid)}&limit=500`,{cache:'no-store'}),d=await r.json();
    const x=d.points.map(p=>p.timestamp),input=d.points.map(p=>p.input),output=d.points.map(p=>p.output);
    const traces=[
      {x,y:input,name:'輸入',type:'scatter',mode:'lines+markers',connectgaps:true,line:{color:'#3ad8ff',shape:'spline',smoothing:1.08,simplify:false,width:2.5},marker:{size:5,color:'#3ad8ff',line:{width:1,color:'#082f49'}},fill:'tozeroy',fillcolor:'rgba(58,216,255,.055)',hovertemplate:'輸入 $%{y}/M<extra></extra>'},
      {x,y:output,name:'輸出',type:'scatter',mode:'lines+markers',connectgaps:true,line:{color:'#9b8cff',shape:'spline',smoothing:1.08,simplify:false,width:2.5},marker:{size:5,color:'#9b8cff',line:{width:1,color:'#2e1065'}},hovertemplate:'輸出 $%{y}/M<extra></extra>'}
    ];
    const layout=圖表版型({yTitle:'USD / 1M tokens',legend:true,hover:'x unified',uirevision:`歷史:${uid}`});
    layout.dragmode='zoom';
    layout.xaxis={gridcolor:'rgba(148,163,184,.065)',zeroline:false,tickfont:{color:'#71879a',size:10},rangeslider:{visible:true,thickness:.085,bgcolor:'rgba(7,11,17,.6)',bordercolor:'rgba(148,163,184,.10)',borderwidth:1},rangeselector:{x:.01,y:1.12,xanchor:'left',yanchor:'top',bgcolor:'rgba(8,13,20,.86)',activecolor:'rgba(58,216,255,.18)',bordercolor:'rgba(148,163,184,.12)',borderwidth:1,font:{size:9,color:'#90a6b9'},buttons:[{count:7,label:'7D',step:'day',stepmode:'backward'},{count:30,label:'30D',step:'day',stepmode:'backward'},{count:90,label:'90D',step:'day',stepmode:'backward'},{step:'all',label:'ALL'}]}};
    layout.yaxis={...layout.yaxis,automargin:true};
    await 平滑畫圖('歷史圖',traces,layout,{scrollZoom:true});
  }catch(e){$('歷史標題').textContent='歷史資料讀取失敗';console.error(e)}
}
function 空歷史(){
  平滑畫圖('歷史圖',[],{paper_bgcolor:'transparent',plot_bgcolor:'transparent',font:{color:'#71879a'},margin:{l:20,r:20,t:10,b:20},annotations:[{text:'點選模型名稱查看價格歷史',showarrow:false,font:{size:12,color:'#61778a'}}],xaxis:{visible:false},yaxis:{visible:false},uirevision:'空歷史'});
}
function 評測選項(models){const count=new Map(),names=new Map();for(const m of models)for(const b of m.benchmarks||[]){count.set(b.benchmark_id,(count.get(b.benchmark_id)||0)+1);names.set(b.benchmark_id,b.benchmark_name)}return[...count.entries()].sort((a,b)=>b[1]-a[1]).map(([id,n])=>({id,n,name:names.get(id)}))}
function 畫比較(){
  const ms=勾選模型(),sel=$('共同評測'),old=sel.value,opts=評測選項(ms);
  sel.innerHTML=opts.length?opts.map(o=>`<option value="${轉義(o.id)}">${轉義(o.name)}（${o.n}/${ms.length}）</option>`).join(''):'<option value="">沒有共同自動評測</option>';
  if([...sel.options].some(o=>o.value===old))sel.value=old;
  const bid=sel.value,points=ms.map(m=>({m,b:(m.benchmarks||[]).find(b=>b.benchmark_id===bid)})).filter(x=>x.b);
  const trace=points.length?[{type:'bar',x:points.map(x=>x.m.name_zh||x.m.name),y:points.map(x=>x.b.score),text:points.map(x=>`${x.b.score}${x.b.unit||''}`),textposition:'auto',marker:{color:points.map((_,i)=>圖色[i%圖色.length]),line:{color:'rgba(255,255,255,.14)',width:1}},hovertemplate:'<b>%{x}</b><br>%{y}<extra></extra>'}]:[];
  const layout=圖表版型({yTitle:points[0]?.b?.unit||'分數',uirevision:`評測:${bid||'none'}`});
  layout.bargap=.38;layout.dragmode=false;
  平滑畫圖('評測圖',trace,layout,{staticPlot:false});
  $('評測來源提示').textContent=points.length?`來源：${[...new Set(points.map(x=>x.b.source_publisher||'官方'))].join('、')} · 自動同步`:'請先勾選至少兩個有共同 Benchmark 的模型。';
  const rows=[['來源／平台',...ms.map(m=>m.provider_name)],['模型',...ms.map(m=>m.name_zh||m.name)],['狀態',...ms.map(m=>狀態中文(m.status))],['脈絡上限',...ms.map(m=>脈絡(m.context_window))],['輸入價格',...ms.map(m=>{const p=主價格(m);return價格(p?.input,p?.currency)})],['輸出價格',...ms.map(m=>{const p=主價格(m);return價格(p?.output,p?.currency)})],['自動評測數',...ms.map(m=>String(m.benchmarks?.length||0))]];
  $('比較表').innerHTML=ms.length?`<thead><tr><th>項目</th>${ms.map(m=>`<th>${轉義(m.name_zh||m.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td><b>${轉義(r[0])}</b></td>${r.slice(1).map(v=>`<td>${轉義(v)}</td>`).join('')}</tr>`).join('')}</tbody>`:'<tbody><tr><td class="muted">請先勾選 2–6 個模型。</td></tr></tbody>';
  計算成本();
}
function 計算成本(){
  const ms=勾選模型(),tin=Math.max(0,Number($('成本輸入').value)||0),tout=Math.max(0,Number($('成本輸出').value)||0),n=Math.max(1,Number($('成本次數').value)||1);
  $('成本結果').innerHTML=ms.map(m=>{const p=主價格(m);if(!p||p.input==null||p.output==null)return`<div class="result"><b>${轉義(m.name_zh||m.name)}</b><span class="muted">缺少可比較價格</span></div>`;const cost=(tin/1e6*p.input+tout/1e6*p.output)*n;return`<div class="result"><b>${轉義(m.name_zh||m.name)}</b><strong>${轉義(p.currency)} ${數字.format(cost)}</strong><div class="muted">${n} 次工作負載</div></div>`}).join('')||'<span class="muted">勾選模型後可試算。</span>';
}
function 開詳情(uid){
  const m=狀態.data.models.find(x=>x.uid===uid);if(!m)return;
  $('詳情標題').textContent=`${m.name_zh||m.name} — 詳細資料`;
  const tiers=(m.pricing||[]).map((p,i)=>`<div class="tier"><b>價格 tier ${i+1}</b><div class="tier-grid"><div>幣別<br>${轉義(p.currency)}</div><div>模式<br>${轉義(p.mode)}</div><div>區域<br>${轉義(p.region)}</div><div>輸入<br>${價格(p.input,p.currency)}</div><div>輸出<br>${價格(p.output,p.currency)}</div></div></div>`).join('')||'<div class="muted">目前沒有可驗證價格。</div>';
  const benches=(m.benchmarks||[]).map(b=>`<div class="benchmark-card"><div class="score-big">${轉義(b.score)}${轉義(b.unit||'')}</div><b>${轉義(b.benchmark_name)}</b><div class="muted">${轉義(b.category)}${b.setting?` · ${轉義(b.setting)}`:''}</div><div class="muted">${轉義(b.source_publisher||'官方')} · ${轉義(b.source_type)} · 抓取 ${轉義(日期(b.observed_at))}</div>${b.source_url?`<a class="link" href="${轉義(b.source_url)}" target="_blank" rel="noopener">開啟評測來源</a>`:''}</div>`).join('')||'<div class="muted">目前沒有從官方文字來源自動取得的 Benchmark 分數。</div>';
  $('詳情內容').innerHTML=`<div class="detail-grid"><div class="detail-card">供應商<br><b>${轉義(m.provider_name)}</b></div><div class="detail-card">模型 ID<br><b>${轉義(m.model_id)}</b></div><div class="detail-card">脈絡<br><b>${脈絡(m.context_window)}</b></div><div class="detail-card">自動評測<br><b>${m.benchmarks?.length||0} 筆</b></div></div><h3>價格</h3>${tiers}<h3>自動 Benchmark</h3>${benches}`;
  $('詳情視窗').showModal();
}
function 畫來源(){
  const q=狀態.來源搜尋.trim().toLowerCase();
  const providers=狀態.data.providers.slice().sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant')).filter(p=>!q||`${p.name} ${p.description_zh} ${Object.values(p.source_status||{}).map(s=>`${s.title} ${s.resolved_url||s.configured_url||''}`).join(' ')}`.toLowerCase().includes(q));
  $('來源中心').innerHTML=providers.map((p,i)=>{
    const statuses=Object.values(p.source_status||{}),ok=statuses.filter(s=>s.ok).length,total=statuses.length;
    const rows=statuses.map(s=>{const u=Array.isArray(s.configured_url)?s.configured_url[0]:(s.resolved_url||s.configured_url);return`<div class="source-row"><div><b>${轉義(s.title||'來源')}</b><span class="url">${轉義(u||'')}</span></div><div class="source-meta"><span class="status-pill"><span class="dot ${s.ok?'synced':'fallback'}"></span>${s.ok?'可存取':'失敗'}</span>${s.score_count!=null?`<div>${s.score_count} 筆評測</div>`:''}${s.error?`<div>${轉義(s.error)}</div>`:''}${u?`<div class="source-actions"><a href="${轉義(u)}" target="_blank" rel="noopener">開啟來源</a></div>`:''}</div></div>`}).join('')||'<div class="muted">尚無同步來源狀態。</div>';
    return`<details class="source-group" ${i===0?'open':''}><summary><div class="source-name"><div class="provider-mark">${轉義(p.name.slice(0,2).toUpperCase())}</div><div class="source-title"><strong>${轉義(p.name)}</strong><small>${轉義(p.type)} · ${轉義(狀態中文(p.status))} · ${p.model_count||0} 項</small></div></div><div class="source-summary"><span>${ok}/${total} 來源可用</span><span>評測：${轉義(狀態中文(p.benchmark_status))}</span></div><span class="source-chevron" aria-hidden="true"></span></summary><div class="source-body"><div class="source-description">${轉義(p.description_zh||'')}</div>${rows}<div class="note">模型資料最後成功：${轉義(日期(p.last_success_at))} · Benchmark 最後成功：${轉義(日期(p.benchmark_last_success_at))}</div></div></details>`;
  }).join('')||'<div class="muted">找不到符合的來源。</div>';
}
function 切頁(name){
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  for(const id of['catalog','compare','sources'])$(`頁-${id}`).classList.toggle('hidden',id!==name);
  if(name==='compare')畫比較();if(name==='sources')畫來源();
  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
function 全畫(){畫摘要();建篩選();畫目錄();畫勾選列();延後圖表(()=>{畫價格圖();畫比較()});畫來源()}
function 套用篩選(){畫摘要();畫目錄();延後圖表(畫價格圖)}
function 綁定(){
  $('搜尋').oninput=e=>{狀態.搜尋=e.target.value;套用篩選()};
  $('來源篩選').onchange=e=>{狀態.來源=e.target.value;套用篩選()};
  $('類型篩選').onchange=e=>{狀態.類型=e.target.value;套用篩選()};
  $('幣別篩選').onchange=e=>{狀態.幣別=e.target.value;套用篩選()};
  $('評測篩選').onchange=e=>{狀態.評測=e.target.value;套用篩選()};
  $('清除勾選').onclick=()=>{狀態.已選.clear();畫勾選列();畫比較();畫目錄()};
  $('共同評測').onchange=畫比較;$('計算成本').onclick=計算成本;$('關閉詳情').onclick=()=>$('詳情視窗').close();
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>切頁(b.dataset.tab));
  $('來源搜尋').oninput=e=>{狀態.來源搜尋=e.target.value;畫來源()};
  $('全部展開').onclick=()=>document.querySelectorAll('.source-group').forEach(d=>d.open=true);
  $('全部收合').onclick=()=>document.querySelectorAll('.source-group').forEach(d=>d.open=false);
  $('立即讀取').onclick=()=>載入資料();
}
async function 載入資料(){
  const r=await fetch('/api/data',{cache:'no-store'});if(!r.ok)throw new Error(`API ${r.status}`);
  狀態.data=await r.json();全畫();
}
async function 啟動(){
  綁定();空歷史();
  try{await 載入資料()}catch(e){const g=$('全域狀態');g.querySelector('b').textContent='資料載入失敗';g.className='runtime-item warn';console.error(e)}
  setInterval(()=>載入資料().catch(()=>{}),60000);
}
啟動();