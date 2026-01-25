import React, { useState, useEffect } from 'react';
import { Operator, BlacklistRule, TargetingKey, ActionType, Condition, LogicalOperator } from '../types';
import { TARGETING_KEYS, OPERATORS } from '../constants';

interface RuleFormProps {
  onSubmit: (rule: Omit<BlacklistRule, 'id' | 'createdAt' | 'isActive'>) => void;
  onCancel: () => void;
  initialData?: Partial<BlacklistRule>;
}

export const RuleForm: React.FC<RuleFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperator>(initialData?.logicalOperator || 'AND');
  const [conditions, setConditions] = useState<Condition[]>(
    initialData?.conditions || [{ targetKey: 'keywords', operator: Operator.CONTAINS, value: '', caseSensitive: false }]
  );
  const [selector, setSelector] = useState(initialData?.targetElementSelector || '');
  const [action, setAction] = useState<ActionType>(initialData?.action || 'hide');
  const [respectAdsEnabled, setRespectAdsEnabled] = useState(initialData?.respectAdsEnabled ?? true);

  const addCondition = () => {
    setConditions([...conditions, { targetKey: 'section', operator: Operator.EQUALS, value: '', caseSensitive: false }]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || conditions.some(c => !c.value) || !selector) {
      alert("Molimo popunite sva obavezna polja.");
      return;
    }
    onSubmit({
      name,
      conditions,
      logicalOperator,
      targetElementSelector: selector,
      action,
      respectAdsEnabled
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h2 className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
          <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
          {initialData?.id ? 'Uredi Konfiguraciju' : 'Novo Izuzeće'}
        </h2>
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Targeting Context: page_meta.ntAds</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest ml-1">Naziv Kampanje / Klijenta</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="npr. Heineken Euro 2024"
            className="w-full h-11 bg-slate-50 border border-slate-200 px-4 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest ml-1">Tip Akcije</label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 h-11">
            <button 
              type="button" 
              onClick={() => setAction('hide')} 
              className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase rounded-lg transition-all ${action === 'hide' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >Sakrij</button>
            <button 
              type="button" 
              onClick={() => setAction('show')} 
              className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase rounded-lg transition-all ${action === 'show' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >Prikaži</button>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logika Uvjeta</label>
            <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm h-8">
              <button type="button" onClick={() => setLogicalOperator('AND')} className={`px-3 flex items-center justify-center text-[9px] font-black rounded transition-all ${logicalOperator === 'AND' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>AND</button>
              <button type="button" onClick={() => setLogicalOperator('OR')} className={`px-3 flex items-center justify-center text-[9px] font-black rounded transition-all ${logicalOperator === 'OR' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>OR</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Respect Ads Enabled</span>
            <button 
              type="button"
              onClick={() => setRespectAdsEnabled(!respectAdsEnabled)}
              className={`w-9 h-5 rounded-full relative transition-all ${respectAdsEnabled ? 'bg-indigo-600 shadow-inner' : 'bg-slate-300'}`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${respectAdsEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {conditions.map((cond, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-[1.2] relative">
                <select
                  value={cond.targetKey}
                  onChange={(e) => updateCondition(index, { targetKey: e.target.value as TargetingKey })}
                  className="w-full h-10 bg-white border border-slate-200 px-3 rounded-lg text-[11px] font-bold outline-none appearance-none cursor-pointer pr-8"
                >
                  {TARGETING_KEYS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
              </div>
              <div className="flex-1 relative">
                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value as Operator })}
                  className="w-full h-10 bg-white border border-slate-200 px-3 rounded-lg text-[11px] font-bold text-indigo-600 outline-none appearance-none cursor-pointer pr-8"
                >
                  {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-300"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
              </div>
              <div className="flex-[2.5] relative flex items-center">
                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Vrijednost..."
                  className="w-full h-10 bg-white border border-slate-200 px-4 pr-10 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-400 transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => updateCondition(index, { caseSensitive: !cond.caseSensitive })} 
                  className={`absolute right-1.5 w-7 h-7 flex items-center justify-center rounded-md text-[9px] font-black transition-all ${cond.caseSensitive ? 'bg-slate-800 text-white' : 'text-slate-300 bg-slate-50'}`}
                >Aa</button>
              </div>
              <button 
                type="button" 
                onClick={() => removeCondition(index)} 
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addCondition} className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase text-indigo-600 tracking-widest hover:text-indigo-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
           <span className="text-xs">+</span> Dodaj parametar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest ml-1">Target Element (CSS Selektor)</label>
          <input
            type="text"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder="npr. .bg-branding-main ili #ad-banner"
            className="w-full h-11 bg-slate-50 border border-slate-200 px-4 rounded-xl text-sm font-bold font-mono outline-none shadow-inner"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 h-11 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Odustani</button>
          <button type="submit" className="flex-[2] h-11 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
            {initialData?.id ? 'Spremi' : 'Kreiraj'}
          </button>
        </div>
      </div>
    </form>
  );
};