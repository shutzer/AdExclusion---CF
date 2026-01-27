
import React from 'react';
import { BlacklistRule, Operator } from '../types';
import { TARGETING_KEYS } from '../constants';

interface RuleListProps {
  rules: BlacklistRule[];
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onEdit: (rule: BlacklistRule) => void;
}

const OPERATOR_SYMBOLS: Record<Operator, string> = {
  [Operator.EQUALS]: '=',
  [Operator.NOT_EQUALS]: '!=',
  [Operator.CONTAINS]: '~',
  [Operator.NOT_CONTAINS]: '!~'
};

export const RuleList: React.FC<RuleListProps> = ({ rules, onDelete, onToggle, onEdit }) => {
  if (rules.length === 0) {
    return (
      <div className="p-16 text-center bg-slate-50/20">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Baza pravila je prazna</h3>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-[90px]">Status</th>
            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[240px]">Kampanja</th>
            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Targeting Context & Logic Flow</th>
            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-[180px]">Selektor</th>
            <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest w-[130px]">Upravljanje</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {rules.map((rule) => (
            <tr key={rule.id} className="hover:bg-slate-50 transition-all group">
              <td className="px-6 py-3">
                <button 
                    onClick={() => onToggle(rule.id)}
                    type="button"
                    title={rule.isActive ? "Deaktiviraj" : "Aktiviraj"}
                    className={`w-11 h-6 rounded-full relative transition-all duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-100 ${
                      rule.isActive 
                        ? 'bg-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' 
                        : 'bg-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-md transform ${
                      rule.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
              </td>
              <td className="px-6 py-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                     <span className="text-[13px] font-black text-slate-800 tracking-tight truncate max-w-[220px]">{rule.name}</span>
                     {rule.customJs && (
                       <span className="px-1 py-0.5 bg-amber-100 text-amber-600 border border-amber-200 text-[8px] font-black rounded uppercase tracking-tighter" title="Sadrži Custom JS">JS</span>
                     )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${rule.action === 'hide' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                      {rule.action === 'hide' ? '🚫 SAKRIJ' : '✅ PRIKAŽI'}
                    </span>
                    {rule.respectAdsEnabled && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1 rounded">ADS_REQ</span>}
                  </div>
                </div>
              </td>
              <td className="px-6 py-3">
                <div className="flex flex-wrap items-center gap-1.5 max-w-[450px]">
                  {rule.conditions.slice(0, 4).map((c, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <span className="text-[8px] font-black text-indigo-600 bg-slate-50 px-2 py-1 uppercase tracking-tighter">
                          {TARGETING_KEYS.find(k => k.value === c.targetKey)?.label.split(' (*.)')[1] || c.targetKey}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50/50 min-w-[10px] text-center" title={c.operator}>
                          {OPERATOR_SYMBOLS[c.operator] || '?'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 px-2 py-1 truncate max-w-[120px] italic">
                          "{c.value}"
                        </span>
                      </div>
                      
                      {/* Logic Bridge between items */}
                      {i < rule.conditions.length - 1 && i < 3 && (
                        <div className="px-1.5 flex items-center justify-center">
                          <span className="text-[8px] font-black text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100 uppercase tracking-tighter">
                            {rule.logicalOperator}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                  {rule.conditions.length > 4 && (
                    <span className="text-[9px] font-black text-indigo-400 self-center bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 ml-1">
                      + {rule.conditions.length - 4} JOŠ
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-3">
                <code className="text-[10px] font-mono bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-200 block truncate max-w-[160px] shadow-sm">
                  {rule.targetElementSelector}
                </code>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onEdit(rule)} 
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                    title="Uredi"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button 
                    onClick={() => onDelete(rule.id)} 
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                    title="Obriši"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
