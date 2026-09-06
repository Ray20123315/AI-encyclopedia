(()=>{
  const UI_VERSION='0.3.4';
  const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:6});
  const compact=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2});
  const providerColors=['#3ad8ff','#9b8cff','#34d399','#f6c85f','#fb7185','#60a5fa','#f97316','#22d3ee','#c084fc','#4ade80'];
  const cfg={input:100000,output:10000,requests:100,limit:20,selectedOnly:false};

  function estimated(model){
    const p=主價格(model);
    if(!p||p.currency!=='USD'||p.input==null||p.output==null)return null;
    const perRequest=(cfg.input/1e6)*Number(p.input)+(cfg.output/1e6)*Number(p.output);
    if(!Number.isFinite(perRequest))return null;
    return{model,price:p,perRequest,total:perRequest*cfg.requests};
  }
  function candidates(){
    let models=可見模型();
    if(cfg.selectedOnly&&狀態.已選?.size)models=models.filter(m=>狀態.已選.has(m.uid));
    return models.map(estimated).filter(Boolean).sort((a,b)=>a.total-b.total||(a.model.name_zh||a.model.name).localeCompare(b.model.name_zh||b.model.name,'zh-Hant'));
  }
  function providerColorMap(rows){
    const map=new Map();let i=0;
    for(const r of rows){if(!map.has(r.model.provider_id))map.set(r.model.provider_id,providerColors[i++%providerColors.length]);}
    return map;
  }
  function updateSummary(all){
    const count=document.getElementById('排行模型數'),cheapest=document.getElementById('排行最便宜'),median=document.getElementById('排行中位數');
    if(count)count.textContent=`${all.length} 個可計價模型`;
    if(!all.length){if(cheapest)cheapest.textContent='最便宜：-';if(median)median.textContent='中位數：-';return;}
    if(cheapest)cheapest.textContent=`最便宜：${all[0].model.name_zh||all[0].model.name} · ${money.format(all[0].total)}`;
    const mid=all[Math.floor(all.length/2)];if(median)median.textContent=`中位數：${money.format(mid.total)}`;
  }
  function patchVersion(){const el=document.getElementById('程式版本');if(el&&狀態?.data)el.textContent=`介面 v${UI_VERSION} · API v${狀態.data.meta?.app_version||'-'}`;}
  function emptyChart(text){
    patchVersion();
    Plotly.react('價格圖',[],{paper_bgcolor:'transparent',plot_bgcolor:'transparent',margin:{l:20,r:20,t:10,b:20},font:{color:'#71879a'},annotations:[{text,showarrow:false,font:{size:12,color:'#71879a'}}],xaxis:{visible:false},yaxis:{visible:false},uirevision:'cost-ranking-empty'},{displayModeBar:false,responsive:true,displaylogo:false});
  }
  function render(){
    if(!狀態?.data)return;
    patchVersion();
    const all=candidates();updateSummary(all);
    if(!all.length){emptyChart(cfg.selectedOnly?'已勾選模型中沒有可比較的 USD 輸入／輸出價格':'目前篩選結果沒有可比較的 USD 輸入／輸出價格');return;}
    const top=all.slice(0,Math.max(5,cfg.limit));
    const rows=[...top].reverse();
    const colors=providerColorMap(top);
    const positions=rows.map((_,i)=>i);
    const labels=rows.map(r=>`${r.model.name_zh||r.model.name} · ${r.model.provider_name}`);
    const trace={
      type:'bar',orientation:'h',
      x:rows.map(r=>r.total),y:positions,
      text:rows.map(r=>money.format(r.total)),textposition:'outside',cliponaxis:false,
      marker:{color:rows.map(r=>colors.get(r.model.provider_id)),opacity:.86,line:{width:.6,color:'rgba(255,255,255,.18)'}},
      customdata:rows.map(r=>[r.model.name_zh||r.model.name,r.model.provider_name,r.model.model_id,r.price.input,r.price.output,r.perRequest,r.model.benchmarks?.length||0,r.model.uid]),
      hovertemplate:'<b>%{customdata[0]}</b><br>%{customdata[1]}<br>總成本 %{x:$,.6f}<br>單次 %{customdata[5]:$,.6f}<br>輸入 $%{customdata[3]}/M · 輸出 $%{customdata[4]}/M<br>自動評測 %{customdata[6]} 筆<br><span style="color:#71879a">%{customdata[2]}</span><extra></extra>'
    };
    const height=Math.max(430,Math.min(820,top.length*28+120));
    const layout={
      paper_bgcolor:'transparent',plot_bgcolor:'transparent',height,
      margin:{l:210,r:100,t:14,b:54},font:{color:'#cbd8e5',family:'Inter, Noto Sans TC, system-ui',size:11},bargap:.34,
      transition:{duration:260,easing:'cubic-in-out'},uirevision:'工作負載成本排行榜',
      xaxis:{title:{text:`估算總成本（USD） · ${compact.format(cfg.requests)} 次請求`,font:{size:10,color:'#71879a'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,tickprefix:'$',tickfont:{color:'#71879a',size:10},rangemode:'tozero'},
      yaxis:{showgrid:false,tickmode:'array',tickvals:positions,ticktext:labels,tickfont:{color:'#b9cad8',size:10},automargin:true},
      hoverlabel:{bgcolor:'#081019',bordercolor:'rgba(58,216,255,.35)',font:{color:'#eef8ff',size:11}},showlegend:false
    };
    Plotly.react('價格圖',[trace],layout,{displayModeBar:false,responsive:true,displaylogo:false,scrollZoom:false});
    const el=document.getElementById('價格圖');
    if(el&&!el.dataset.costClickBound){
      el.dataset.costClickBound='1';
      el.on('plotly_click',ev=>{const uid=ev?.points?.[0]?.customdata?.[7];if(uid&&typeof 開詳情==='function')開詳情(uid);});
    }
  }
  function numberValue(id,fallback,min=0){const el=document.getElementById(id),n=Number(el?.value);return Number.isFinite(n)&&n>=min?n:fallback;}
  function bind(){
    const panel=document.querySelector('.price-map-panel');if(!panel)return;
    panel.querySelector('.kicker').textContent='COST RANKING';panel.querySelector('h2').textContent='工作負載成本排行榜';
    const hint=panel.querySelector('.ph>span');if(hint)hint.textContent='依目前篩選 · 最便宜優先';
    const rerender=()=>{cfg.input=numberValue('排行輸入',100000);cfg.output=numberValue('排行輸出',10000);cfg.requests=numberValue('排行次數',100,1);cfg.limit=numberValue('排行筆數',20,5);cfg.selectedOnly=!!document.getElementById('排行已選')?.checked;render();};
    for(const id of ['排行輸入','排行輸出','排行次數','排行筆數','排行已選'])document.getElementById(id)?.addEventListener(id==='排行筆數'||id==='排行已選'?'change':'input',()=>requestAnimationFrame(rerender));
    try{畫價格圖=render;}catch{}
    let tries=0;const wait=setInterval(()=>{tries++;if(狀態?.data){clearInterval(wait);rerender();}else if(tries>100)clearInterval(wait);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
