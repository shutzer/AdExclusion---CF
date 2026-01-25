import React, { useState, useMemo } from 'react';
import { BlacklistRule, TargetingData, Operator } from '../types';

interface SandboxProps {
  rules: BlacklistRule[];
}

export const Sandbox: React.FC<SandboxProps> = ({ rules }) => {
  const [mockData, setMockData] = useState<TargetingData>({
    site: 'gol',
    keywords: ['Rukomet 2026', 'Hrvatska'],
    description_url: 'https://gol.dnevnik.hr/clanak/primjer.html',
    ads_enabled: true,
    page_type: 'article',
    content_id: 'article:958381',
    domain: 'gol.dnevnik.hr',
    section: 'ostali-sportovi',
    top_section: 'ostali-sportovi',
    ab_test: 'a_version'
  });

  const checkCondition = (cond: any, data: TargetingData) => {
    const isCS = !!cond.caseSensitive;
    const processVal = (v: any) => isCS ? String(v || '').trim() : String(v || '').toLowerCase().trim();
    
    const inputValues = (cond.value || '').split(',').map(v => processVal(v));
    const actualRaw = data[cond.targetKey as keyof TargetingData];
    const isArrayField = Array.isArray(actualRaw);
    
    const actualItems = isArrayField 
      ? (actualRaw as string[]).map(v => processVal(v))
      : [processVal(actualRaw)];
    
    let matchedValues: string[] = [];

    if (cond.operator === Operator.EQUALS) {
      matchedValues = inputValues.filter(iv => actualItems.some(ai => ai === iv));
      return { success: matchedValues.length > 0, matches: matchedValues };
    } else if (cond.operator === Operator.NOT_EQUALS) {
      const failsEquality = inputValues.filter(iv => actualItems.some(ai => ai === iv));
      return { success: failsEquality.length === 0, matches: [] };
    } else if (cond.operator === Operator.CONTAINS) {
      if (isArrayField) {
        matchedValues = inputValues.filter(iv => actualItems.some(ai => ai === iv));
      } else {
        matchedValues = inputValues.filter(iv => actualItems.some(ai => ai.includes(iv)));
      }
      return { success: matchedValues.length > 0, matches: matchedValues };
    } else if (cond.operator === Operator.NOT_CONTAINS) {
      const containsAny = inputValues.filter(iv => isArrayField ? actualItems.some(ai => ai === iv) : actualItems.some(ai => ai.includes(iv)));
      return { success: containsAny.length === 0, matches: [] };
    }
    return { success: false, matches: [] };
  };

  const activeMatches = useMemo(() => {
    return rules.filter(rule => {
      if (!rule.isActive) return false;
      const conditionResults = (rule.conditions || []).map(cond => checkCondition(cond, mockData));
      if (conditionResults.length === 0) return false;
      const isSuccess = rule.logicalOperator === 'OR' ? conditionResults.some(r => r.success) : conditionResults.every(r => r.success);
      if (isSuccess) {
        (rule as any)._matchedValues = conditionResults.filter(r => r.success).flatMap(r => r.matches);
        return true;
      }
      return false;
    });
  }, [rules, mockData]);

  const renderInputField = (key: keyof TargetingData) => {
    const val = mockData[key];
    return (
      <div key={key} className="flex flex-col">
        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest ml-1">{key.replace('_', ' ')}</label>
        <input
          type="text"
          value={Array.isArray(val) ? val.join(', ') : String(val)}
          onChange={(e) => {
            let newVal: any = e.target.value;
            if (key === 'keywords') newVal = e.target.value.split(',').map(s => s.trim());
            else if (key === 'ads_enabled') newVal = e.target.value === 'true';
            setMockData({ ...mockData, [key]: newVal });
          }}
          className="w-full text-[11px] h-9 px-3 border border-slate-200 bg-slate-50 rounded-lg outline-none font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner"
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-sm"></div>
          <h2 className="font-black text-slate-800 uppercase tracking-tight text-[11px]">Edge Preview Engine</h2>
        </div>
        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest">Active Context</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {renderInputField('site')}
          {renderInputField('keywords')}
          {renderInputField('section')}
          {renderInputField('top_section')}
          {renderInputField('page_type')}
          {renderInputField('content_id')}
          {renderInputField('domain')}
          {renderInputField('ads_enabled')}
        </div>
        <div className="mt-3">
          {renderInputField('description_url')}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Aktivni Filteri:</h3>
          {activeMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeMatches.map(m => (
                <div key={m.id} className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 relative shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest truncate">{m.name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(m as any)._matchedValues?.map((val: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[8px] font-black uppercase">MATCH: {val}</span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <code className="text-[9px] font-mono text-indigo-300 block bg-black/40 p-2 rounded-lg truncate border border-white/5">{m.targetElementSelector}</code>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
              <p className="text-[10px] text-slate-300 font-black uppercase italic tracking-widest">Svi oglasi su trenutno dozvoljeni</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};