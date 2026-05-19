import { useEffect, useState } from 'react';
import LiteResultScreen from './components/LiteResultScreen';
import LiteResultBridge from './components/v2/LiteResultBridge';
import LiteWizardScreen from './components/v2/LiteWizardScreen';
import { LITE_COLUMN_CLASS } from './components/liteLayout';
import { simulate, type SimulationResult } from './lib/calculator';
import type { LiteInputValues } from './lib/liteToSimulator';
import { liteInputToSimulator } from './lib/liteToSimulator';

type Phase = 'input' | 'bridge' | 'result';

/** v2 — 카드형 질문지 입력 + 결과 전 응원 브릿지 */
export default function LiteFlowV2() {
  const [phase, setPhase] = useState<Phase>('input');
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
    setPhase('bridge');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBridgeContinue() {
    setPhase('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBackToInput() {
    setPhase('input');
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (phase === 'result' && result) {
    return (
      <div className="flex min-h-screen flex-col bg-toss-canvas select-none">
        <LiteResultScreen result={result} onBack={handleBackToInput} />
        <footer className="mt-auto border-t border-toss-line bg-white py-8 text-center">
          <div className={`${LITE_COLUMN_CLASS} px-3`}>
            <p className="text-[10px] font-medium text-toss-sub">
              <span className="font-bold text-toss-ink">이기적인 은퇴설계</span> · 간편 진단 v2 | ⓒ 2026 All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (phase === 'bridge') {
    return (
      <div className="flex min-h-screen flex-col bg-toss-canvas select-none">
        <LiteResultBridge onContinue={handleBridgeContinue} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-toss-canvas select-none">
      <LiteWizardScreen onSubmit={handleLiteSubmit} initialValues={savedLite} />
      <footer className="shrink-0 border-t border-toss-line bg-white py-6 text-center">
        <div className={`${LITE_COLUMN_CLASS} px-3`}>
          <p className="text-[10px] font-medium tracking-tight text-toss-sub">
            Designed by <span className="font-bold text-toss-ink">이기적인 은퇴설계</span> · 간편 진단 v2 | ⓒ 2026 All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
