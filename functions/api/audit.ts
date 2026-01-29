
interface KVNamespace {
  get(key: string): Promise<string | null>;
}

type PagesFunction<Env = any> = (context: {
  env: Env;
}) => Response | Promise<Response>;

interface Env {
  AD_EXCLUSION_KV?: KVNamespace;
  AD_EXCLUSION_KV_STAGE?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.AD_EXCLUSION_KV || context.env.AD_EXCLUSION_KV_STAGE;
  
  if (!db) {
    return new Response(JSON.stringify({ logs: [], error: "KV not bound" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await db.get("audit_log");
  return new Response(JSON.stringify({ logs: data ? JSON.parse(data) : [] }), {
    headers: { "Content-Type": "application/json" },
  });
};
