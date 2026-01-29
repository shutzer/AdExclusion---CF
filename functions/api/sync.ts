
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

// Helper za usporedbu objekata
function isRuleDifferent(r1: any, r2: any): boolean {
  const normalize = (r: any) => JSON.stringify({ ...r, isActive: true, createdAt: 0 });
  return normalize(r1) !== normalize(r2);
}

// Helper za formatiranje datuma u logovima
function formatDate(ts: number | undefined): string {
  if (!ts) return '';
  return new Intl.DateTimeFormat('hr-HR', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(ts));
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const isProd = !!context.env.AD_EXCLUSION_KV;
  const db = context.env.AD_EXCLUSION_KV || context.env.AD_EXCLUSION_KV_STAGE;
  const bindingName = isProd ? "AD_EXCLUSION_KV (PROD)" : "AD_EXCLUSION_KV_STAGE (STAGE)";
  
  if (!db) {
    return new Response(JSON.stringify({ 
      rules: [], 
      error: `KV Binding Missing. Checked: ${bindingName}` 
    }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  let data = await db.get("rules_data");
  if (!data && !isProd) {
    const devData = await db.get("rules_data_dev");
    if (devData) data = devData;
  }

  return new Response(data || JSON.stringify({ rules: [], script: "" }), {
    headers: { 
      "Content-Type": "application/json",
      "X-AdEx-Source": isProd ? "PROD" : "STAGE",
      "X-KV-Binding": bindingName
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.AD_EXCLUSION_KV || context.env.AD_EXCLUSION_KV_STAGE;
    
    if (!db) {
      throw new Error("KV Storage not bound. Please Redeploy.");
    }

    const body = await context.request.json();
    const { target, rules, script, user } = body;
    const storageKey = target === 'dev' ? "rules_data_dev" : "rules_data";
    
    // 1. Get current data
    const oldDataRaw = await db.get(storageKey);
    const oldData = oldDataRaw ? JSON.parse(oldDataRaw) : { rules: [], script: "" };
    const oldRules = oldData.rules || [];

    // 2. Prepare updated data
    const updatedData = {
      rules: rules || oldRules,
      script: script !== undefined ? script : oldData.script
    };

    // 3. Save to KV
    await db.put(storageKey, JSON.stringify(updatedData));
    
    // 4. Handle audit logging
    const snapshotId = `snapshot_${Date.now()}`;
    await db.put(snapshotId, JSON.stringify(updatedData.rules));

    // --- DETALJNA DETEKCIJA PROMJENA ---
    let action = "UPDATE";
    let details = "";

    if (script) {
      // --- LOGIKA ZA OBJAVU (PUBLISH) ---
      action = target === 'dev' ? "PUBLISH_DEV" : "PUBLISH_PROD";
      
      const activeRules = (rules || []).filter((r: any) => r.isActive);
      const now = Date.now();
      
      const immediateRules = activeRules.filter((r: any) => !r.startDate || r.startDate <= now);
      const scheduledRules = activeRules.filter((r: any) => r.startDate && r.startDate > now);
      
      let lines: string[] = [];
      
      if (immediateRules.length > 0) {
        const names = immediateRules.map((r: any) => r.name).join(', ');
        lines.push(`✅ Odmah aktivno (${immediateRules.length}): ${names}.`);
      }
      
      if (scheduledRules.length > 0) {
        const scheduledDetails = scheduledRules.map((r: any) => `${r.name} (start: ${formatDate(r.startDate)})`).join(', ');
        lines.push(`⏰ Zakazano (${scheduledRules.length}): ${scheduledDetails}.`);
      }
      
      if (lines.length === 0) {
        details = `Objavljena prazna skripta (nema aktivnih pravila).`;
      } else {
        details = lines.join(' ');
      }

    } else {
      // --- LOGIKA ZA WORKSPACE IZMJENE (CREATE/UPDATE/DELETE) ---
      const newIds = new Set(rules.map((r: any) => r.id));
      const oldIds = new Set(oldRules.map((r: any) => r.id));

      const addedRule = rules.find((r: any) => !oldIds.has(r.id));
      const deletedRule = oldRules.find((r: any) => !newIds.has(r.id));
      const modifiedRule = rules.find((r: any) => {
        const old = oldRules.find((or: any) => or.id === r.id);
        return old && isRuleDifferent(r, old);
      });
      const toggledRule = rules.find((r: any) => {
        const old = oldRules.find((or: any) => or.id === r.id);
        return old && r.isActive !== old.isActive && !isRuleDifferent(r, old);
      });

      if (addedRule) {
        action = "CREATE";
        const condSummary = addedRule.conditions.map((c: any) => `${c.targetKey} ${c.operator} '${c.value}'`).join(' & ');
        const timing = addedRule.startDate ? ` | Start: ${formatDate(addedRule.startDate)}` : '';
        const actionType = addedRule.action === 'show' ? 'PRIKAŽI' : 'SAKRIJ';
        
        details = `Novo pravilo: "${addedRule.name}". Akcija: ${actionType} na "${addedRule.targetElementSelector}". Uvjeti: [${condSummary}]${timing}`;
      
      } else if (deletedRule) {
        action = "DELETE";
        details = `Obrisano pravilo: "${deletedRule.name}"`;
      
      } else if (modifiedRule) {
        action = "UPDATE";
        const old = oldRules.find((or: any) => or.id === modifiedRule.id);
        const changes: string[] = [];
        
        if (old.targetElementSelector !== modifiedRule.targetElementSelector) changes.push(`selektor ('${old.targetElementSelector}' -> '${modifiedRule.targetElementSelector}')`);
        if (JSON.stringify(old.conditions) !== JSON.stringify(modifiedRule.conditions)) changes.push(`uvjeti`);
        if (old.startDate !== modifiedRule.startDate) changes.push(`početak`);
        if (old.endDate !== modifiedRule.endDate) changes.push(`kraj`);
        if (old.action !== modifiedRule.action) changes.push(`akcija`);
        
        details = `Ažurirano "${modifiedRule.name}": Promijenjeno ${changes.join(', ') || 'konfiguracija'}.`;
      
      } else if (toggledRule) {
        action = "TOGGLE";
        details = `Pravilo "${toggledRule.name}" je ${toggledRule.isActive ? 'uključeno' : 'isključeno'}`;
      } else {
        details = `Ažuriranje liste pravila (Workspace Save)`;
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

    // RETENTION POLICY: Keep only last 30 logs
    const updatedLogs = [newEntry, ...auditLogs].slice(0, 30);
    await db.put("audit_log", JSON.stringify(updatedLogs));

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
