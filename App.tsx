import React, { useState, useEffect, useMemo } from 'react';

const TARGETING_KEYS = [
  { label: 'Portal (Site)', value: 'site' },
  { label: 'Ključne riječi (Keywords)', value: 'keywords' },
  { label: 'Rubrika (Section)', value: 'section' },
  { label: 'Glavna rubrika (Top Section)', value: 'top_section' },
  { label: 'Vrsta stranice (Page Type)', value: 'page_type' },
  { label: 'ID Članka (Content ID)', value: 'content_id' },
  { label: 'Domena (Domain)', value: 'domain' },
  { label: 'AB Test', value: 'ab_test' }
];

const OPERATORS = [
  { label: 'Jednako (==)', value: 'equals' },
  { label: 'NIJE Jednako (!=)', value: 'not_equals' },
  { label: 'Sadrži', value: 'contains' },
  { label: 'NE Sadrži', value: 'not_contains' }
];

const LoginForm = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const handleLogin = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'nova-ads-2025') {
      sessionStorage.setItem('adex_auth', 'true');
      onLogin();
    } else {
      alert('Neispravni podaci za prijavu.');
    }
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-12 shadow-2xl">
        <div className="flex justify-center mb-10">
          <div className="bg-[#b71918] p-4 px-6 inline-block">
            <svg width="130" height="16" viewBox="0 0 130 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40.932 6.11255H37.3138V9.75578H40.932V6.11255Z" fill="white"></path>
              <path d="M103.519 12.2875H99.9008V15.9307H103.519V12.2875Z" fill="white"></path>
              <path d="M13.6258 7.84687C13.6258 1.88333 10.4726 0 5.51782 0H0V15.876H5.11219C10.6976 15.876 13.6258 13.812 13.6258 7.84687ZM9.14424 7.91458C9.14424 11.0677 8.0863 12.1109 5.36145 12.1109H4.41343V3.7651H5.49511C8.22099 3.7651 9.14424 4.98958 9.14424 7.91458Z" fill="white"></path>
              <path d="M28.9603 15.876V0H24.7708V4.33125C24.7708 5.62448 24.7925 7.73385 24.9071 8.43646C24.568 7.77865 23.1715 5.66927 22.4506 4.69531L18.9831 0H15.1322V15.876H19.3211V11.0229C19.3211 9.72969 19.2979 7.62083 19.1854 6.91771C19.59 7.62083 20.9416 9.66146 21.6398 10.637L25.4015 15.876H28.9603Z" fill="white"></path>
              <path d="M59.1292 0H54.2647L53.116 4.26354C52.5762 6.2599 51.8103 9.45729 51.5167 10.976C51.2246 9.45729 50.4587 6.23802 49.9189 4.26354L48.7701 0H43.8597L49.2883 15.876H53.7022L59.1292 0Z" fill="white"></path>
              <path d="M74.0777 15.876V0H69.8872V4.33125C69.8872 5.62448 69.911 7.73385 70.0224 8.43646C69.686 7.77865 68.2895 5.66927 67.5696 4.69531L64.1005 0H60.2496V15.876H64.4391V11.0229C64.4391 9.72969 64.4153 7.62083 64.3034 6.91771C64.7095 7.62083 66.0595 9.66146 66.7578 10.637L70.521 15.876H74.0777Z" fill="white"></path>
              <path d="M80.9435 0H76.4867V15.876H80.9435V0Z" fill="white"></path>
              <path d="M97.9005 15.876L92.6087 5.60312L97.3596 0H92.0451L90.7839 1.61042C89.7703 2.90312 88.3955 4.7401 87.7432 5.78437C87.7886 4.62708 87.8092 3.19792 87.8092 1.8599V0H83.3494V15.876H87.8092V11.0906L89.4338 9.11771L92.7212 15.876H97.9005Z" fill="white"></path>
              <path d="M43.1991 15.876V12.1797H35.2945V3.69635H43.0423V0H30.9698V15.876H43.1991Z" fill="white"></path>
              <path d="M107.141 0.0682373H111.386V5.66824H111.427C111.808 5.2047 112.29 4.83074 112.873 4.54688C113.438 4.27032 114.196 4.13282 115.147 4.13282C116.188 4.13282 117.082 4.45313 117.828 5.0922C118.568 5.73126 118.945 6.71928 118.959 8.05574V16H114.715V9.93751C114.73 9.2547 114.653 8.70365 114.479 8.28386C114.299 7.8698 113.876 7.66147 113.213 7.66147C112.797 7.64897 112.404 7.78178 112.026 8.06511C111.845 8.21043 111.691 8.43126 111.561 8.7297C111.442 9.04115 111.382 9.4297 111.382 9.89272V16H107.141V0.0682373Z" fill="white"></path>
              <path d="M129.328 7.98906C129.084 7.94583 128.749 7.92344 128.322 7.92344C126.618 7.89531 125.755 9.06042 125.745 11.4214V16H121.502V4.41615H125.578V6.26875H125.62C125.963 5.57135 126.383 5.03698 126.89 4.66667C127.371 4.31146 127.993 4.13281 128.753 4.13281C129.177 4.13281 129.594 4.19167 130 4.30729" fill="white"></path>
            </svg>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Korisnik</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Lozinka</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-6 hover:bg-slate-800 transition-all">Prijavi se</button>
        </form>
      </div>
    </div>
  );
};

