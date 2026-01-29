
import React, { useState } from 'react';
import { Operator, BlacklistRule, TargetingKey, ActionType, Condition, LogicalOperator } from '../types';
import { TARGETING_KEYS, OPERATORS } from '../constants';
import { CodeEditor } from './CodeEditor.tsx';

interface RuleFormProps {
  onSubmit: (rule: Omit<BlacklistRule, 'id' | 'createdAt' | 'isActive'>) => void;
  onCancel: () => void;
  initialData?: Partial<BlacklistRule>;
  canManageJs: boolean;
}

/**
 * Helper koji pretvara timestamp u string kompatibilan s datetime-local inputom
 * koristeći isključivo lokalno vrijeme (Europe/Zagreb) bez UTC transformacije.
 */
const toLocalDateTimeString = (timestamp: number | undefined): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  
  // Ručna konstrukcija ISO-like stringa bez UTC offseta
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

/**
 * Validira CSS selektor koristeći nativni browser parser.
 * Ako browser baci grešku, selektor nije validan.
 */
const isValidSelector = (selector: string): boolean => {
  try {
    // createDocumentFragment je lakši od document i ne renderira se
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch {
    return false;
  }
};

export const RuleForm: React.FC<RuleFormProps> = ({ onSubmit, onCancel, initialData, canManageJs }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperator>(initialData?.logicalOperator || 'AND');
  const [conditions, setConditions] = useState<Condition[]>(
    initialData?.conditions || [{ targetKey: 'keywords', operator: Operator.CONTAINS, value: '', caseSensitive: false }]
  );
  const [selector, setSelector] = useState(initialData?.targetElementSelector || '');
  const [action, setAction] = useState<ActionType>(initialData?.action || 'hide');
  const [customJs, setCustomJs] = useState(initialData?.customJs || '');
  const [respectAdsEnabled, setRespectAdsEnabled] = useState(initialData?.respectAdsEnabled ?? true);
  
  // Koristimo helper koji ne oduzima sate
  const [startDate, setStartDate] = useState<string>(toLocalDateTimeString(initialData?.startDate));
  const [endDate, setEndDate] = useState<string>(toLocalDateTimeString(initialData?.endDate));
  
  const [showAdvanced, setShowAdvanced] = useState(!!initialData?.customJs && canManageJs);
  const [selectorError, setSelectorError] = useState<string | null>(null);

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

  const handleSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSelector(newVal);
    
    // Clear error on change if it becomes valid or empty
    if (!newVal || isValidSelector(newVal)) {
      setSelectorError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || conditions.some(c => !c.value) || !selector) {
      alert("Molimo popunite sva obavezna polja.");
      return;
    }

    if (!isValidSelector(selector)) {
      setSelectorError("Neispravna sintaksa CSS selektora.");
      // Scroll to selector input
      const selectorInput = document.getElementById('targetSelectorInput');
      selectorInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      selectorInput?.focus();
      return;
    }

    // Pri pretvaranju natrag u timestamp, Date konstruktor će koristiti lokalno vrijeme preglednika (HR)
    onSubmit({
      name,
      conditions,
      logicalOperator,
      targetElementSelector: selector,
      action,
      customJs,
      respectAdsEnabled,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-100 pb-5 gap-3">
        <div>
          <h2 className="text-[18px] md:text-[17px] font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"></span>
            {initialData?.id ? 'Uredi Pravilo' : 'Novo Izuzeće'}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="md:col-span-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Naziv Kampanje / Klijenta</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="npr. Heineken Euro 2026"
            className="w-full h-14 md:h-12 bg-slate-50 border border-slate-200 px-4 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Tip Akcije</label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 h-14 md:h-12">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl">
        <div className="group">
          <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest ml-1 group-focus-within:text-indigo-600 transition-colors">Početak</label>
          <div className="relative">
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-[12px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
            />
            {startDate && <button onClick={() => setStartDate('')} type="button" className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 text-lg">×</button>}
          </div>
        </div>
        <div className="group">
          <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest ml-1 group-focus-within:text-indigo-600 transition-colors">Kraj</label>
          <div className="relative">
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-[12px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
            />
            {endDate && <button onClick={() => setEndDate('')} type="button" className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 text-lg">×</button>}
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-6 pb-5 border-b border-slate-200/50">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logika</label>
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-12 flex-1 sm:flex-none">
              <button type="button" onClick={() => setLogicalOperator('AND')} className={`flex-1 sm:px-5 flex items-center justify-center text-[9px] font-black rounded-lg transition-all ${logicalOperator === 'AND' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>AND</button>
              <button type="button" onClick={() => setLogicalOperator('OR')} className={`flex-1 sm:px-5 flex items-center justify-center text-[9px] font-black rounded-lg transition-all ${logicalOperator === 'OR' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>OR</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-4 px-1">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Respect Ads Required</span>
            <button 
              type="button"
              onClick={() => setRespectAdsEnabled(!respectAdsEnabled)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${
                respectAdsEnabled ? 'bg-emerald-500 shadow-emerald-100' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-md transform ${
                respectAdsEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="space-y-6 md:space-y-3">
          {conditions.map((cond, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-3 md:items-center animate-in fade-in slide-in-from-left-2 duration-300 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl border border-slate-200 md:border-none shadow-sm md:shadow-none">
              <div className="flex gap-2.5 w-full md:flex-[2.2]">
                <div className="flex-1 relative h-12">
                  <select
                    value={cond.targetKey}
                    onChange={(e) => updateCondition(index, { targetKey: e.target.value as TargetingKey })}
                    className="w-full h-full bg-slate-50 md:bg-white border border-slate-200 px-4 rounded-xl text-[12px] md:text-[11px] font-bold outline-none appearance-none cursor-pointer pr-10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5"
                  >
                    {TARGETING_KEYS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </div>
                <div className="flex-1 relative h-12">
                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(index, { operator: e.target.value as Operator })}
                    className="w-full h-full bg-slate-50 md:bg-white border border-slate-200 px-4 rounded-xl text-[12px] md:text-[11px] font-bold text-indigo-600 outline-none appearance-none cursor-pointer pr-10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5"
                  >
                    {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-200"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </div>
              </div>

              <div className="flex gap-2.5 w-full md:flex-[2.8]">
                <div className="flex-1 relative flex items-center h-12">
                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Vrijednost parametra..."
                    className="w-full h-full bg-slate-50 md:bg-white border border-slate-200 px-4 pr-24 md:pr-14 rounded-xl text-[12px] md:text-[11px] font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                  />
                  <div className="absolute right-2 flex items-center gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => updateCondition(index, { caseSensitive: !cond.caseSensitive })} 
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${cond.caseSensitive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 bg-white/80 border border-slate-200 hover:text-slate-600'}`}
                      title="Case Sensitive"
                    >Aa</button>
                    <button 
                      type="button" 
                      onClick={() => removeCondition(index)} 
                      className="md:hidden w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeCondition(index)} 
                  className="hidden md:flex w-12 h-12 items-center justify-center text-slate-300 hover:text-red-500 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addCondition} className="mt-6 w-full md:w-auto flex items-center justify-center gap-3 text-[11px] font-black uppercase text-indigo-600 tracking-widest hover:text-indigo-800 transition-all bg-white px-6 h-12 rounded-2xl border border-slate-200 shadow-sm active:scale-95 group">
           <span className="text-xl">+</span> Dodaj novi parametar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 pt-3">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Target Element (CSS Selektor)</label>
          <div className="relative">
            <input
              id="targetSelectorInput"
              type="text"
              value={selector}
              onChange={handleSelectorChange}
              placeholder="npr. .bg-branding-main ili #ad-banner"
              className={`w-full h-14 md:h-12 bg-slate-50 border px-4 rounded-xl text-sm font-bold font-mono outline-none shadow-inner transition-all ${
                selectorError 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'
              }`}
            />
            {selector && !selectorError && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" title="Valid Syntax">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </div>
          
          {selectorError && (
            <div className="mt-2 flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-top-1">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">{selectorError}</span>
            </div>
          )}
        </div>

        {canManageJs && (
          <div className="pt-2">
             <button 
               type="button"
               onClick={() => setShowAdvanced(!showAdvanced)}
               className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest"
             >
                <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
                Napredno: Custom JavaScript Injection
             </button>
             
             {showAdvanced && (
               <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner">
                     <CodeEditor 
                       value={customJs}
                       onChange={setCustomJs}
                       placeholder="// Unesite JS kod koji će se izvršiti ako su uvjeti zadovoljeni.&#10;// Primjer: console.log('Targeting matched!', ctx.site);"
                     />
                  </div>
               </div>
             )}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <button type="submit" className="w-full md:flex-[2.5] h-16 md:h-14 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all order-1 md:order-2">
            {initialData?.id ? 'Spremi Konfiguraciju' : 'Kreiraj Novo Izuzeće'}
          </button>
          <button type="button" onClick={onCancel} className="w-full md:flex-1 h-14 text-[11px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors order-2 md:order-1 active:bg-slate-50 rounded-xl">
            Odustani
          </button>
        </div>
      </div>
    </form>
  );
};
