
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

  const scriptCode = `(function() {
  const rules = ${configJson.replace(/\n/g, '\n  ')};
  const targeting = page_meta?.third_party_apps?.ntAds?.targeting;
  if (!targeting) return;

  const injectStyle = (sel, action) => {
    const s = document.createElement('style');
    const displayVal = action === 'show' ? 'block' : 'none';
    const visibilityVal = action === 'show' ? 'visible' : 'hidden';
    s.innerHTML = sel + ' { display: ' + displayVal + ' !important; visibility: ' + visibilityVal + ' !important; }';
    document.head.appendChild(s);
  };
  
  const safeRunJs = (code, ctx, selector) => {
    if(!code) return;
    try {
      // Izolirano izvršavanje s prosljeđenim kontekstom
      new Function('ctx', 'selector', code)(ctx, selector);
    } catch(e) {
      console.warn('AdExclusion JS Error:', e);
    }
  };

  rules.forEach(rule => {
    if (rule.rae && targeting.ads_enabled !== true) return;

    const results = rule.conds.map(c => {
      const actualRaw = targeting[c.targetKey];
      const actualItems = Array.isArray(actualRaw) 
        ? actualRaw.map(v => String(v).toLowerCase().trim())
        : [String(actualRaw || '').toLowerCase().trim()];
        
      const inputValues = c.value.split(',').map(v => v.trim().toLowerCase());
      
      switch(c.operator) {
        case 'equals': 
          return inputValues.some(iv => actualItems.some(ai => ai === iv));
        case 'not_equals': 
          return inputValues.every(iv => actualItems.every(ai => ai !== iv));
        case 'contains': 
          return inputValues.some(iv => actualItems.some(ai => ai.indexOf(iv) !== -1));
        case 'not_contains': 
          return inputValues.every(iv => actualItems.every(ai => ai.indexOf(iv) === -1));
        default: return false;
      }
    });

    const match = rule.lOp === 'AND' ? results.every(r => r) : results.some(r => r);
    if (match) {
        injectStyle(rule.sel, rule.act);
        if (rule.js) safeRunJs(rule.js, targeting, rule.sel);
    }
  });
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
