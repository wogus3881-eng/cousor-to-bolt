import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InputScreen from './components/InputScreen';
import ResultScreen from './components/ResultScreen';
import { simulate } from './lib/calculator';
import type { SimulatorInputs, SimulationResult } from './lib/calculator';

/** 전문가용(프로) 전체 입력 · 결과 플로우 — 추후 /pro 경로에 로그인·구독 가드만 추가하면 됨 */
export default function ProApp() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [savedInputs, setSavedInputs] = useState<SimulatorInputs | undefined>(undefined);

  useEffect(() => {
    const preventAction = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventAction);
    return () => document.removeEventListener('contextmenu', preventAction);
  }, []);

  function handleSimulate(inputs: SimulatorInputs) {
    setSavedInputs(inputs);
    setResult(simulate(inputs));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 select-none">
        <ResultScreen result={result} onBack={handleBack} />
        <footer className="py-8 text-center border-t border-slate-100 bg-white space-y-2">
          <p className="text-[10px] text-slate-400 font-medium">
            <span className="font-bold text-slate-500">이기적인 은퇴설계</span> · 프로 진단 | ⓒ 2026 All rights reserved.
          </p>
          <Link to="/" className="text-[10px] text-navy-500 hover:text-navy-700 underline underline-offset-2">
            고객용 간편 진단으로 이동
          </Link>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 select-none flex flex-col">
      <div className="flex-grow">
        <InputScreen onSimulate={handleSimulate} initialInputs={savedInputs} />
      </div>

      <footer className="py-8 text-center border-t border-slate-100 bg-white space-y-2">
        <p className="text-[10px] text-slate-400 font-medium tracking-tight">
          Designed by <span className="font-bold text-slate-500">이기적인 은퇴설계</span> · 프로 진단 | ⓒ 2026 All rights reserved.
        </p>
        <Link to="/" className="text-[10px] text-navy-500 hover:text-navy-700 underline underline-offset-2">
          고객용 간편 진단으로 이동
        </Link>
      </footer>
    </div>
  );
}
