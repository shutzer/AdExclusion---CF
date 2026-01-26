
import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, placeholder }) => {
  const [error, setError] = useState<string | null>(null);

  const validate = (code: string) => {
    if (!code.trim()) {
        setError(null);
        return;
    }
    try {
      // Basic syntax check using the parser without execution
      new Function('ctx', 'selector', code);
      
      // Basic safety checks
      if (code.includes('document.write')) {
          throw new Error('Sigurnosno upozorenje: "document.write" nije dozvoljen.');
      }
      
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    validate(value);
  }, [value]);

  const insertExample = () => {
    const example = `// Primjer: Promijeni boju elementa na temelju domene
if (ctx.domain === 'gol.dnevnik.hr') {
  const el = document.querySelector(selector);
  if (el) {
    el.style.backgroundColor = '#b71918';
    el.style.color = '#ffffff';
    el.style.padding = '10px';
    console.log('AdEx: Custom style applied for', selector);
  }
}`;
    onChange(example);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-1">
         <div className="flex items-center gap-2">
           <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">JavaScript Code Editor</label>
           <span className="text-[9px] text-slate-500 font-mono hidden md:inline">PrismJS Highlighting</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 font-mono">
                Context: <span className="text-emerald-400">ctx</span>, <span className="text-emerald-400">selector</span>
            </span>
            <button 
                type="button" 
                onClick={insertExample}
                className="text-[9px] font-bold text-indigo-300 hover:text-white bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30 transition-all hover:bg-indigo-500/40 ml-2"
            >
                Umetni Primjer
            </button>
         </div>
      </div>
      
      <div className={`relative rounded-xl overflow-hidden border transition-all ${error ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-slate-700 hover:border-indigo-500/50'}`}>
        <div className="bg-[#2d2d2d] text-white font-mono text-xs min-h-[180px] max-h-[400px] overflow-auto custom-scrollbar relative">
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={code => {
                    // Safe access to Prism languages
                    const grammer = Prism.languages.javascript || Prism.languages.clike;
                    return grammer ? Prism.highlight(code, grammer, 'javascript') : code;
                }}
                padding={16}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    backgroundColor: 'transparent',
                    minHeight: '180px'
                }}
                textareaClassName="focus:outline-none"
                placeholder={placeholder}
            />
        </div>
      </div>
      
      {error ? (
        <div className="flex items-center gap-2 text-red-400 bg-red-950/30 p-2 rounded-lg border border-red-900/50 animate-in fade-in slide-in-from-top-1">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[10px] font-mono font-bold">{error}</span>
        </div>
      ) : (
         <div className="flex justify-between items-center h-5">
            <p className="text-[10px] text-slate-500 leading-tight">
                <strong>Safety Sandbox:</strong> Kod se izvršava unutar <code>try-catch</code> bloka u produkciji.
            </p>
            {value.trim().length > 0 && (
                <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    SYNTAX OK
                </span>
            )}
         </div>
      )}
    </div>
  );
};
