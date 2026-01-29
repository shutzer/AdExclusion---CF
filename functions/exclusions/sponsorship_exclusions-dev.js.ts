
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  [key: string]: any;
}) => Response | Promise<Response>;

interface Env {
  AD_EXCLUSION_KV?: KVNamespace;
  AD_EXCLUSION_KV_STAGE?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.AD_EXCLUSION_KV || context.env.AD_EXCLUSION_KV_STAGE;

  const fallback = "/* AdExclusion (DEV): No active rules found at this time */";
  
  const headers = {
    "Content-Type": "application/javascript; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    "X-AdEx-Env": "development",
    "X-Content-Type-Options": "nosniff"
  };

  if (!db) return new Response(fallback, { headers });

  const data = await db.get("rules_data_dev");
  const now = Date.now();
  
  const croFormatter = new Intl.DateTimeFormat('hr-HR', {
    timeZone: 'Europe/Zagreb',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const croTime = croFormatter.format(new Date(now));
  
  if (!data) return new Response(fallback, { headers });

  const parsed = JSON.parse(data);
  
  const activeRules = (parsed.rules || []).filter((r: any) => {
    if (!r.isActive) return false;
    if (r.startDate && now < r.startDate) return false;
    if (r.endDate && now > r.endDate) return false;
    return true;
  });

  if (activeRules.length === 0) return new Response(`/* AdExclusion (DEV): No active rules at this moment (${croTime}) */`, { headers });

  const config = activeRules.map((r: any) => ({
    name: r.name,
    conds: r.conditions,
    lOp: r.logicalOperator,
    sel: r.targetElementSelector,
    act: r.action || 'hide',
    rae: !!r.respectAdsEnabled,
    js: r.customJs ? r.customJs : undefined
  }));

  const configJson = JSON.stringify(config, null, 2);

  const script = `/** AdExclusion (DEV) [Zagreb Time: ${croTime}] **/!function(){try{const rules=${configJson},targeting=page_meta?.third_party_apps?.ntAds?.targeting;if(!targeting)return;const inject=(sel,act)=>{const s=document.createElement("style"),disp=act==="show"?"block":"none",vis=act==="show"?"visible":"hidden";s.innerHTML=sel+"{display:"+disp+"!important;visibility:"+vis+"!important;}",document.head.appendChild(s)},run=(code,ctx,sel)=>{try{new Function("ctx","selector",code)(ctx,sel)}catch(e){}};rules.forEach(rule=>{if(rule.rae&&targeting.ads_enabled!==true)return;const res=rule.conds.map(c=>{const pvRaw=targeting[c.targetKey],pvs=Array.isArray(pvRaw)?pvRaw.map(v=>String(v).toLowerCase().trim()):[String(pvRaw||"").toLowerCase().trim()],rvs=c.value.split(",").map(v=>v.trim().toLowerCase());switch(c.operator){case "equals":return rvs.some(rv=>pvs.includes(rv));case "not_equals":return rvs.every(rv=>!pvs.includes(rv));case "contains":return rvs.some(rv=>pvs.some(pv=>pv.indexOf(rv)>-1));case "not_contains":return rvs.every(rv=>pvs.every(pv=>pv.indexOf(rv)===-1));}return false});if(rule.lOp==="OR"?res.some(r=>r):res.every(r=>r)){inject(rule.sel,rule.act);if(rule.js){const ex=()=>run(rule.js,targeting,rule.sel);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ex);else ex()}}})}catch(e){}}();`;

  return new Response(script, { headers });
};
