
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
  CF_API_TOKEN?: string;
  CF_ZONE_ID?: string;
  CF_PURGE_URL?: string;
  CF_PURGE_URL_DEV?: string;
  AD_EXCLUSION_KV?: KVNamespace;
  AD_EXCLUSION_KV_DEV?: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { target } = await context.request.json();
    
    const token = context.env.CF_API_TOKEN;
    const zoneId = context.env.CF_ZONE_ID;
    
    // Dohvaćamo URL i čistimo ga od mogućih razmaka
    let targetUrl = target === 'dev' 
      ? context.env.CF_PURGE_URL_DEV 
      : context.env.CF_PURGE_URL;

    targetUrl = targetUrl?.trim();

    if (!token || !zoneId || !targetUrl) {
      const errorMsg = `Konfiguracijska greška: Nedostaje CF_API_TOKEN, CF_ZONE_ID ili URL za ${target || 'prod'} okruženje.`;
      return new Response(JSON.stringify({ success: false, message: errorMsg }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [targetUrl]
      })
    });

    const result = await cfResponse.json();

    if (!cfResponse.ok || !result.success) {
        return new Response(JSON.stringify({ 
            success: false, 
            message: `Cloudflare API Error: ${result.errors?.[0]?.message || 'Nepoznata greška'}`,
            details: result
        }), {
            status: cfResponse.status,
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ success: true, target, url: targetUrl }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
