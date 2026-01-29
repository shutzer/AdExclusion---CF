
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
  
  if (!db) {
    return new Response(JSON.stringify({ error: "KV Storage not bound" }), { status: 500 });
  }

  const data = await db.get("rules_data");
  return new Response(data || JSON.stringify({ rules: [], script: "" }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.AD_EXCLUSION_KV || context.env.AD_EXCLUSION_KV_STAGE;
    
    if (!db) {
      throw new Error("KV Storage not bound (Check Cloudflare Dashboard bindings)");
    }

    const body = await context.request.json();
    const { target, rules, script, user } = body;
    const storageKey = target === 'dev' ? "rules_data_dev" : "rules_data";
    
    // 1. Get current data for comparison
    const oldDataRaw = await db.get(storageKey);
    const oldData = oldDataRaw ? JSON.parse(oldDataRaw) : { rules: [], script: "" };
    
    // 2. Prepare updated data
    const updatedData = {
      rules: rules || oldData.rules,
      script: script !== undefined ? script : oldData.script
    };

    // 3. Save to KV
    await db.put(storageKey, JSON.stringify(updatedData));
    
    // 4. Handle audit logging and snapshots
    const snapshotId = `snapshot_${Date.now()}`;
    await db.put(snapshotId, JSON.stringify(updatedData.rules));

    let action = "UPDATE";
    let details = `Promjena pravila na ${target.toUpperCase()}`;

    if (script) {
      action = target === 'dev' ? "PUBLISH_DEV" : "PUBLISH_PROD";
      details = `Objavljena skripta i ${rules.length} pravila na ${target.toUpperCase()}`;
    } else if (rules.length > oldData.rules.length) {
      action = "CREATE";
      const newRule = rules[0];
      details = `Dodano novo pravilo: "${newRule.name}"`;
    } else if (rules.length < oldData.rules.length) {
      action = "DELETE";
      details = `Obrisano pravilo`;
    } else {
      // Check for toggle or simple update
      const changedIndex = rules.findIndex((r, i) => r.isActive !== oldData.rules[i]?.isActive);
      if (changedIndex !== -1) {
        action = "TOGGLE";
        details = `Pravilo "${rules[changedIndex].name}" je ${rules[changedIndex].isActive ? 'uključeno' : 'isključeno'}`;
      }
    }

    const auditLogsRaw = await db.get("audit_log");
    const auditLogs = auditLogsRaw ? JSON.parse(auditLogsRaw) : [];
    
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      user: user || 'system',
      action,
      details,
      snapshotId
    };

    // Keep last 100 logs
    const updatedLogs = [newEntry, ...auditLogs].slice(0, 100);
    await db.put("audit_log", JSON.stringify(updatedLogs));

    // DEV specific logic
    if (target === 'dev') {
       const workspaceDataRaw = await db.get("rules_data");
       const workspaceData = workspaceDataRaw ? JSON.parse(workspaceDataRaw) : { rules: [], script: "" };
       await db.put("rules_data", JSON.stringify({
         ...workspaceData,
         rules: rules || workspaceData.rules
       }));
    }
    
    return new Response(JSON.stringify({ success: true, environment: target }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
