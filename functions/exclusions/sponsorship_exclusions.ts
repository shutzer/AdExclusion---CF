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
  const dataRaw = await context.env.AD_EXCLUSION_KV.get("rules_data");
  const data = dataRaw ? JSON.parse(dataRaw) : { script: "/* AdExclusion: No rules found */" };

  return new Response(data.script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  });
};