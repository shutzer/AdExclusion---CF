
interface KVNamespace {
  get(key: string): Promise<string | null>;
}

type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  [key: string]: any;
}) => Response | Promise<Response>;

interface Env {
  AD_EXCLUSION_KV?: KVNamespace;
  AD_EXCLUSION_KV_STAGE?: KVNamespace;
  CF_API_TOKEN?: string;
  CF_ZONE_ID?: string;
  CF_PURGE_URL?: string;
  CF_PURGE_URL_DEV?: string;
  CRON_SECRET?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // 1. SECURITY CHECK
    const authHeader = context.request.headers.get('x-cron-secret');
    const configuredSecret = context.env.CRON_SECRET;

    if (!configuredSecret) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Server Misconfiguration: CRON_SECRET missing in Environment Variables" 
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (authHeader !== configuredSecret) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Unauthorized: Invalid Cron Secret" 
      }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. SETUP ENVIRONMENT
    const url = new URL(context.request.url);
    const paramTarget = url.searchParams.get('target');
    
    // Određujemo koju BAZU čitamo (Dev/Stage ili Prod)
    const target = (paramTarget === 'dev' || paramTarget === 'stage') ? 'dev' : 'prod';
    const db = target === 'dev' ? context.env.AD_EXCLUSION_KV_STAGE : context.env.AD_EXCLUSION_KV;
    
    // DEFINIRAMO LISTU ZA PURGE: Uzimamo OBA URL-a ako postoje
    // Zahtjev: "I oba se moraju probusiti ako ima objavljenih schedule promjena na bilo kojem."
    const urlsToPurge: string[] = [];
    if (context.env.CF_PURGE_URL) urlsToPurge.push(context.env.CF_PURGE_URL.trim());
    if (context.env.CF_PURGE_URL_DEV) urlsToPurge.push(context.env.CF_PURGE_URL_DEV.trim());

    const zoneId = context.env.CF_ZONE_ID;
    const apiToken = context.env.CF_API_TOKEN;

    // Provjera konfiguracije
    const missingKeys: string[] = [];
    if (!db) missingKeys.push(target === 'dev' ? 'AD_EXCLUSION_KV_STAGE' : 'AD_EXCLUSION_KV');
    if (!zoneId) missingKeys.push('CF_ZONE_ID');
    if (!apiToken) missingKeys.push('CF_API_TOKEN');
    if (urlsToPurge.length === 0) missingKeys.push('CF_PURGE_URL OR CF_PURGE_URL_DEV');

    if (missingKeys.length > 0) {
      console.error(`[SCHEDULER] Missing configuration for target '${target}':`, missingKeys);
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Missing configuration variables", 
        target,
        missingKeys 
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. FETCH RULES FROM DB
    const storageKey = target === 'dev' ? "rules_data_dev" : "rules_data";
    const dataRaw = await db!.get(storageKey);
    
    if (!dataRaw) {
      return new Response(JSON.stringify({ success: true, message: "No rules in database", action: "none" }), { 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const { rules } = JSON.parse(dataRaw);
    const now = Date.now();
    
    // 4. DETECTION LOGIC
    const TIME_WINDOW = 90 * 1000; // 90 sekundi

    const transitioningRules = rules.filter((r: any) => {
      if (!r.isActive) return false;

      let isStarting = false;
      let isEnding = false;

      if (r.startDate) {
        const diff = Math.abs(now - r.startDate);
        if (diff <= TIME_WINDOW) isStarting = true;
      }

      if (r.endDate) {
        const diff = Math.abs(now - r.endDate);
        if (diff <= TIME_WINDOW) isEnding = true;
      }

      return isStarting || isEnding;
    });

    if (transitioningRules.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "⏭️ No rules transitioning at this time.", 
        serverTime: new Date().toISOString(),
        checkedRules: rules.length
      }), { 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 5. EXECUTE PURGE (BOTH URLS)
    console.log(`[SCHEDULER] Triggering purge due to rules: ${transitioningRules.map((r:any) => r.name).join(', ')}`);
    console.log(`[SCHEDULER] Purging URLs:`, urlsToPurge);

    const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: urlsToPurge // Šaljemo array svih URL-ova
      })
    });

    const purgeResult = await cfResponse.json();

    return new Response(JSON.stringify({
      success: true,
      action: "✅ PURGE_TRIGGERED",
      reason: "Rule Transition Detected",
      targetDB: target,
      purgedUrls: urlsToPurge,
      transitioningRules: transitioningRules.map((r:any) => ({ name: r.name, start: r.startDate, end: r.endDate })),
      cfResult: purgeResult
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
