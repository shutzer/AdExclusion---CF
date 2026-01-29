
import React, { useState, useEffect, useRef } from 'react';
import { authService } from './services/authService.ts';
import { dataService } from './services/dataService.ts';
import { RuleForm } from './components/RuleForm.tsx';
import { RuleList } from './components/RuleList.tsx';
import { IntegrationPreview } from './components/IntegrationPreview.tsx';
import { Sandbox } from './components/Sandbox.tsx';
import { AuditLog } from './components/AuditLog.tsx';
import { BlacklistRule } from './types.ts';

const formatCroTime = (date: Date) => {
  return new Intl.DateTimeFormat('hr-HR', {
    timeZone: 'Europe/Zagreb',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [rules, setRules] = useState<BlacklistRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<BlacklistRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<null | 'prod' | 'dev'>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showSandbox, setShowSandbox] = useState(true);
  const [activeView, setActiveView] = useState<'rules' | 'history'>('rules');
  
  const [canManageJs, setCanManageJs] = useState(() => authService.canEditCode());
  const formRef = useRef<HTMLDivElement>(null);

  const refreshRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.getRules();
      setRules(data.rules || []);
    } catch (err: any) {
      console.error("Failed to load rules:", err);
      setError(err.message || "Greška pri učitavanju pravila.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setCanManageJs(authService.canEditCode());
      refreshRules();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if ((isAdding || editingRule) && formRef.current) {
      const headerOffset = 80;
      const elementPosition = formRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, [isAdding, editingRule]);

  const saveRulesToWorkspace = async (newRules: BlacklistRule[]) => {
    setRules(newRules);
    try { await dataService.saveRules(newRules, undefined, 'prod'); } catch (e) { console.error(e); }
  };

  const generateProductionScript = (rulesToPublish: BlacklistRule[], env: 'prod' | 'dev') => {
    const config = rulesToPublish.map(r => ({
      n: r.name,
      c: r.conditions,
      lo: r.logicalOperator,
      s: r.targetElementSelector,
      a: r.action || 'hide',
      rae: !!r.respectAdsEnabled,
      act: r.isActive,
      js: r.customJs ? r.customJs : undefined,
      sd: r.startDate,
      ed: r.endDate
    })).filter(r => r.act);

    const configJson = JSON.stringify(config);
    const croTime = formatCroTime(new Date());

    return `/** AdExclusion Engine v2.7 [${env.toUpperCase()}] **/ !function(){try{const rules=${configJson},targeting=page_meta?.third_party_apps?.ntAds?.targeting;if(!targeting)return;const now=Date.now(),inject=(sel,act)=>{const s=document.createElement("style"),disp=act==="show"?"block":"none",vis=act==="show"?"visible":"hidden";s.innerHTML=sel+"{display:"+disp+"!important;visibility:"+vis+"!important;}",document.head.appendChild(s)},runJs=(code,ctx,sel)=>{try{new Function("ctx","selector",code)(ctx,sel)}catch(e){}};rules.forEach(rule=>{if(rule.sd&&now<rule.sd)return;if(rule.ed&&now>rule.ed)return;if(rule.rae&&targeting.ads_enabled!==true)return;const res=rule.c.map(cond=>{const raw=targeting[cond.targetKey],pvs=Array.isArray(raw)?raw.map(v=>String(v).toLowerCase().trim()):[String(raw||"").toLowerCase().trim()],rvs=cond.value.split(",").map(v=>v.trim().toLowerCase());let m=false;switch(cond.operator){case "equals":m=rvs.some(rv=>pvs.includes(rv));break;case "not_equals":m=rvs.every(rv=>!pvs.includes(rv));break;case "contains":m=rvs.some(rv=>pvs.some(pv=>pv.indexOf(rv)>-1));break;case "not_contains":m=rvs.every(rv=>pvs.every(pv=>pv.indexOf(rv)===-1));break}return m});if(rule.lo==="OR"?res.some(r=>r):res.every(r=>r)){inject(rule.s,rule.a);if(rule.js){const ex=()=>runJs(rule.js,targeting,rule.s);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ex);else ex()}}})}catch(e){}}();`;
  };

  const publish = async (env: 'prod' | 'dev') => {
    const confirmMsg = env === 'prod' 
      ? 'PAŽNJA: Objava na PRODUKCIJU. Skripta će biti zakeširana na CF Edge serverima.' 
      : 'Objavi na DEV okruženje?';
      
    if (!confirm(confirmMsg)) return;
    
    setIsPublishing(env);
    const script = generateProductionScript(rules, env);
    
    try {
      await dataService.saveRules(rules, script, env);
      const purgeResult = await dataService.purgeCache(env);
      
      if (purgeResult.success) {
        alert(`🚀 USPJEŠNO! Skripta je ažurirana na Edge-u (${env.toUpperCase()}) i cache je invalidiran.`);
      } else {
        alert(`⚠️ Spremljeno, ali CF Purge nije uspio. Cache će se sam osvježiti kroz neko vrijeme.`);
      }
    } catch (e) { 
      alert('Kritična greška pri objavljivanju.'); 
    } 
    finally { setIsPublishing(null); }
  };

  const handleFormSubmit = (ruleData: any) => {
    if (editingRule) {
      const updatedRules = rules.map(r => r.id === editingRule.id ? { ...r, ...ruleData } : r);
      saveRulesToWorkspace(updatedRules);
    } else {
      const newRule: BlacklistRule = { 
        ...ruleData, 
        id: Math.random().toString(36).substr(2, 9), 
        createdAt: Date.now(), 
        isActive: true 
      };
      saveRulesToWorkspace([newRule, ...rules]);
    }
    setIsAdding(false);
    setEditingRule(null);
  };

  if (!isAuthenticated) return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-black text-[#b71918] animate-pulse uppercase tracking-[0.2em]">SINKRONIZACIJA...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-24 md:pb-0">
      <header className="bg-white border-b border-slate-200 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-[#b71918] text-white p-1.5 md:p-2 px-3 md:px-4 font-black uppercase text-sm md:text-base italic rounded shadow-sm tracking-tighter select-none cursor-pointer" onClick={() => setActiveView('rules')}>
            DNEVNIK.hr
          </div>
          <div className="hidden md:block h-4 w-px bg-slate-200"></div>
          <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 select-none">Ad Exclusion Engine</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => publish('dev')} 
              disabled={!!isPublishing} 
              className="bg-indigo-600 text-white px-4 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm"
            >
              🛠️ {isPublishing === 'dev' ? '...' : 'OBJAVI NA DEV'}
            </button>
            <button 
              onClick={() => publish('prod')} 
              disabled={!!isPublishing} 
              className="bg-emerald-600 text-white px-4 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm"
            >
              🚀 {isPublishing === 'prod' ? '...' : 'OBJAVI NA PROD'}
            </button>
            <button onClick={() => { setActiveView('rules'); setEditingRule(null); setIsAdding(true); }} className="bg-slate-900 text-white px-4 py-2.5 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-black rounded-lg shadow-sm">
              + NOVO PRAVILO
            </button>
          </div>
          <button onClick={() => { authService.logout(); setIsAuthenticated(false); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 border border-slate-200 rounded-lg" title="Odjava">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto py-4 md:py-5 px-4 md:px-8 space-y-4">
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="text-red-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h4 className="text-red-800 font-black text-xs uppercase tracking-widest">Sistemska Greška</h4>
              <p className="text-red-600 text-xs font-medium mt-1">{error}</p>
            </div>
            <button onClick={refreshRules} className="ml-auto bg-white border border-red-200 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-red-50">
              Pokušaj ponovno
            </button>
          </div>
        )}

        {/* View Switcher */}
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm">
          <button 
            onClick={() => setActiveView('rules')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeView === 'rules' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Pravila Izuzeća
          </button>
          <button 
            onClick={() => setActiveView('history')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeView === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Povijest Promjena
          </button>
        </div>

        {activeView === 'rules' ? (
          <>
            {(isAdding || editingRule) && (
              <div ref={formRef} className="bg-white p-5 md:p-6 rounded-2xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-400">
                <RuleForm 
                  initialData={editingRule || {}}
                  onSubmit={handleFormSubmit}
                  onCancel={() => { setIsAdding(false); setEditingRule(null); }}
                  canManageJs={canManageJs}
                />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <RuleList 
                rules={rules} 
                onEdit={(rule) => { setEditingRule(rule); setIsAdding(true); }}
                onToggle={(id) => saveRulesToWorkspace(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))}
                onDelete={(id) => { if(confirm('Jeste li sigurni?')) saveRulesToWorkspace(rules.filter(r => r.id !== id)); }}
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setShowSandbox(!showSandbox)}
                className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-indigo-600 transition-all mb-3 px-2 group"
              >
                <div className={`w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-200 ${showSandbox ? 'rotate-180 bg-indigo-50 border-indigo-200 text-indigo-600' : ''}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                Simulator & Edge Preview Engine
              </button>
              {showSandbox && <div className="animate-in slide-in-from-bottom-2 duration-300"><Sandbox rules={rules} /></div>}
            </div>

            {canManageJs && (
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
                    <IntegrationPreview rules={rules} />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in duration-300">
            <AuditLog 
              onRollbackFinished={() => { setActiveView('rules'); refreshRules(); }} 
              canRollback={canManageJs}
            />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-8 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-1.5 px-3 font-black text-[10px] rounded uppercase select-none">v2.8.0 AUDIT</div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">© {new Date().getFullYear()} NOVA TV d.d. • AdOps & Engineering</p>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Endpoints</span>
              <span className="text-[11px] font-bold text-emerald-600 uppercase">PROD & DEV ACTIVE</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Auth Scope</span>
              <span className="text-[11px] font-bold text-slate-600 uppercase">
                {authService.getRole() === 'admin' ? 'SuperAdmin' : 'Standard User'}
              </span>
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
            <input type="text" value={user} onChange={e => setUser(e.target.value)} disabled={isLoggingIn} placeholder="admin or user" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm shadow-inner" />
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
