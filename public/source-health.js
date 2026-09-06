(()=>{
  const UI_VERSION='0.3.2';
  let cache=null,lastFetch=0,timer=null;
  const 狀態文字=s=>({synced:'已同步',partial:'部分同步',fallback:'後備資料',seeded_fallback:'初始後備',none:'未設定'})[s]||s||'-';
  async function data(){
    if(cache&&Date.now()-lastFetch<5000)return cache;
    const r=await fetch('/api/data',{cache:'no-store'});if(!r.ok)return cache;
    cache=await r.json();lastFetch=Date.now();return cache;
  }
  async function apply(){
    const d=await data();if(!d)return;
    const version=document.getElementById('程式版本');if(version)version.textContent=`介面 v${UI_VERSION} · API v${d.meta?.app_version||'-'}`;
    const byName=new Map((d.providers||[]).map(p=>[p.name,p]));
    for(const group of document.querySelectorAll('.source-group')){
      const name=group.querySelector('.source-title strong')?.textContent?.trim(),p=byName.get(name);if(!p)continue;
      const statuses=Object.entries(p.source_status||{}),normal=statuses.filter(([k])=>!k.startsWith('benchmark:')).map(([,v])=>v),bench=statuses.filter(([k])=>k.startsWith('benchmark:')).map(([,v])=>v);
      const dataOk=p.source_success_count??normal.filter(s=>s.ok).length,dataTotal=p.source_total_count??normal.length;
      const benchOk=p.benchmark_source_success_count??bench.filter(s=>s.ok).length,benchTotal=p.benchmark_source_total_count??bench.length;
      const target=group.querySelector('.source-summary');if(!target)continue;
      const benchText=benchTotal?`評測 ${benchOk}/${benchTotal} · ${狀態文字(p.benchmark_status)}`:'評測未設定';
      const html=`<span>資料 ${dataOk}/${dataTotal}</span><span>${benchText}</span>`;
      if(target.innerHTML!==html)target.innerHTML=html;
    }
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>apply().catch(()=>{}),60)}
  const root=document.getElementById('來源中心');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('load',schedule,{once:true});
  setInterval(()=>{cache=null;schedule()},60000);
})();
