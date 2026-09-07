(()=>{
  const UI_VERSION='0.3.7';
  const colors=['#3ad8ff','#9b8cff','#34d399','#f6c85f','#fb7185','#60a5fa'];

  function comparable(model){
    const p=主價格(model);
    return !!(p&&p.currency==='USD'&&Number(p.input)>0&&Number(p.output)>0);
  }
  function releaseScore(model){
    if(model.released_at){const t=Date.parse(model.released_at);if(Number.isFinite(t))return t;}
    const text=String(model.model_id||model.name||'');
    const full=text.match(/(20\d{2})[-_/]?(0[1-9]|1[0-2])[-_/]?([0-2]\d|3[01])/);
    if(full){const t=Date.parse(`${full[1]}-${full[2]}-${full[3]}T00:00:00Z`);if(Number.isFinite(t))return t;}
    const short=text.match(/(?:^|\D)(\d{2})(0[1-9]|1[0-2])(?:\D|$)/);
    if(short){const year=2000+Number(short[1]);return Date.UTC(year,Number(short[2])-1,1);}
    return 0;
  }
  function newestComparable(){
    return 可見模型().filter(comparable).slice().sort((a,b)=>{
      const d=releaseScore(b)-releaseScore(a);if(d)return d;
      return String(b.name_zh||b.name||b.model_id).localeCompare(String(a.name_zh||a.name||a.model_id),'zh-Hant',{numeric:true,sensitivity:'base'});
    })[0]||null;
  }
  function plottedModels(){
    if(!狀態?.data)return[];
    const selected=[...狀態.已選].map(uid=>狀態.data.models.find(m=>m.uid===uid)).filter(Boolean).filter(comparable).slice(0,6);
    if(selected.length)return selected;
    const fallback=newestComparable();
    return fallback?[fallback]:[];
  }
  function patchVersion(){
    const el=document.getElementById('程式版本');
    if(el&&狀態?.data)el.textContent=`介面 v${UI_VERSION} · API v${狀態.data.meta?.app_version||'-'}`;
  }
  function updateMode(models){
    const el=document.getElementById('價格圖模式');if(!el)return;
    if(!models.length){el.textContent='目前沒有可比較的 USD 價格模型';return;}
    if(狀態.已選.size)el.textContent=`目前顯示已勾選 ${models.length} 個模型`;
    else el.textContent=`預設顯示：${models[0].name_zh||models[0].name}`;
  }
  function empty(){
    Plotly.react('價格圖',[],{
      paper_bgcolor:'transparent',plot_bgcolor:'transparent',height:520,
      margin:{l:24,r:18,t:14,b:24},font:{color:'#71879a'},
      annotations:[{text:'目前沒有可比較的 USD 輸入／輸出價格',showarrow:false,font:{size:13,color:'#71879a'}}],
      xaxis:{visible:false},yaxis:{visible:false},uirevision:'price-map-empty'
    },{displayModeBar:false,responsive:true,displaylogo:false,scrollZoom:true,doubleClick:'reset+autosize'});
  }
  function render(){
    if(!狀態?.data)return;
    patchVersion();
    const models=plottedModels();updateMode(models);
    if(!models.length){empty();return;}
    const traces=models.map((model,i)=>{
      const p=主價格(model);
      return{
        type:'scatter',mode:'markers+text',name:model.name_zh||model.name,
        x:[Number(p.input)],y:[Number(p.output)],
        text:[model.name_zh||model.name],textposition:'top center',
        textfont:{size:11,color:colors[i%colors.length]},
        marker:{size:15,color:colors[i%colors.length],opacity:.94,line:{width:1.5,color:'rgba(255,255,255,.62)'}},
        customdata:[[model.provider_name,model.model_id,model.benchmarks?.length||0,model.context_window||null,model.pricing?.length||0,model.uid]],
        hovertemplate:'<b>%{text}</b><br>%{customdata[0]}<br>輸入 $%{x}/1M tokens<br>輸出 $%{y}/1M tokens<br>脈絡 %{customdata[3]:,.0f} tokens<br>自動評測 %{customdata[2]} 筆 · 價格 tier %{customdata[4]}<br><span style="color:#71879a">%{customdata[1]}</span><extra></extra>'
      };
    });
    const key=models.map(m=>m.uid).sort().join('|');
    const layout={
      paper_bgcolor:'transparent',plot_bgcolor:'transparent',height:520,
      margin:{l:72,r:28,t:42,b:66},
      font:{color:'#cbd8e5',family:'Inter, Noto Sans TC, system-ui',size:12},
      dragmode:'pan',hovermode:'closest',uirevision:`price-map:${key}`,
      transition:{duration:220,easing:'cubic-in-out'},
      xaxis:{type:'log',title:{text:'輸入價格（USD / 1M tokens）',font:{size:11,color:'#8298aa'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,tickfont:{color:'#8195a7',size:10},fixedrange:false,automargin:true},
      yaxis:{type:'log',title:{text:'輸出價格（USD / 1M tokens）',font:{size:11,color:'#8298aa'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,tickfont:{color:'#8195a7',size:10},fixedrange:false,automargin:true},
      legend:{orientation:'h',x:0,y:1.12,font:{size:10,color:'#aebfcd'},bgcolor:'rgba(0,0,0,0)',itemclick:'toggle',itemdoubleclick:'toggleothers'},
      hoverlabel:{bgcolor:'#081019',bordercolor:'rgba(58,216,255,.3)',font:{color:'#eef8ff',size:11}},
      showlegend:models.length>1
    };
    Plotly.react('價格圖',traces,layout,{
      displayModeBar:false,responsive:true,displaylogo:false,
      scrollZoom:true,doubleClick:'reset+autosize'
    });
    const el=document.getElementById('價格圖');
    if(el&&!el.dataset.priceMapClick){
      el.dataset.priceMapClick='1';
      el.on('plotly_click',ev=>{const uid=ev?.points?.[0]?.customdata?.[5];if(uid&&typeof 開詳情==='function')開詳情(uid);});
    }
  }
  function resetView(){
    Plotly.relayout('價格圖',{'xaxis.autorange':true,'yaxis.autorange':true});
  }
  function bind(){
    document.getElementById('價格圖重設')?.addEventListener('click',resetView);
    try{畫價格圖=render;}catch{window.畫價格圖=render;}
    const selectedCount=document.getElementById('已選數');
    if(selectedCount)new MutationObserver(()=>requestAnimationFrame(render)).observe(selectedCount,{childList:true,characterData:true,subtree:true});
    let tries=0;const wait=setInterval(()=>{tries++;if(狀態?.data){clearInterval(wait);render();}else if(tries>100)clearInterval(wait);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
