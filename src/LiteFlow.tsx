import { useState, useEffect } from 'react';
import LiteInputScreen from './components/LiteInputScreen';
import LiteResultScreen from './components/LiteResultScreen';
import { simulate } from './lib/calculator';
import type { SimulationResult } from './lib/calculator';
import type { LiteInputValues } from './lib/liteToSimulator';
import { liteInputToSimulator } from './lib/liteToSimulator';
import { LITE_COLUMN_CLASS } from './components/liteLayout';

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
      <div className="flex min-h-screen flex-col bg-toss-canvas select-none">
        <LiteResultScreen result={result} onBack={handleBack} />
        <footer className="mt-auto border-t border-toss-line bg-white py-8 text-center">
          <div className={`${LITE_COLUMN_CLASS} px-3`}>
          <p className="text-[10px] font-medium text-toss-sub">
            <span className="font-bold text-toss-ink">이기적인 은퇴설계</span> · 간편 진단 | ⓒ 2026 All rights reserved.
          </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-toss-canvas select-none">
      <LiteInputScreen onSubmit={handleLiteSubmit} initialValues={savedLite} />
      <footer className="shrink-0 border-t border-toss-line bg-white py-6 text-center">
        <div className={`${LITE_COLUMN_CLASS} px-3`}>
        <p className="text-[10px] font-medium tracking-tight text-toss-sub">
          Designed by <span className="font-bold text-toss-ink">이기적인 은퇴설계</span> · 간편 진단 | ⓒ 2026 All rights reserved.
        </p>
        </div>
      </footer>
    </div>
  );
}
