import { useEffect, useState } from 'react';
import LiteResultScreen from './components/LiteResultScreen';
import LiteResultBridge from './components/v2/LiteResultBridge';
import LiteWizardScreenQuick from './components/v2/LiteWizardScreenQuick';
import { LITE_COLUMN_CLASS } from './components/liteLayout';
import { simulate, type SimulationResult } from './lib/calculator';
import type { LiteInputValues } from './lib/liteToSimulator';
import { liteInputToSimulator } from './lib/liteToSimulator';

type Phase = 'input' | 'bridge' | 'result';

interface Props {
  hideConsultation?: boolean;
}

/** v3 — 클릭 위주 5문항 초간편 진단 (나이대·소득 구간 클릭 + 중앙값 계산) */
export default function LiteFlowV3({ hideConsultation = false }: Props) {
  const [phase, setPhase] = useState<Phase>('input');
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const preventAction = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventAction);
    return () => document.removeEventListener('contextmenu', preventAction);
  }, []);

  function handleLiteSubmit(values: LiteInputValues) {
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
        <LiteResultScreen result={result} onBack={handleBackToInput} hideConsultation={hideConsultation} enableGate />
        <footer className="mt-auto border-t border-toss-line bg-white py-8 text-center">
          <div className={`${LITE_COLUMN_CLASS} px-3`}>
            <p className="text-[10px] font-medium text-toss-sub">
              <span className="font-bold text-toss-ink">이기적인 은퇴설계</span> · 간편 진단 빠른 버전 | ⓒ 2026 All
              rights reserved.
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
      <LiteWizardScreenQuick onSubmit={handleLiteSubmit} />
      <footer className="shrink-0 border-t border-toss-line bg-white py-6 text-center">
        <div className={`${LITE_COLUMN_CLASS} px-3`}>
          <p className="text-[10px] font-medium tracking-tight text-toss-sub">
            Designed by <span className="font-bold text-toss-ink">이기적인 은퇴설계</span> · 간편 진단 빠른 버전 | ⓒ
            2026 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
