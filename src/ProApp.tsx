import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import InputScreen from './components/InputScreen';
import ResultScreen from './components/ResultScreen';
import ProTierBar from './components/ProTierBar';
import ProAccessGate from './components/ProAccessGate';
import { simulate } from './lib/calculator';
import type { SimulatorInputs, SimulationResult } from './lib/calculator';
import { peekHandoffSimulatorInputs, clearLiteProHandoffStorage } from './lib/liteProHandoff';
import { proFeatures, PRO_TIER_META, type ProTier } from './lib/proTier';
import { DEFAULT_FIXED_COSTS, type FixedCosts } from './lib/savedClients';
import type { ActiveClient } from './components/SavedClientsPanel';
import {
  canRunBasicSimulation,
  getBasicUsage,
  isTrialExpired,
  recordBasicSimulation,
  recordTrialSimulation,
} from './lib/proUsageLimits';
import { PRO_TRIAL_LIMITS } from './lib/proTier';

interface Props {
  tier: ProTier;
}

export default function ProApp({ tier }: Props) {
  return (
    <ProAccessGate tier={tier}>
      <ProAppContent tier={tier} />
    </ProAccessGate>
  );
}

function ProAppContent({ tier }: Props) {
  const features = proFeatures(tier);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [savedInputs, setSavedInputs] = useState<SimulatorInputs | undefined>(undefined);
  const [savedFixedCosts, setSavedFixedCosts] = useState<FixedCosts>(DEFAULT_FIXED_COSTS);
  const [activeClient, setActiveClient] = useState<ActiveClient | null>(null);
  const [handoffBanner, setHandoffBanner] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
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

  function handleSimulate(inputs: SimulatorInputs, fixedCosts: FixedCosts) {
    if (tier === 'trial') {
      if (isTrialExpired()) {
        setLimitMessage(`체험판 이용 기간(${PRO_TRIAL_LIMITS.validDays}일)이 종료되었어요. Basic 이상으로 업그레이드해 주세요.`);
        return;
      }
      setLimitMessage(null);
      recordTrialSimulation();
    } else if (!features.unlimitedSimulations) {
      if (!canRunBasicSimulation()) {
        const { simLimit } = getBasicUsage();
        setLimitMessage(`이번 달 Basic 시뮬레이션 한도(${simLimit}회)를 모두 사용했어요. Pro로 업그레이드하면 무제한입니다.`);
        return;
      }
      setLimitMessage(null);
      recordBasicSimulation();
    } else {
      setLimitMessage(null);
    }
    setSavedInputs(inputs);
    setSavedFixedCosts(fixedCosts);
    setResult(simulate(inputs));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const footer = (
    <footer className="space-y-2 border-t border-slate-100 bg-white py-8 text-center">
      <p className="text-[10px] font-medium text-slate-400">
        <span className="font-bold text-slate-500">이기적인 은퇴설계</span> · {PRO_TIER_META[tier].label} | ⓒ 2026
      </p>
    </footer>
  );

  if (result) {
    return (
      <div className={`min-h-screen bg-slate-50 select-none ${features.reportWatermark ? 'pro-print-basic' : ''}`}>
        <ProTierBar tier={tier} />
        <ResultScreen result={result} onBack={handleBack} tier={tier} />
        {footer}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen select-none flex-col bg-slate-50">
      <ProTierBar tier={tier} />
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
      {limitMessage && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
          {limitMessage}{' '}
          <Link
            to={tier === 'trial' ? PRO_TIER_META.basic.path : PRO_TIER_META.pro.path}
            className="font-bold underline underline-offset-2"
          >
            {tier === 'trial' ? 'Basic 보기' : 'Pro 보기'}
          </Link>
        </div>
      )}
      <div className="flex-grow">
        <InputScreen
          onSimulate={handleSimulate}
          initialInputs={savedInputs}
          initialFixedCosts={savedFixedCosts}
          activeClient={activeClient}
          onActiveClientChange={setActiveClient}
          tier={tier}
        />
      </div>
      {footer}
    </div>
  );
}
