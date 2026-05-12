import { useState, useEffect } from 'react';
import LiteInputScreen from './components/LiteInputScreen';
import LiteResultScreen from './components/LiteResultScreen';
import { simulate } from './lib/calculator';
import type { SimulationResult } from './lib/calculator';
import type { LiteInputValues } from './lib/liteToSimulator';
import { liteInputToSimulator } from './lib/liteToSimulator';

/** 광고·리드용 간편 진단 — 기본 진입 경로 `/` */
export default function LiteFlow() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [savedLite, setSavedLite] = useState<LiteInputValues | undefined>(undefined);

  useEffect(() => {
    const preventAction = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventAction);
    return () => document.removeEventListener('contextmenu', preventAction);
  }, []);

  function handleLiteSubmit(values: LiteInputValues) {
    setSavedLite(values);
    setResult(simulate(liteInputToSimulator(values)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 select-none flex flex-col">
        <LiteResultScreen result={result} onBack={handleBack} />
        <footer className="py-8 text-center border-t border-slate-100 bg-white mt-auto">
          <p className="text-[10px] text-slate-400 font-medium">
            <span className="font-bold text-slate-500">이기적인 은퇴설계</span> · 간편 진단 | ⓒ 2026 All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 select-none flex flex-col">
      <LiteInputScreen onSubmit={handleLiteSubmit} initialValues={savedLite} />
      <footer className="py-6 text-center border-t border-slate-100 bg-white shrink-0">
        <p className="text-[10px] text-slate-400 font-medium tracking-tight">
          Designed by <span className="font-bold text-slate-500">이기적인 은퇴설계</span> · 간편 진단 | ⓒ 2026 All rights reserved.
        </p>
      </footer>
    </div>
  );
}
