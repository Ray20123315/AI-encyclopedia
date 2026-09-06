import { DurableObject } from 'cloudflare:workers';
import { PROVIDERS } from './providers/index.js';
import { DATA_SCHEMA_VERSION, normalizeModel } from './schema.js';
import { clone, runProviderSync, mergeProviderResult, snapshotFingerprint, historyPoint } from './core.js';

const JSON_HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff'
};
function json(data,init={}){const headers=new Headers(init.headers||{});for(const[k,v]of Object.entries(JSON_HEADERS))headers.set(k,v);return new Response(JSON.stringify(data),{...init,headers});}
function nowIso(){return new Date().toISOString();}
function secondsSince(iso){if(!iso)return Infinity;const t=Date.parse(iso);return Number.isFinite(t)?(Date.now()-t)/1000:Infinity;}

function seedProvider(p){return{id:p.id,name:p.name,homepage:p.homepage,type:p.type||'模型供應商',description_zh:p.description_zh||'',status:'seeded_fallback',last_attempt_at:null,last_success_at:null,source_status:{},parse_error:null,model_count:p.seed_models?.length||0};}
function seedState(){
 const now=nowIso();const providers=PROVIDERS.map(seedProvider);const models=PROVIDERS.flatMap(p=>(p.seed_models||[]).map(m=>normalizeModel(p,{...m,synced_at:now})));
 return{meta:{title:'AI 模型百科 — 模型、價格、評測與來源',schema_version:DATA_SCHEMA_VERSION,generated_at:now,updated_at:now,status:'seeded_fallback',provider_count:providers.length,model_count:models.length,note:'價格與評測保留原始條件，不把不同區域、脈絡、思考模式、快取、尖離峰或不同 benchmark 強行合成單一總分。'},providers,models};
}
function migrateState(old){
 const fresh=seedState();if(!old||typeof old!=='object')return fresh;
 const oldProviders=new Map((old.providers||[]).map(p=>[p.id,p]));
 fresh.providers=fresh.providers.map(p=>({...p,...(oldProviders.get(p.id)||{}),name:p.name,homepage:p.homepage,type:p.type,description_zh:p.description_zh}));
 const known=new Set(fresh.models.map(m=>m.uid));
 for(const m of old.models||[]){
   if(known.has(m.uid))continue;
   const provider=PROVIDERS.find(p=>p.id===m.provider_id);if(!provider)continue;
   try{fresh.models.push(normalizeModel(provider,m));known.add(`${m.provider_id}:${m.model_id}`);}catch{}
 }
 fresh.models.sort((a,b)=>a.provider_name.localeCompare(b.provider_name,'zh-Hant')||a.name.localeCompare(b.name,'zh-Hant'));
 fresh.meta={...fresh.meta,generated_at:old.meta?.generated_at||fresh.meta.generated_at,updated_at:nowIso(),status:'partial',migration_note:`已升級至資料結構 v${DATA_SCHEMA_VERSION}；已知模型採新版驗證種子，下一次同步後更新官方資料。`};
 fresh.meta.provider_count=fresh.providers.length;fresh.meta.model_count=fresh.models.length;return fresh;
}

