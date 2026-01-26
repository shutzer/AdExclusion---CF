
import React, { useState, useEffect, useRef } from 'react';
import { authService } from './services/authService.ts';
import { dataService } from './services/dataService.ts';
import { RuleForm } from './components/RuleForm.tsx';
import { RuleList } from './components/RuleList.tsx';
import { IntegrationPreview } from './components/IntegrationPreview.tsx';
import { Sandbox } from './components/Sandbox.tsx';
import { BlacklistRule } from './types.ts';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [rules, setRules] = useState<BlacklistRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<BlacklistRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showSandbox, setShowSandbox] = useState(true);
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      dataService.getRules().then(data => {
        setRules(data.rules || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if ((isAdding || editingRule) && formRef.current) {
      const headerOffset = 80;
      const elementPosition = formRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [isAdding, editingRule]);

  const saveRules = async (newRules: BlacklistRule[]) => {
    setRules(newRules);
    try { await dataService.saveRules(newRules); } catch (e) { console.error(e); }
  };

  const generateProductionScript = (rulesToPublish: BlacklistRule[]) => {
    const config = rulesToPublish.map(r => ({
      name: r.name,
      conds: r.conditions,
      lOp: r.logicalOperator,
      sel: r.targetElementSelector,
      act: r.action || 'hide',
      rae: !!r.respectAdsEnabled,
      active: r.isActive,
      js: r.customJs ? r.customJs : undefined
    })).filter(r => r.active);

    const configJson = JSON.stringify(config);

    // CRITICAL UPDATE: 
    // Uses clear variable names (rules, targeting, cond) to prevent shadowing bugs.
    // Explicitly handles Logical OR vs AND in a clean scope.
    return `!function(){
      try {
        const rules = ${configJson};
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
             // Debug: console.log(rule.name, rule.lOp, results);
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
    }();`
  };

  const publish = async () => {
    if (!confirm('Jeste li sigurni da želite objaviti trenutna pravila na produkciju?')) return;
    setIsPublishing(true);
    
    // Generiramo minificiranu skriptu za Edge
    const script = generateProductionScript(rules);
    
    try {
      await dataService.saveRules(rules, script);
      await dataService.purgeCache();
      alert('🚀 USPJEH! Pravila su objavljena na Edge (Cloudflare KV).');
    } catch (e) { 
      alert('Greška pri objavljivanju.'); 
      console.error(e);
    } 
    finally { setIsPublishing(false); }
  };

  const handleFormSubmit = (ruleData: any) => {
    if (editingRule) {
      const updatedRules = rules.map(r => r.id === editingRule.id ? { ...r, ...ruleData } : r);
      saveRules(updatedRules);
    } else {
      const newRule: BlacklistRule = { 
        ...ruleData, 
        id: Math.random().toString(36).substr(2, 9), 
        createdAt: Date.now(), 
        isActive: true 
      };
      saveRules([newRule, ...rules]);
    }
    setIsAdding(false);
    setEditingRule(null);
  };

  if (!isAuthenticated) return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-24 md:pb-0">
      <header className="bg-white border-b border-slate-200 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-[#b71918] text-white p-1.5 md:p-2 px-3 md:px-4 font-black uppercase text-sm md:text-base italic rounded shadow-sm tracking-tighter select-none">
            DNEVNIK.hr
          </div>
          <div className="hidden md:block h-4 w-px bg-slate-200"></div>
          <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 select-none">Ad Exclusion Engine</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-3">
            <button onClick={publish} disabled={isPublishing} className="bg-emerald-600 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm">
              🚀 {isPublishing ? 'PUBLISHING...' : 'OBJAVI NA EDGE'}
            </button>
            <button onClick={() => { setEditingRule(null); setIsAdding(true); }} className="bg-slate-900 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-black rounded-lg shadow-sm">
              + NOVO PRAVILO
            </button>
          </div>
          <button onClick={() => { authService.logout(); setIsAuthenticated(false); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 border border-slate-200 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      {/* Mobile Floating Action Balloons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-[60] md:hidden px-4 w-full max-w-sm">
        <button 
          onClick={publish} 
          disabled={isPublishing}
          className="flex-1 bg-emerald-600/90 backdrop-blur-md text-white h-14 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-all"
        >
          🚀 {isPublishing ? '...' : 'OBJAVI'}
        </button>
        <button 
          onClick={() => { setEditingRule(null); setIsAdding(true); }}
          className="flex-1 bg-slate-900/90 backdrop-blur-md text-white h-14 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-all"
        >
          <span className="text-lg">+</span> NOVO
        </button>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto py-4 md:py-5 px-4 md:px-8 space-y-4">
        {/* Editor Section */}
        {(isAdding || editingRule) && (
          <div ref={formRef} className="bg-white p-5 md:p-6 rounded-2xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-400">
            <RuleForm 
              initialData={editingRule || {}}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsAdding(false); setEditingRule(null); }}
            />
          </div>
        )}

        {/* Rules Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <RuleList 
            rules={rules} 
            onEdit={(rule) => { setEditingRule(rule); setIsAdding(true); }}
            onToggle={(id) => saveRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))}
            onDelete={(id) => { if(confirm('Jeste li sigurni?')) saveRules(rules.filter(r => r.id !== id)); }}
          />
        </div>

        {/* Simulator Section with Toggle */}
        <div className="pt-2">
          <button 
            onClick={() => setShowSandbox(!showSandbox)}
            className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-indigo-600 transition-all mb-3 px-2 group"
          >
            <div className={`w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-200 ${showSandbox ? 'rotate-180 bg-indigo-50 border-indigo-200 text-indigo-600 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            Simulator & Edge Preview Engine
          </button>
          
          {showSandbox && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <Sandbox rules={rules} />
            </div>
          )}
        </div>

        {/* Technical Details Section */}
        <div className="pt-2">
          <button 
            onClick={() => setShowDevTools(!showDevTools)}
            className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-indigo-600 transition-all mb-3 px-2 group"
          >
            <div className={`w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-200 ${showDevTools ? 'rotate-180 bg-indigo-50 border-indigo-200 text-indigo-600' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            Integracijski Detalji & JS Kod
          </button>

          {showDevTools && (
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest mb-4 px-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                Pravila u realnom vremenu (Live JS Engine)
              </h3>
              <IntegrationPreview rules={rules} />
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-8 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-1.5 px-3 font-black text-[10px] rounded uppercase select-none">v2.5.0 STABLE</div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">© {new Date().getFullYear()} NOVA TV d.d. • AdOps & Engineering</p>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Edge Cluster</span>
              <span className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span> 
                Live & Healthy
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Auth Scope</span>
              <span className="text-[11px] font-bold text-slate-600 uppercase">Cloudflare KV Session</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const LoginForm = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      const result = await authService.login(user, pass);
      if (result.success) onLogin();
      else setError(result.message || 'Neispravni podaci.');
    } catch (err) {
      setError('Greška pri povezivanju.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#b71918]"></div>
        <div className="flex justify-center mb-10">
          <div className="bg-[#b71918] p-4 px-6 inline-block rounded shadow-xl transform -rotate-1">
             <span className="text-white font-black text-xl tracking-tighter italic select-none">DNEVNIK.hr</span>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[11px] font-black uppercase text-slate-500 mb-2 block tracking-widest">System User</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} disabled={isLoggingIn} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm shadow-inner" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Secret Key</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} disabled={isLoggingIn} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm shadow-inner" />
          </div>
          <button type="submit" disabled={isLoggingIn} className="w-full bg-slate-900 text-white p-5 rounded-xl font-black text-[11px] uppercase tracking-widest mt-4 shadow-xl hover:bg-black active:scale-[0.98] transition-all">
            {isLoggingIn ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
          </button>
          {error && <p className="text-center text-red-600 text-[11px] font-black uppercase mt-6 tracking-widest leading-relaxed px-4">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default App;
