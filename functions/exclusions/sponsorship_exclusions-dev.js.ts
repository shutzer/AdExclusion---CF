
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
  const dataRaw = context.env.AD_EXCLUSION_KV;
  const data = await dataRaw.get("rules_data_dev");
  const fallback = "/* AdExclusion (DEV): No rules found */";
  
  const headers = {
    "Content-Type": "application/javascript; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "CDN-Cache-Control": "no-store", // Cloudflare Edge bypass
    "Cloudflare-CDN-Cache-Control": "no-store", // Explicit CF bypass
    "X-AdEx-Env": "development",
    "X-Content-Type-Options": "nosniff"
  };

  if (!data) {
    return new Response(fallback, { headers });
  }

  try {
    const parsed = JSON.parse(data);
    
    let output = (parsed.script && typeof parsed.script === 'string' && parsed.script.trim().length > 0) 
      ? parsed.script 
      : fallback;

    if (output !== fallback && output.includes("const rules = [];")) {
      output = fallback;
    }

    return new Response(output, { headers });
  } catch (err) {
    return new Response(`/* AdExclusion (DEV) Error: ${err.message} */`, {
      headers: { ...headers, "Content-Type": "application/javascript" }
    });
  }
};
