
import React, { useState } from 'react';
import { BlacklistRule } from '../types';

interface IntegrationPreviewProps {
  rules: BlacklistRule[];
}

export const IntegrationPreview: React.FC<IntegrationPreviewProps> = ({ rules }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'script'>('json');
  
  const configJson = JSON.stringify(rules.map(r => ({
    name: r.name,
    conds: r.conditions,
    lOp: r.logicalOperator,
    sel: r.targetElementSelector,
    act: r.action || 'hide',
    rae: !!r.respectAdsEnabled,
    js: r.customJs ? r.customJs : undefined
  })), null, 2);

  // Reflects the new robust implementation from App.tsx
  const scriptCode = `(function() {
  try {
    const rules = ${configJson.replace(/\n/g, '\n    ')};
    const targeting = page_meta?.third_party_apps?.ntAds?.targeting;
    
    if (targeting) {
      const inject = (sel, action) => {
         const s = document.createElement("style");
         const disp = action === "show" ? "block" : "none";
         const vis = action === "show" ? "visible" : "hidden";
         s.innerHTML = sel + " { display: " + disp + " !important; visibility: " + vis + " !important; }";
         document.head.appendChild(s);
      };
      
      const runJs = (code, ctx, sel) => {
         try { new Function("ctx", "selector", code)(ctx, sel); } 
         catch(err) { console.warn("AdEx JS Error:", err); }
      };

      rules.forEach(rule => {
         // 1. Check Global Ads Enabled requirement
         if (rule.rae && targeting.ads_enabled !== true) return;

         // 2. Evaluate all conditions
         const results = rule.conds.map(cond => {
            const pageValRaw = targeting[cond.targetKey];
            
            // Normalize page values to array of lowercased strings
            const pageVals = Array.isArray(pageValRaw) 
              ? pageValRaw.map(v => String(v).toLowerCase().trim()) 
              : [String(pageValRaw || "").toLowerCase().trim()];
            
            // Normalize rule values
            const ruleVals = cond.value.split(",").map(v => v.trim().toLowerCase());

            switch (cond.operator) {
              case "equals": 
                // True if ANY rule val matches ANY page val
                return ruleVals.some(rv => pageVals.includes(rv));
              case "not_equals": 
                // True if ALL rule vals are NOT in page vals
                return ruleVals.every(rv => !pageVals.includes(rv));
              case "contains": 
                return ruleVals.some(rv => pageVals.some(pv => pv.indexOf(rv) > -1));
              case "not_contains": 
                return ruleVals.every(rv => pageVals.every(pv => pv.indexOf(rv) === -1));
              default: return false;
            }
         });

         // 3. Apply Logical Operator (AND vs OR)
         const isMatch = rule.lOp === "OR" 
            ? results.some(r => r) 
            : results.every(r => r);

         // 4. Execute Action
         if (isMatch) {
            inject(rule.sel, rule.act);
            if (rule.js) {
               const exec = () => runJs(rule.js, targeting, rule.sel);
               if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", exec);
               else exec();
            }
         }
      });
    }
  } catch (err) {
    console.error("AdExclusion Engine Error:", err);
  }
})();`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopirano!');
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex p-1 bg-slate-100 rounded-lg max-w-xs">
        <button
          onClick={() => setActiveTab('json')}
          className={`flex-1 py-1 text-[10px] font-black uppercase rounded transition-all ${
            activeTab === 'json' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
          }`}
        >
          JSON Payload
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`flex-1 py-1 text-[10px] font-black uppercase rounded transition-all ${
            activeTab === 'script' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
          }`}
        >
          Logic Preview
        </button>
      </div>

      <div className="relative group w-full">
        <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl text-[10px] font-mono h-[550px] overflow-y-auto custom-scrollbar border border-slate-800 w-full">
          <code>{activeTab === 'json' ? configJson : scriptCode}</code>
        </pre>
        <button
          onClick={() => copyToClipboard(activeTab === 'json' ? configJson : scriptCode)}
          className="absolute top-4 right-6 p-2 bg-slate-800 text-slate-300 rounded hover:text-white hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 3h4" />
          </svg>
        </button>
      </div>
    </div>
  );
};