export class EncyclopediaState extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.env=env;this.ctx.blockConcurrencyWhile(async()=>{
  this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL,updated_at TEXT NOT NULL);CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT,ts TEXT NOT NULL,fingerprint TEXT NOT NULL,json TEXT NOT NULL);CREATE INDEX IF NOT EXISTS idx_history_ts ON history(ts);`);
  const row=this.ctx.storage.sql.exec('SELECT json FROM state WHERE id=1').toArray()[0];
  if(!row){this.#writeState(seedState());return;}
  try{const parsed=JSON.parse(row.json);if(Number(parsed?.meta?.schema_version||0)<DATA_SCHEMA_VERSION)this.#writeState(migrateState(parsed));}catch{this.#writeState(seedState());}
 });}
 #readState(){const row=this.ctx.storage.sql.exec('SELECT json FROM state WHERE id=1').toArray()[0];if(!row)return seedState();try{return JSON.parse(row.json);}catch{return seedState();}}
 #writeState(data){this.ctx.storage.sql.exec(`INSERT INTO state(id,json,updated_at)VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,updated_at=excluded.updated_at`,JSON.stringify(data),nowIso());}
 #writeHistory(data,fingerprint){const latest=this.ctx.storage.sql.exec('SELECT ts,fingerprint FROM history ORDER BY id DESC LIMIT 1').toArray()[0];if(latest&&latest.fingerprint===fingerprint&&secondsSince(latest.ts)<86400)return false;const compact={meta:{updated_at:data.meta.updated_at},points:data.models.map(historyPoint)};this.ctx.storage.sql.exec('INSERT INTO history(ts,fingerprint,json)VALUES(?,?,?)',data.meta.updated_at,fingerprint,JSON.stringify(compact));const maxRows=Math.max(100,Number(this.env.HISTORY_MAX_ROWS||1500));this.ctx.storage.sql.exec(`DELETE FROM history WHERE id NOT IN(SELECT id FROM history ORDER BY id DESC LIMIT ?)`,maxRows);return true;}
 async getData(){return this.#readState();}
 async getHealth(){const data=this.#readState();return{ok:['synced','partial'].includes(data.meta.status),status:data.meta.status,updated_at:data.meta.updated_at,provider_count:data.meta.provider_count,model_count:data.meta.model_count,providers:data.providers.map(p=>({id:p.id,name:p.name,type:p.type,status:p.status,last_success_at:p.last_success_at,model_count:p.model_count,parse_error:p.parse_error,source_status:p.source_status})),history_rows:this.ctx.storage.sql.exec('SELECT COUNT(*) AS n FROM history').one().n};}
 async getHistory(uid,limit=500){const n=Math.min(Math.max(Number(limit)||500,1),1500);const rows=this.ctx.storage.sql.exec('SELECT ts,json FROM history ORDER BY id DESC LIMIT ?',n).toArray().reverse();const points=[];for(const row of rows){try{const snap=JSON.parse(row.json);const point=snap.points.find(p=>p.uid===uid);if(point)points.push({timestamp:row.ts,...point});}catch{}}return{uid,points};}
 async refresh(force=false){const current=this.#readState();const cooldown=Math.max(60,Number(this.env.SYNC_COOLDOWN_SECONDS||300));if(!force&&secondsSince(current.meta.updated_at)<cooldown)return{ok:true,skipped:true,reason:'cooldown',data:current};
  const results=await Promise.all(PROVIDERS.map(async provider=>{try{return await runProviderSync(provider);}catch(err){return{provider:{...seedProvider(provider),status:'fallback',last_attempt_at:nowIso(),parse_error:String(err?.message||err)},models:(provider.seed_models||[]).map(m=>normalizeModel(provider,m))};}}));
  let next=clone(current);for(const result of results)next=mergeProviderResult(next,result);next.meta.title='AI 模型百科 — 模型、價格、評測與來源';next.meta.updated_at=nowIso();next.meta.provider_count=next.providers.length;next.meta.model_count=next.models.length;next.meta.status=next.providers.some(p=>p.status==='fallback')?'partial':'synced';this.#writeState(next);this.#writeHistory(next,snapshotFingerprint(next));return{ok:true,skipped:false,data:next};
 }
}
function stateStub(env){return env.STATE.get(env.STATE.idFromName('global'));}
function unauthorized(){return json({error:'未授權'},{status:401});}
export default{
 async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/api/')){const stub=stateStub(env);if(url.pathname==='/api/data'&&request.method==='GET')return json(await stub.getData());if(url.pathname==='/api/health'&&request.method==='GET')return json(await stub.getHealth());if(url.pathname==='/api/history'&&request.method==='GET'){const uid=url.searchParams.get('uid');if(!uid)return json({error:'缺少 uid 參數'},{status:400});return json(await stub.getHistory(uid,url.searchParams.get('limit')||500));}if(url.pathname==='/api/refresh'&&request.method==='POST'){if(env.ADMIN_TOKEN){const auth=request.headers.get('authorization')||'';if(auth!==`Bearer ${env.ADMIN_TOKEN}`)return unauthorized();}return json(await stub.refresh(true));}return json({error:'找不到 API 路徑'},{status:404});}return env.ASSETS.fetch(request);},
 async scheduled(_event,env,ctx){ctx.waitUntil(stateStub(env).refresh(false));}
};
