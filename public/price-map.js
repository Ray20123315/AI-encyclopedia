(()=>{
  const UI_VERSION='0.3.8';
  const colors=['#3ad8ff','#9b8cff','#34d399','#f6c85f','#fb7185','#60a5fa','#22d3ee','#c084fc','#4ade80','#f59e0b','#f87171','#38bdf8','#a78bfa','#2dd4bf','#facc15','#fb7185'];

  function comparable(model){
    const p=主價格(model);
    return !!(p&&p.currency==='USD'&&Number(p.input)>0&&Number(p.output)>0);
  }
  function plottedModels(){
    if(!狀態?.data)return{models:[],mode:'all'};
    const selected=[...狀態.已選]
      .map(uid=>狀態.data.models.find(m=>m.uid===uid))
      .filter(Boolean)
      .filter(comparable)
      .slice(0,6);
    if(selected.length)return{models:selected,mode:'selected'};
    return{models:可見模型().filter(comparable),mode:'all'};
  }
  function patchVersion(){
    const el=document.getElementById('程式版本');
    if(el&&狀態?.data)el.textContent=`介面 v${UI_VERSION} · API v${狀態.data.meta?.app_version||'-'}`;
  }
  function updateMode(models,mode){
    const el=document.getElementById('價格圖模式');if(!el)return;
    if(!models.length){el.textContent='目前沒有可比較的 USD 價格模型';return;}
    el.textContent=mode==='selected'
      ?`目前顯示已勾選 ${models.length} 個模型`
      :`預設顯示全部 ${models.length} 個可計價模型`;
  }
  function empty(){
    Plotly.react('價格圖',[],{
      paper_bgcolor:'transparent',plot_bgcolor:'transparent',height:520,
      margin:{l:24,r:18,t:14,b:24},font:{color:'#71879a'},
      annotations:[{text:'目前沒有可比較的 USD 輸入／輸出價格',showarrow:false,font:{size:13,color:'#71879a'}}],
      xaxis:{visible:false},yaxis:{visible:false},uirevision:'price-map-empty'
    },{displayModeBar:false,responsive:true,displaylogo:false,scrollZoom:true,doubleClick:'reset+autosize'});
  }
  function providerGroups(models){
    const groups=new Map();
    for(const model of models){
      const key=model.provider_name||model.provider_id||'其他';
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(model);
    }
    return [...groups.entries()];
  }
  function traceForProvider(name,models,index,mode){
    const x=[],y=[],text=[],customdata=[];
    for(const model of models){
      const p=主價格(model);if(!p)continue;
      x.push(Number(p.input));
      y.push(Number(p.output));
      text.push(model.name_zh||model.name||model.model_id);
      customdata.push([
        name,
        model.model_id,
        model.uid,
        model.context_window||null,
        model.benchmarks?.length||0,
        model.pricing?.length||0
      ]);
    }
    const selected=mode==='selected';
    return{
      type:'scattergl',mode:'markers',name,
      x,y,text,customdata,
      marker:{
        size:selected?13:8,
        color:colors[index%colors.length],
        opacity:selected?.94:.72,
        line:{width:selected?1.2:.55,color:'rgba(255,255,255,.46)'}
      },
      hovertemplate:'<b>%{text}</b><br>%{customdata[0]}<br>輸入 $%{x}/1M · 輸出 $%{y}/1M<br><span style="color:#8095a8">點擊查看詳細說明</span><extra></extra>'
    };
  }
  function revisionKey(models,mode){
    if(mode==='selected')return`price-map:selected:${models.map(m=>m.uid).sort().join('|')}`;
    return`price-map:all:${狀態.搜尋}|${狀態.來源}|${狀態.類型}|${狀態.幣別}|${狀態.評測}`;
  }
  function render(){
    if(!狀態?.data)return;
    patchVersion();
    const {models,mode}=plottedModels();updateMode(models,mode);
    if(!models.length){empty();return;}

    const traces=providerGroups(models).map(([name,items],i)=>traceForProvider(name,items,i,mode));
    const layout={
      paper_bgcolor:'transparent',plot_bgcolor:'transparent',height:520,
      margin:{l:72,r:28,t:42,b:66},
      font:{color:'#cbd8e5',family:'Inter, Noto Sans TC, system-ui',size:12},
      dragmode:'pan',clickmode:'event',hovermode:'closest',uirevision:revisionKey(models,mode),
      transition:{duration:160,easing:'cubic-in-out'},
      xaxis:{type:'log',title:{text:'輸入價格（USD / 1M tokens）',font:{size:11,color:'#8298aa'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,tickfont:{color:'#8195a7',size:10},fixedrange:false,automargin:true},
      yaxis:{type:'log',title:{text:'輸出價格（USD / 1M tokens）',font:{size:11,color:'#8298aa'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,tickfont:{color:'#8195a7',size:10},fixedrange:false,automargin:true},
      legend:{orientation:'h',x:0,y:1.12,font:{size:9.5,color:'#aebfcd'},bgcolor:'rgba(0,0,0,0)',itemclick:'toggle',itemdoubleclick:'toggleothers'},
      hoverlabel:{bgcolor:'#081019',bordercolor:'rgba(58,216,255,.3)',font:{color:'#eef8ff',size:11}},
      showlegend:traces.length>1
    };
    Plotly.react('價格圖',traces,layout,{
      displayModeBar:false,responsive:true,displaylogo:false,
      scrollZoom:true,doubleClick:'reset+autosize'
    });

    const el=document.getElementById('價格圖');
    if(el&&!el.dataset.priceMapClick){
      el.dataset.priceMapClick='1';
      el.on('plotly_click',ev=>{
        const uid=ev?.points?.[0]?.customdata?.[2];
        if(uid&&typeof 開詳情==='function')開詳情(uid);
      });
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
