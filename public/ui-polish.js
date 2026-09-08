(()=>{
  const UI_VERSION='0.3.8';
  const el=document.getElementById('程式版本');
  if(!el)return;
  let busy=false;
  const apply=()=>{
    if(busy)return;
    const m=el.textContent.match(/API v([^\s·]+)/),api=m?.[1]||'-';
    const next=`介面 v${UI_VERSION} · API v${api}`;
    if(el.textContent!==next){busy=true;el.textContent=next;busy=false;}
  };
  new MutationObserver(apply).observe(el,{childList:true,characterData:true,subtree:true});
  window.addEventListener('load',apply,{once:true});
  setTimeout(apply,0);
})();
