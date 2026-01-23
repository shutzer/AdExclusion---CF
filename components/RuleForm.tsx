import React, { useState, useEffect } from 'react';
import { Operator, BlacklistRule, TargetingKey, ActionType } from '../types';
import { TARGETING_KEYS, DEFAULT_SELECTORS } from '../constants';

interface RuleFormProps {
  onSubmit: (rule: Omit<BlacklistRule, 'id' | 'createdAt' | 'isActive'>) => void;
  onCancel: () => void;
  initialData?: Partial<BlacklistRule>;
}

export const RuleForm: React.FC<RuleFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [targetKey, setTargetKey] = useState<TargetingKey>(
    initialData?.conditions?.[0]?.targetKey || (initialData as any)?.targetKey || 'section'
  );
  const [operator, setOperator] = useState<Operator>(
    initialData?.conditions?.[0]?.operator || (initialData as any)?.operator || Operator.EQUALS
  );
  const [value, setValue] = useState(
    initialData?.conditions?.[0]?.value || (initialData as any)?.value || ''
  );
  const [selector, setSelector] = useState(initialData?.targetElementSelector || '');
  const [action, setAction] = useState<ActionType>(initialData?.action || 'hide');
  const [respectAdsEnabled, setRespectAdsEnabled] = useState(initialData?.respectAdsEnabled ?? true);

  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.conditions && initialData.conditions[0]) {
        setTargetKey(initialData.conditions[0].targetKey);
        setOperator(initialData.conditions[0].operator);
        setValue(initialData.conditions[0].value);
      } else if ((initialData as any)?.targetKey) {
        setTargetKey((initialData as any).targetKey);
        if ((initialData as any).operator) setOperator((initialData as any).operator);
        if ((initialData as any).value) setValue((initialData as any).value);
      }
      
      if (initialData.targetElementSelector) setSelector(initialData.targetElementSelector);
      if (initialData.action) setAction(initialData.action);
      if (initialData.respectAdsEnabled !== undefined) setRespectAdsEnabled(initialData.respectAdsEnabled);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value || !selector) return;
    onSubmit({
      name,
      conditions: [{ targetKey, operator, value: value.trim() }],
      logicalOperator: initialData?.logicalOperator || 'AND',
      targetElementSelector: selector,
      action,
      respectAdsEnabled
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <div>
          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Globalni Sigurnosni Filter</h4>
          <p className="text-[10px] text-indigo-600 font-medium">Poštuj "Ads Enabled" flag s portala (AND logika)</p>
        </div>
        <button 
          type="button"
          onClick={() => setRespectAdsEnabled(!respectAdsEnabled)}
          className={`w-12 h-6 rounded-full relative transition-all ${respectAdsEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${respectAdsEnabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="col-span-full">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Naziv kampanje (interni podsjetnik)</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            placeholder="npr. Hide Heineken on Football"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. Gdje sakriti? (Kategorija)</label>
          <select
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value as TargetingKey)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-white"
          >
            {TARGETING_KEYS.map(k => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">3. Tip provjere</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as Operator)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-white"
          >
            <option value={Operator.EQUALS}>Je točno (identično)</option>
            <option value={Operator.CONTAINS}>Sadrži ovaj pojam</option>
          </select>
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">4. Koja vrijednost aktivira pravilo?</label>
          <input
            type="text"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            placeholder="npr. nogomet"
          />
          <p className="mt-2 text-[11px] text-slate-400 italic">
            Napomena: Ako je kategorija "Keywords", koristite "Sadrži ovaj pojam".
          </p>
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">5. Akcija</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={action === 'hide'} onChange={() => setAction('hide')} className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Sakrij</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={action === 'show'} onChange={() => setAction('show')} className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Prikaži</span>
            </label>
          </div>
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">6. Što točno sakriti na stranici?</label>
          <input
            type="text"
            required
            value={selector}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            placeholder=".klasa ili #id elementa"
            onChange={(e) => setSelector(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Odustani
        </button>
        <button
          type="submit"
          className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          Spremi Pravilo
        </button>
      </div>
    </form>
  );
};