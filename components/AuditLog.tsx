
import React, { useState, useEffect } from 'react';
import { AuditLogEntry, AuditAction } from '../types.ts';
import { dataService } from '../services/dataService.ts';

interface AuditLogProps {
  onRollbackFinished: () => void;
  canRollback: boolean;
}

const ACTION_CONFIG: Record<AuditAction, { label: string; color: string; icon: string }> = {
  CREATE: { label: 'Kreirano', color: 'bg-emerald-500', icon: '✨' },
  UPDATE: { label: 'Ažurirano', color: 'bg-amber-500', icon: '📝' },
  DELETE: { label: 'Obrisano', color: 'bg-red-500', icon: '🗑️' },
  PUBLISH_PROD: { label: 'PROD Objava', color: 'bg-indigo-600', icon: '🚀' },
  PUBLISH_DEV: { label: 'DEV Objava', color: 'bg-indigo-400', icon: '🛠️' },
  ROLLBACK: { label: 'Rollback', color: 'bg-purple-600', icon: '⏮️' },
  TOGGLE: { label: 'Prekidač', color: 'bg-blue-400', icon: '🔘' }
};

export const AuditLog: React.FC<AuditLogProps> = ({ onRollbackFinished, canRollback }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await dataService.getAuditLog();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRollback = async (snapshotId: string) => {
    if (!confirm('Jeste li sigurni da želite vratiti bazu pravila na ovo stanje? Trenutne nespremljene promjene će biti pregažene.')) return;
    
    const res = await dataService.rollback(snapshotId);
    if (res.success) {
      alert('Rollback uspješan!');
      onRollbackFinished();
      fetchLogs();
    } else {
      alert('Greška pri rollbacku: ' + res.message);
    }
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('hr-HR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(ts));
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Učitavanje povijesti...</div>;

  if (logs.length === 0) return <div className="p-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nema zapisa u povijesti.</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
           <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           Audit Log & Verzije
        </h3>
        <button onClick={fetchLogs} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Osvježi</button>
      </div>
      
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
        {logs.map((log) => {
          const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'bg-slate-500', icon: '❓' };
          return (
            <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors flex gap-4">
              <div className="flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full ${cfg.color} text-white flex items-center justify-center text-xs shadow-sm`}>
                   {cfg.icon}
                 </div>
                 <div className="w-px h-full bg-slate-100 mt-2"></div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[11px] font-black text-slate-900">{log.user}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{formatDate(log.timestamp)}</span>
                </div>
                
                <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                  {log.details}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <code className="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    ID: {log.snapshotId.substring(0, 8)}...
                  </code>
                  
                  {canRollback && log.action !== 'PUBLISH_PROD' && log.action !== 'PUBLISH_DEV' && (
                    <button 
                      onClick={() => handleRollback(log.snapshotId)}
                      className="text-[9px] font-black uppercase text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1 border border-purple-200 px-2 py-1 rounded bg-purple-50"
                    >
                      Povrati ovu verziju
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
