import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import InputScreen from './components/InputScreen';
import ResultScreen from './components/ResultScreen';
import { simulate } from './lib/calculator';
import type { SimulatorInputs, SimulationResult } from './lib/calculator';
import { peekHandoffSimulatorInputs, clearLiteProHandoffStorage } from './lib/liteProHandoff';

/** 전문가용(프로) 전체 입력 · 결과 플로우 — 추후 /pro 경로에 로그인·구독 가드만 추가하면 됨 */
export default function ProApp() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [savedInputs, setSavedInputs] = useState<SimulatorInputs | undefined>(undefined);
  const [handoffBanner, setHandoffBanner] = useState(false);
  const handoffBootRef = useRef(false);

  useLayoutEffect(() => {
    if (handoffBootRef.current) return;
    const h = peekHandoffSimulatorInputs();
    if (!h) {
      handoffBootRef.current = true;
      return;
    }
    handoffBootRef.current = true;
    setSavedInputs(h);
    setHandoffBanner(true);
    clearLiteProHandoffStorage();
  }, []);

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
      {handoffBanner && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-2.5 text-[12px] text-blue-900">
          <p>
            <strong>간편 진단</strong>에서 입력한 값을 불러왔어요. 세부 항목은 그대로 수정·시뮬레이션할 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => setHandoffBanner(false)}
            className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50"
          >
            닫기
          </button>
        </div>
      )}
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
