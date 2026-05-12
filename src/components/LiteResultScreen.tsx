import { Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, ShieldCheck } from 'lucide-react';
import ConsultationForm from './ConsultationForm';
import { formatKRW, formatMan } from '../lib/calculator';
import type { SimulationResult } from '../lib/calculator';
import { LITE_BUCKET_RATIO } from '../lib/liteToSimulator';

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
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-navy-900 px-4 pt-12 pb-4 border-b border-navy-700 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-navy-800 flex items-center justify-center text-navy-200 hover:bg-navy-700 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-[11px] text-navy-400 font-medium">간편 진단 결과</p>
            <p className="text-sm font-bold text-white">노후 한계선 요약</p>
          </div>
          {!isSafe ? (
            <div className="ml-auto flex items-center gap-1.5 bg-red-900/50 border border-red-700 rounded-xl px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] font-extrabold text-red-300">{dignityEndAge}세 종료</span>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-700 rounded-xl px-3 py-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[11px] font-extrabold text-emerald-300">100세 안전</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        {!isSafe ? (
          <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 text-white p-6 shadow-xl border border-navy-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-red-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">요약</span>
            </div>
            <p className="text-lg font-extrabold leading-snug">
              지금 입력 기준으로는{' '}
              <span className="text-red-400">약 {dignityEndAge}세 전후</span>에 품격 유지가 어려워질 수 있습니다.
            </p>
            <p className="text-[12px] text-navy-300 mt-3 leading-relaxed">
              은퇴 후 생활비 {formatMan(monthlyExpense)} 수준을 유지한다고 가정한 참고값입니다.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-700 text-white p-6 shadow-xl border border-gold-600/30">
            <p className="text-[11px] font-bold text-gold-400 mb-2 tracking-wide uppercase">요약</p>
            <p className="text-lg font-extrabold">현재 입력만으로는 100세까지 크게 부족하지 않아 보입니다.</p>
            <p className="text-sm text-navy-300 mt-2">실제 수익·세금·건강 변화에 따라 달라질 수 있습니다.</p>
          </div>
        )}

        {weakPension && (
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-900 leading-relaxed">
              국민연금 가입 기간이 짧게 반영되었습니다. 개인 준비 비중이 더 중요할 수 있습니다.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl bg-white border border-navy-100 p-4 shadow-sm">
            <p className="text-[11px] text-navy-400 font-medium mb-1">은퇴 시점 ({retirementAge}세) 예상 자산</p>
            <p className="text-xl font-extrabold text-navy-900">{formatKRW(retirementBalance)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-navy-100 p-4 shadow-sm">
            <p className="text-[11px] text-navy-400 font-medium mb-1">은퇴 후 필요 월 생활비 (물가 반영)</p>
            <p className="text-xl font-extrabold text-navy-900">{formatKRW(inflationAdjustedMonthlyExpense)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-navy-100 p-4 shadow-sm">
            <p className="text-[11px] text-navy-400 font-medium mb-1">국민연금 예상 (은퇴 시점, 세전 월액)</p>
            <p className="text-lg font-extrabold text-blue-600">{formatKRW(pensionAtRetirement)}</p>
            {result.healthInsuranceTriggered && (
              <p className="text-xs text-red-500 mt-1">세후 약 {formatKRW(pensionNetAtRetirement)}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-navy-50 border border-navy-100 px-4 py-3 text-[10px] text-navy-600 leading-relaxed space-y-2">
          <p>
            <strong className="text-navy-800">간편 진단 가정:</strong> 월 저축은 은행 {Math.round(LITE_BUCKET_RATIO.bank * 100)}% · 증권{' '}
            {Math.round(LITE_BUCKET_RATIO.stock * 100)}% · 보험 {Math.round(LITE_BUCKET_RATIO.insurance * 100)}%로 나누었습니다. 활동
            종료 나이·의료비 등은 표준값을 사용했습니다.
          </p>
          <p className="text-navy-500">
            그래프·세부 비교는 설계사 전용 상세 화면에서 조정할 수 있습니다.
          </p>
        </div>

        <ConsultationForm inputs={inputs} />

        <div className="rounded-xl border border-dashed border-navy-200 bg-white px-4 py-3 text-center">
          <p className="text-[11px] text-navy-600 mb-2">상세 자산 배분·세금 인사이트는 무료 상담 또는 설계사 리포트로 안내드립니다.</p>
          <Link
            to="/pro"
            className="text-[11px] font-semibold text-navy-500 hover:text-navy-800 underline underline-offset-2"
          >
            설계사 전용 · 상세 진단 (프로)
          </Link>
        </div>
      </div>
    </div>
  );
}