const Sandbox = ({ rules }) => {
  const [mockData, setMockData] = useState({
    site: 'gol',
    keywords: 'Rukomet, Euro 2026',
    section: 'ostali-sportovi',
    top_section: 'sport',
    page_type: 'article',
    content_id: 'article:998877',
    domain: 'gol.dnevnik.hr'
  });

  const checkCondition = (cond, data) => {
    const actual = String(data[cond.targetKey] || '').toLowerCase().trim();
    const expected = cond.value.toLowerCase().trim();
    
    switch(cond.operator) {
      case 'equals': return actual === expected;
      case 'not_equals': return actual !== expected;
      case 'contains': return actual.includes(expected);
      case 'not_contains': return !actual.includes(expected);
      default: return false;
    }
  };

  const activeMatches = useMemo(() => {
    return rules.filter(rule => {
      if (!rule.isActive) return false;
      const results = rule.conditions.map(c => checkCondition(c, mockData));
      return rule.logicalOperator === 'AND' ? results.every(r => r) : results.some(r => r);
    });
  }, [rules, mockData]);

  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
        <h2 className="text-xl font-black uppercase tracking-tight">Simulator <span className="text-slate-400">/ Edge Testing</span></h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.keys(mockData).map(key => (
          <div key={key}>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block tracking-widest">{key}</label>
            <input 
              type="text" 
              value={mockData[key]} 
              onChange={e => setMockData({...mockData, [key]: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {activeMatches.length > 0 ? activeMatches.map(m => (
          <div key={m.id} className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100 animate-in slide-in-from-left-2">
            <div className="flex flex-col">
              <span className="text-xs font-black text-green-700 uppercase">✅ MATCH: {m.name}</span>
              <span className="text-[10px] font-bold text-green-600 uppercase">Akcija: {m.action === 'show' ? 'PRIKAŽI' : 'SAKRIJ'}</span>
            </div>
            <code className="text-[10px] bg-white px-2 py-1 rounded text-green-600 border border-green-100">{m.targetElementSelector}</code>
          </div>
        )) : (
          <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center text-xs text-slate-300 font-bold uppercase tracking-widest italic">Nema aktivnih okidača na ovoj stranici</div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adex_auth') === 'true');
  const [rules, setRules] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/sync').then(res => res.json()).then(data => {
        setRules(data.rules || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const saveToKV = async (newRules) => {
    setRules(newRules);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: newRules })
      });
    } catch (e) { console.error("KV Sync Error", e); }
  };

  const publish = async () => {
    setIsPublishing(true);
    const activeRules = rules.filter(r => r.isActive).map(r => ({
      name: r.name,
      conds: r.conditions,
      lOp: r.logicalOperator,
      sel: r.targetElementSelector,
      act: r.action || 'hide'
    }));

    const script = `/** AdExclusion Live Engine | Generated: ${new Date().toISOString()} */
(function(){
  const rules = ${JSON.stringify(activeRules)};
  const targeting = page_meta?.third_party_apps?.ntAds?.targeting;
  if (!targeting || !rules.length) return;
  const injectStyle = (sel, action) => {
    const s = document.createElement('style');
    const displayVal = action === 'show' ? 'block' : 'none';
    const visibilityVal = action === 'show' ? 'visible' : 'hidden';
    const pointerEvents = action === 'show' ? 'auto' : 'none';
    s.innerHTML = sel + ' { ' +
      'display: ' + displayVal + ' !important; ' +
      'visibility: ' + visibilityVal + ' !important; ' +
      'pointer-events: ' + pointerEvents + ' !important; ' +
      (action === 'hide' ? 'height: 0 !important; margin: 0 !important; padding: 0 !important;' : '') +
    ' }';
    document.head.appendChild(s);
  };
  rules.forEach(rule => {
    const results = rule.conds.map(c => {
      const actual = String(targeting[c.targetKey] || '').toLowerCase().trim();
      const val = c.value.toLowerCase().trim();
      switch(c.operator) {
        case 'equals': return actual === val;
        case 'not_equals': return actual !== val;
        case 'contains': return actual.indexOf(val) !== -1;
        case 'not_contains': return actual.indexOf(val) === -1;
        default: return false;
      }
    });
    const match = rule.lOp === 'AND' ? results.every(r => r) : results.some(r => r);
    if (match) injectStyle(rule.sel, rule.act);
  });
})();`;

    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, script })
      });
      const purgeRes = await fetch('/api/purge', { method: 'POST' });
      const purgeJson = await purgeRes.json();
      alert('🚀 USPJEH! ' + (purgeJson.success ? 'Cache je invalidiran.' : 'Greška pri brisanju cachea.'));
    } catch (e) { alert('Greška pri objavljivanju.'); }
    finally { setIsPublishing(false); }
  };

  const handleEdit = (rule) => {
    setEditingRule({ ...rule });
    setIsAdding(true);
  };

  const addCondition = () => {
    setEditingRule({
      ...editingRule,
      conditions: [...editingRule.conditions, { targetKey: 'section', operator: 'equals', value: '' }]
    });
  };

  const removeCondition = (index) => {
    const newConds = [...editingRule.conditions];
    newConds.splice(index, 1);
    setEditingRule({ ...editingRule, conditions: newConds });
  };

  const updateCondition = (index, field, val) => {
    const newConds = [...editingRule.conditions];
    newConds[index] = { ...newConds[index], [field]: val };
    setEditingRule({ ...editingRule, conditions: newConds });
  };

  const handleSubmit = () => {
    if (!editingRule.name || editingRule.conditions.some(c => !c.value) || !editingRule.targetElementSelector) {
        alert("Sva polja su obavezna.");
        return;
    }
    
    let newRules;
    const exists = rules.find(r => r.id === editingRule.id);
    if (exists) {
      newRules = rules.map(r => r.id === editingRule.id ? editingRule : r);
    } else {
      newRules = [{ ...editingRule, id: Math.random().toString(), createdAt: Date.now() }, ...rules];
    }
    
    saveToKV(newRules);
    setIsAdding(false);
    setEditingRule(null);
  };

  if (!isAuthenticated) return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-24 px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <a href="/" title="Sink" className="flex items-center md:p-4 p-2 px-6 space-x-2 md:text-xl text-base font-black bg-[#b71918] text-white">
            <svg className="md:w-32 w-24" width="130" height="16" viewBox="0 0 130 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40.932 6.11255H37.3138V9.75578H40.932V6.11255Z" fill="white"></path>
              <path d="M103.519 12.2875H99.9008V15.9307H103.519V12.2875Z" fill="white"></path>
              <path d="M13.6258 7.84687C13.6258 1.88333 10.4726 0 5.51782 0H0V15.876H5.11219C10.6976 15.876 13.6258 13.812 13.6258 7.84687ZM9.14424 7.91458C9.14424 11.0677 8.0863 12.1109 5.36145 12.1109H4.41343V3.7651H5.49511C8.22099 3.7651 9.14424 4.98958 9.14424 7.91458Z" fill="white"></path>
              <path d="M28.9603 15.876V0H24.7708V4.33125C24.7708 5.62448 24.7925 7.73385 24.9071 8.43646C24.568 7.77865 23.1715 5.66927 22.4506 4.69531L18.9831 0H15.1322V15.876H19.3211V11.0229C19.3211 9.72969 19.2979 7.62083 19.1854 6.91771C19.59 7.62083 20.9416 9.66146 21.6398 10.637L25.4015 15.876H28.9603Z" fill="white"></path>
              <path d="M59.1292 0H54.2647L53.116 4.26354C52.5762 6.2599 51.8103 9.45729 51.5167 10.976C51.2246 9.45729 50.4587 6.23802 49.9189 4.26354L48.7701 0H43.8597L49.2883 15.876H53.7022L59.1292 0Z" fill="white"></path>
              <path d="M74.0777 15.876V0H69.8872V4.33125C69.8872 5.62448 69.911 7.73385 70.0224 8.43646C69.686 7.77865 68.2895 5.66927 67.5696 4.69531L64.1005 0H60.2496V15.876H64.4391V11.0229C64.4391 9.72969 64.4153 7.62083 64.3034 6.91771C64.7095 7.62083 66.0595 9.66146 66.7578 10.637L70.521 15.876H74.0777Z" fill="white"></path>
              <path d="M80.9435 0H76.4867V15.876H80.9435V0Z" fill="white"></path>
              <path d="M97.9005 15.876L92.6087 5.60312L97.3596 0H92.0451L90.7839 1.61042C89.7703 2.90312 88.3955 4.7401 87.7432 5.78437C87.7886 4.62708 87.8092 3.19792 87.8092 1.8599V0H83.3494V15.876H87.8092V11.0906L89.4338 9.11771L92.7212 15.876H97.9005Z" fill="white"></path>
              <path d="M43.1991 15.876V12.1797H35.2945V3.69635H43.0423V0H30.9698V15.876H43.1991Z" fill="white"></path>
              <path d="M107.141 0.0682373H111.386V5.66824H111.427C111.808 5.2047 112.29 4.83074 112.873 4.54688C113.438 4.27032 114.196 4.13282 115.147 4.13282C116.188 4.13282 117.082 4.45313 117.828 5.0922C118.568 5.73126 118.945 6.71928 118.959 8.05574V16H114.715V9.93751C114.73 9.2547 114.653 8.70365 114.479 8.28386C114.299 7.8698 113.876 7.66147 113.213 7.66147C112.797 7.64897 112.404 7.78178 112.026 8.06511C111.845 8.21043 111.691 8.43126 111.561 8.7297C111.442 9.04115 111.382 9.4297 111.382 9.89272V16H107.141V0.0682373Z" fill="white"></path>
              <path d="M129.328 7.98906C129.084 7.94583 128.749 7.92344 128.322 7.92344C126.618 7.89531 125.755 9.06042 125.745 11.4214V16H121.502V4.41615H125.578V6.26875H125.62C125.963 5.57135 126.383 5.03698 126.89 4.66667C127.371 4.31146 127.993 4.13281 128.753 4.13281C129.177 4.13281 129.594 4.19167 130 4.30729" fill="white"></path>
            </svg>
            <span className="pt-0.5">/ AdExclusion</span>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={publish} 
            disabled={isPublishing}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-[2px] font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isPublishing ? 'Sinkronizacija...' : '🚀 Objavi na Edge'}
          </button>
          <button 
            onClick={() => { setEditingRule({ id: Math.random().toString(), name: '', conditions: [{ targetKey: 'section', operator: 'equals', value: '' }], logicalOperator: 'AND', targetElementSelector: '', action: 'hide', isActive: true }); setIsAdding(true); }} 
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-[2px] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
          >
            + Novo Pravilo
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto py-16 px-6">
        {isAdding && editingRule && (
          <div className="mb-12 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8">
                {rules.some(r => r.id === editingRule.id) ? 'Uredi Pravilo' : 'Konfiguracija Pravila'}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Naziv Kampanje</label>
                <input type="text" value={editingRule.name} onChange={e => setEditingRule({...editingRule, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="npr. Hide Heineken on Sport" />
              </div>

              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Uvjeti Targetiranja</label>
                    {editingRule.conditions.length > 1 && (
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                            <button onClick={() => setEditingRule({...editingRule, logicalOperator: 'AND'})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editingRule.logicalOperator === 'AND' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>AND</button>
                            <button onClick={() => setEditingRule({...editingRule, logicalOperator: 'OR'})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editingRule.logicalOperator === 'OR' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>OR</button>
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    {editingRule.conditions.map((cond, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-4">
                                <select value={cond.targetKey} onChange={e => updateCondition(idx, 'targetKey', e.target.value)} className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-xs">
                                    {TARGETING_KEYS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <select value={cond.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-xs text-indigo-600">
                                    {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-4">
                                <input type="text" value={cond.value} onChange={e => updateCondition(idx, 'value', e.target.value)} className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-xs" placeholder="Vrijednost" />
                            </div>
                            <div className="md:col-span-1 flex justify-center">
                                <button onClick={() => removeCondition(idx)} disabled={editingRule.conditions.length === 1} className="text-red-300 hover:text-red-500 transition-colors disabled:opacity-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addCondition} className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:text-indigo-800 transition-colors">
                    <span className="bg-indigo-100 w-5 h-5 flex items-center justify-center rounded-full">+</span>
                    Dodaj Uvjet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-9">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">CSS Selektor</label>
                    <input type="text" value={editingRule.targetElementSelector} onChange={e => setEditingRule({...editingRule, targetElementSelector: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500" placeholder=".klasa ili #id" />
                </div>
                <div className="md:col-span-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Akcija</label>
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl h-[58px]">
                        <button 
                            onClick={() => setEditingRule({...editingRule, action: 'hide'})}
                            className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingRule.action === 'hide' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            Sakrij
                        </button>
                        <button 
                            onClick={() => setEditingRule({...editingRule, action: 'show'})}
                            className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingRule.action === 'show' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            Prikaži
                        </button>
                    </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-slate-50">
              <button onClick={() => { setIsAdding(false); setEditingRule(null); }} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Odustani</button>
              <button onClick={handleSubmit} className="bg-indigo-600 text-white px-10 py-4 rounded-[2px] font-black text-xs uppercase tracking-widest shadow-xl">Spremi Pravilo</button>
            </div>
          </div>
        )}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-12">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Kampanja</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Pravilo (Logika)</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Akcija</th>
                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-slate-300 italic font-bold uppercase tracking-widest">Nema aktivnih izuzetaka</td></tr>
              ) : rules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-8">
                    <button onClick={() => saveToKV(rules.map(r => r.id === rule.id ? {...r, isActive: !r.isActive} : r))} className={`w-12 h-6 rounded-full relative transition-all ${rule.isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${rule.isActive ? 'left-7' : 'left-1'}`} />
                    </button>
                  </td>
                  <td className="px-10 py-8 font-bold text-slate-900">{rule.name}</td>
                  <td className="px-10 py-8">
                    <div className="flex flex-wrap gap-1 items-center">
                        {rule.conditions.map((c, i) => (
                            <React.Fragment key={i}>
                                <div className="text-[9px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    <span className="font-black text-slate-400 uppercase mr-1">{c.targetKey}</span>
                                    <span className="text-indigo-600">{OPERATORS.find(o => o.value === c.operator)?.label}</span>
                                    <span className="font-bold ml-1">"{c.value}"</span>
                                </div>
                                {i < rule.conditions.length - 1 && <span className="text-[8px] font-black text-indigo-400 mx-1 uppercase">{rule.logicalOperator}</span>}
                            </React.Fragment>
                        ))}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${rule.action === 'show' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                      {rule.action === 'show' ? 'PRIKAŽI' : 'SAKRIJ'}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(rule)} className="text-slate-300 hover:text-indigo-600 transition-colors p-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2 2 0 112.828 2.828l-7.071 7.071-4.242 1.414 1.414-4.242 7.071-7.071z" /></svg>
                      </button>
                      <button onClick={() => saveToKV(rules.filter(r => r.id !== rule.id))} className="text-red-200 hover:text-red-500 transition-colors p-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Sandbox rules={rules} />
      </main>
      <footer className="py-12 bg-white border-t border-slate-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div>© 2025 Nova TV • Digital Ops Core</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            Cloudflare Edge Engine: Online
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;