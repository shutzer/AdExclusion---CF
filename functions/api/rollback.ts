
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface Env {
  AD_EXCLUSION_KV?: KVNamespace;
  AD_EXCLUSION_KV_STAGE?: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.AD_EXCLUSION_KV || context.env.AD_EXCLUSION_KV_STAGE;
    
    if (!db) {
      throw new Error("KV Storage not bound");
    }

    const { snapshotId, user } = await context.request.json();
    
    // 1. Fetch the snapshot
    const snapshotRaw = await db.get(snapshotId);
    if (!snapshotRaw) {
      return new Response(JSON.stringify({ success: false, message: "Snapshot nije pronađen." }), { status: 404 });
    }

    const rules = JSON.parse(snapshotRaw);

    // 2. Update current workspace
    const currentDataRaw = await db.get("rules_data");
    const currentData = currentDataRaw ? JSON.parse(currentDataRaw) : { rules: [], script: "" };
    
    const updatedData = { ...currentData, rules };
    await db.put("rules_data", JSON.stringify(updatedData));

    // 3. Log the rollback
    const auditLogsRaw = await db.get("audit_log");
    const auditLogs = auditLogsRaw ? JSON.parse(auditLogsRaw) : [];
    
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      user: user || 'admin',
      action: 'ROLLBACK',
      details: `Vraćena verzija pravila (Snapshot: ${snapshotId.substring(0, 15)}...)`,
      snapshotId
    };

    await db.put("audit_log", JSON.stringify([newEntry, ...auditLogs].slice(0, 100)));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
