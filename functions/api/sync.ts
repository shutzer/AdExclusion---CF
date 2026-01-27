
// Cloudflare environment types
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
  AD_EXCLUSION_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const data = await context.env.AD_EXCLUSION_KV.get("rules_data");
  return new Response(data || JSON.stringify({ rules: [], script: "" }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    const { target, rules, script } = body;
    
    // storageKey određuje cilj (PROD ili DEV)
    const storageKey = target === 'dev' ? "rules_data_dev" : "rules_data";
    
    // Dohvaćamo postojeće stanje da ne izgubimo podatke koji nisu u payloadu
    const currentDataRaw = await context.env.AD_EXCLUSION_KV.get(storageKey);
    const currentData = currentDataRaw ? JSON.parse(currentDataRaw) : { rules: [], script: "" };
    
    // Kreiramo novi objekt - ako je script undefined (kod autosave-a), zadržavamo stari script
    const updatedData = {
      rules: rules || currentData.rules,
      script: script !== undefined ? script : currentData.script
    };

    await context.env.AD_EXCLUSION_KV.put(storageKey, JSON.stringify(updatedData));
    
    // Ako objavljujemo na DEV, želimo i Workspace (rules_data) sinkronizirati s tim pravilima
    // kako bi UI ostao konzistentan, ali NE pregažavamo produkcijsku skriptu!
    if (target === 'dev') {
       const workspaceDataRaw = await context.env.AD_EXCLUSION_KV.get("rules_data");
       const workspaceData = workspaceDataRaw ? JSON.parse(workspaceDataRaw) : { rules: [], script: "" };
       
       await context.env.AD_EXCLUSION_KV.put("rules_data", JSON.stringify({
         ...workspaceData,
         rules: rules || workspaceData.rules
       }));
    }
    
    return new Response(JSON.stringify({ success: true, environment: target || 'prod' }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
