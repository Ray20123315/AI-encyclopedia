(()=>{
  const UI_VERSION='0.3.6';
  const colors=['#3ad8ff','#9b8cff','#34d399','#f6c85f','#fb7185','#60a5fa'];
  const cfg={axis:'input',max:1000000,input:100000,output:10000,requests:100};
  const defaults={input:1000000,output:200000,requests:1000};

  function numeric(v,fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback;}
  function comparableTiers(model){
    const tiers=(model.pricing||[]).filter(t=>t.currency==='USD'&&t.input!=null&&t.output!=null);
    const exact=tiers.filter(t=>(t.mode==='standard'||!t.mode)&&(t.schedule==='all_time'||!t.schedule));
    return exact.length?exact:tiers;
  }
  function tierFor(model,inputTokens,outputTokens){
    const context=Math.max(0,numeric(inputTokens))+Math.max(0,numeric(outputTokens));
    const tiers=comparableTiers(model);
    const matches=tiers.filter(t=>{
      const min=t.context_min==null?0:numeric(t.context_min,0);
      const max=t.context_max==null?Infinity:numeric(t.context_max,Infinity);
      return context>=min&&context<=max;
    }).sort((a,b)=>numeric(b.context_min,0)-numeric(a.context_min,0));
    return matches[0]||tiers[0]||null;
  }
  function pointCost(model,inputTokens,outputTokens,requests){
    const tier=tierFor(model,inputTokens,outputTokens);
    if(!tier)return null;
    const total=((Math.max(0,inputTokens)/1e6)*numeric(tier.input)+(Math.max(0,outputTokens)/1e6)*numeric(tier.output))*Math.max(1,requests);
    return Number.isFinite(total)?{total,tier}:null;
  }
  function selectedModels(){
    if(!狀態?.data)return[];
    const selected=[...狀態.已選].map(uid=>狀態.data.models.find(m=>m.uid===uid)).filter(Boolean).filter(m=>comparableTiers(m).length);
    if(selected.length)return selected.slice(0,6);
    return 可見模型().filter(m=>comparableTiers(m).length).map(m=>({m,c:pointCost(m,cfg.input,cfg.output,cfg.requests)?.total??Infinity})).sort((a,b)=>a.c-b.c).slice(0,6).map(x=>x.m);
  }
  function xValues(){
    const max=Math.max(1,numeric(cfg.max,1));
    const count=60,values=[];
    for(let i=0;i<=count;i++){
      let v=max*i/count;
      if(cfg.axis==='requests')v=Math.max(1,Math.round(v));else v=Math.round(v);
      if(values.at(-1)!==v)values.push(v);
    }
    return values;
  }
  function axisLabel(){return cfg.axis==='input'?'每次輸入 token':cfg.axis==='output'?'每次輸出 token':'請求次數';}
  function workloadAt(x){
    return{
      input:cfg.axis==='input'?x:cfg.input,
      output:cfg.axis==='output'?x:cfg.output,
      requests:cfg.axis==='requests'?x:cfg.requests
    };
  }
  function patchVersion(){const el=document.getElementById('程式版本');if(el&&狀態?.data)el.textContent=`介面 v${UI_VERSION} · API v${狀態.data.meta?.app_version||'-'}`;}
  function syncControls(){
    const input=document.getElementById('曲線輸入'),output=document.getElementById('曲線輸出'),requests=document.getElementById('曲線次數');
    if(input)input.disabled=cfg.axis==='input';if(output)output.disabled=cfg.axis==='output';if(requests)requests.disabled=cfg.axis==='requests';
    const mode=document.getElementById('曲線模式');
    if(mode){const selected=狀態?.已選?.size||0;mode.textContent=selected?`比較已勾選 ${Math.min(selected,6)} 個模型`:'未勾選時自動顯示目前篩選中成本最低 6 個';}
  }
  function renderEmpty(text){
    Plotly.react('價格圖',[],{paper_bgcolor:'transparent',plot_bgcolor:'transparent',height:520,margin:{l:30,r:20,t:12,b:38},font:{color:'#71879a'},annotations:[{text,showarrow:false,font:{size:13,color:'#71879a'}}],xaxis:{visible:false},yaxis:{visible:false},uirevision:'cost-curve-empty'},{displayModeBar:false,responsive:true,displaylogo:false});
  }
  function render(){
    if(!狀態?.data)return;
    patchVersion();syncControls();
    const models=selectedModels();if(!models.length){renderEmpty('目前沒有可比較的 USD 輸入／輸出價格');return;}
    const xs=xValues();
    const traces=models.map((model,i)=>{
      const ys=[],meta=[];
      for(const x of xs){
        const w=workloadAt(x),result=pointCost(model,w.input,w.output,w.requests);
        ys.push(result?.total??null);
        meta.push([model.provider_name,model.model_id,w.input,w.output,w.requests,result?.tier?.input??null,result?.tier?.output??null,model.uid]);
      }
      return{
        type:'scatter',mode:'lines',name:model.name_zh||model.name,
        x:xs,y:ys,connectgaps:false,
        line:{width:3,color:colors[i%colors.length],shape:'linear',simplify:false},
        opacity:.96,
        customdata:meta,
        hovertemplate:'<b>%{fullData.name}</b><br>總成本 %{y:$,.6f}<br>輸入 %{customdata[2]:,.0f} tokens · 輸出 %{customdata[3]:,.0f} tokens<br>請求 %{customdata[4]:,.0f} 次<br>費率 $%{customdata[5]}/M → $%{customdata[6]}/M<br><span style="color:#71879a">%{customdata[0]} · %{customdata[1]}</span><extra></extra>'
      };
    });
    const layout={
      paper_bgcolor:'transparent',plot_bgcolor:'transparent',height:520,
      margin:{l:70,r:26,t:26,b:62},
      font:{color:'#cbd8e5',family:'Inter, Noto Sans TC, system-ui',size:12},
      transition:{duration:260,easing:'cubic-in-out'},uirevision:'cost-curves',
      hovermode:'x unified',hoverdistance:-1,
      legend:{orientation:'h',x:0,y:1.12,font:{size:11,color:'#b9cad8'},bgcolor:'rgba(0,0,0,0)',itemclick:'toggle',itemdoubleclick:'toggleothers'},
      xaxis:{title:{text:axisLabel(),font:{size:11,color:'#8298aa'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,tickfont:{color:'#8195a7',size:10},showspikes:true,spikemode:'across',spikesnap:'cursor',spikedash:'dot',spikecolor:'rgba(125,211,252,.35)',spikethickness:1,automargin:true},
      yaxis:{title:{text:'估算總成本（USD）',font:{size:11,color:'#8298aa'}},gridcolor:'rgba(148,163,184,.075)',zeroline:false,tickprefix:'$',tickfont:{color:'#8195a7',size:10},rangemode:'tozero',automargin:true},
      hoverlabel:{bgcolor:'#081019',bordercolor:'rgba(58,216,255,.28)',font:{color:'#eef8ff',size:11}},
      showlegend:true,dragmode:'pan'
    };
    Plotly.react('價格圖',traces,layout,{displayModeBar:false,responsive:true,displaylogo:false,scrollZoom:true});
    const el=document.getElementById('價格圖');
    if(el&&!el.dataset.costCurveClick){el.dataset.costCurveClick='1';el.on('plotly_click',ev=>{const uid=ev?.points?.[0]?.customdata?.[7];if(uid&&typeof 開詳情==='function')開詳情(uid);});}
  }
  function read(){
    cfg.axis=document.getElementById('曲線軸')?.value||'input';
    cfg.max=Math.max(1,numeric(document.getElementById('曲線上限')?.value,defaults[cfg.axis]));
    cfg.input=Math.max(0,numeric(document.getElementById('曲線輸入')?.value,100000));
    cfg.output=Math.max(0,numeric(document.getElementById('曲線輸出')?.value,10000));
    cfg.requests=Math.max(1,numeric(document.getElementById('曲線次數')?.value,100));
  }
  function bind(){
    const axis=document.getElementById('曲線軸'),max=document.getElementById('曲線上限');if(!axis||!max)return;
    let lastAxis=axis.value;
    axis.addEventListener('change',()=>{const previousDefault=defaults[lastAxis];if(numeric(max.value)===previousDefault)max.value=defaults[axis.value];lastAxis=axis.value;read();requestAnimationFrame(render);});
    for(const id of ['曲線上限','曲線輸入','曲線輸出','曲線次數'])document.getElementById(id)?.addEventListener('input',()=>{read();requestAnimationFrame(render);});
    read();syncControls();
    try{畫價格圖=render;}catch{}
    const originalToggle=window.切換勾選;
    if(typeof originalToggle==='function'&&!originalToggle.__costCurveWrapped){const wrapped=function(...args){const r=originalToggle.apply(this,args);requestAnimationFrame(render);return r;};wrapped.__costCurveWrapped=true;window.切換勾選=wrapped;}
    let tries=0;const wait=setInterval(()=>{tries++;if(狀態?.data){clearInterval(wait);render();}else if(tries>100)clearInterval(wait);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
