import { Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, ShieldCheck } from 'lucide-react';
import ConsultationForm from './ConsultationForm';
import LiteLegalDisclaimer from './LiteLegalDisclaimer';
import LiteResultCharts from './LiteResultCharts';
import { stashSimulatorInputsForPro } from '../lib/liteProHandoff';
import { formatKRW, formatMan } from '../lib/calculator';
import type { SimulationResult } from '../lib/calculator';
import { LITE_BUCKET_RATIO } from '../lib/liteToSimulator';
import { LITE_COLUMN_CLASS } from './liteLayout';

interface Props {
  result: SimulationResult;
  onBack: () => void;
}

export default function LiteResultScreen({ result, onBack }: Props) {
  const {
    inputs,
    retirementBalance,
    dignityEndAge,
    pensionAtRetirement,
    pensionNetAtRetirement,
    inflationAdjustedMonthlyExpense,
    weakPension,
  } = result;

  const isSafe = dignityEndAge === null;
  const { retirementAge, monthlyExpense } = inputs;

  return (
    <div className="flex min-h-screen flex-col bg-toss-canvas">
      <header className="sticky top-0 z-20 border-b border-toss-line bg-white/90 backdrop-blur-md">
        <div className={`${LITE_COLUMN_CLASS} px-3 pb-4 pt-10`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-toss-canvas text-toss-ink transition hover:bg-toss-line/80 active:scale-95"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} strokeWidth={2.25} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-toss-sub">간편 진단 결과</p>
            <p className="truncate text-[15px] font-bold text-toss-ink">노후 한계선 요약</p>
          </div>
          {!isSafe ? (
            <div className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-[11px] font-bold text-red-600">{dignityEndAge}세 종료</span>
            </div>
          ) : (
            <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
              <ShieldCheck size={14} className="text-emerald-600" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-emerald-700">100세 안전</span>
            </div>
          )}
        </div>
        </div>
      </header>

      <div className={`${LITE_COLUMN_CLASS} flex flex-1 flex-col gap-4 px-3 py-5`}>
        {!isSafe ? (
          <div className="rounded-[20px] border border-toss-line border-l-4 border-l-red-500 bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" strokeWidth={2.25} />
              <span className="text-[11px] font-bold uppercase tracking-wide text-red-500">요약</span>
            </div>
            <p className="text-[17px] font-bold leading-snug text-toss-ink">
              지금 입력 기준으로는{' '}
              <span className="text-red-500">약 {dignityEndAge}세 전후</span>에 품격 유지가 어려워질 수 있어요.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-toss-sub">
              은퇴 후 생활비 {formatMan(monthlyExpense)} 수준을 유지한다고 가정한 참고값이에요.
            </p>
          </div>
        ) : (
          <div className="rounded-[20px] border border-toss-line border-l-4 border-l-toss-blue bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-toss-blue">요약</p>
            <p className="text-[17px] font-bold leading-snug text-toss-ink">
              현재 입력만으로는 100세까지 크게 부족하지 않아 보여요.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-toss-sub">
              실제 수익·세금·건강 변화에 따라 달라질 수 있어요.
            </p>
          </div>
        )}

        {weakPension && (
          <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/90 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-[12px] leading-relaxed text-amber-900">
              국민연금 가입 기간이 짧게 반영되었습니다. 개인 준비 비중이 더 중요할 수 있습니다.
            </p>
          </div>
        )}

        <LiteResultCharts result={result} />

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
            <p className="mb-1 text-[12px] font-medium text-toss-sub">은퇴 시점 ({retirementAge}세) 예상 자산</p>
            <p className="text-[22px] font-bold tracking-tight text-toss-ink">{formatKRW(retirementBalance)}</p>
          </div>
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
            <p className="mb-1 text-[12px] font-medium text-toss-sub">은퇴 후 필요 월 생활비 (물가 반영)</p>
            <p className="text-[22px] font-bold tracking-tight text-toss-ink">{formatKRW(inflationAdjustedMonthlyExpense)}</p>
          </div>
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
            <p className="mb-1 text-[12px] font-medium text-toss-sub">국민연금 예상 (은퇴 시점, 세전 월액)</p>
            <p className="text-xl font-bold text-toss-blue">{formatKRW(pensionAtRetirement)}</p>
            {result.healthInsuranceTriggered && (
              <p className="mt-1 text-xs font-medium text-red-500">세후 약 {formatKRW(pensionNetAtRetirement)}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-toss-line bg-white px-4 py-3 text-[11px] leading-relaxed text-toss-sub">
          <p>
            <strong className="text-toss-ink">간편 진단 가정:</strong> 월 저축은 은행 {Math.round(LITE_BUCKET_RATIO.bank * 100)}% · 증권{' '}
            {Math.round(LITE_BUCKET_RATIO.stock * 100)}% · 보험 {Math.round(LITE_BUCKET_RATIO.insurance * 100)}%로 나누었습니다. 활동
            종료 나이·의료비 등은 표준값을 사용했습니다.
          </p>
          <p>그래프·세부 비교는 설계사 전용 상세 화면에서 조정할 수 있어요.</p>
        </div>

        <ConsultationForm inputs={inputs} />

        <LiteLegalDisclaimer />

        <div className="rounded-2xl border border-dashed border-toss-line bg-white px-4 py-4 text-center">
          <p className="mb-2 text-[12px] leading-relaxed text-toss-sub">
            상세 자산 배분·세금 인사이트는 무료 상담 또는 설계사 리포트로 안내드립니다.
          </p>
          <Link
            to="/pro"
            onClick={() => stashSimulatorInputsForPro(result.inputs)}
            className="text-[12px] font-semibold text-toss-blue underline decoration-toss-line underline-offset-4 hover:text-toss-bluePress"
          >
            설계사 전용 · 상세 진단 (프로)
          </Link>
        </div>
      </div>
    </div>
  );
}
