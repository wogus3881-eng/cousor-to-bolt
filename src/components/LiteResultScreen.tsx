import { Link } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, ShieldCheck } from 'lucide-react';
import ConsultationForm from './ConsultationForm';
import LiteLegalDisclaimer from './LiteLegalDisclaimer';
import LiteResultCharts from './LiteResultCharts';
import LiteResultDashboard from './LiteResultDashboard';
import { stashSimulatorInputsForPro } from '../lib/liteProHandoff';
import type { SimulationResult } from '../lib/calculator';
import { LITE_BUCKET_RATIO } from '../lib/liteToSimulator';
import { LITE_COLUMN_CLASS } from './liteLayout';

interface Props {
  result: SimulationResult;
  onBack: () => void;
}

export default function LiteResultScreen({ result, onBack }: Props) {
  const { inputs, dignityEndAge, weakPension } = result;

  const isSafe = dignityEndAge === null;

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
              <p className="text-[12px] font-medium text-toss-sub">고객 간편 진단</p>
              <p className="truncate text-[16px] font-bold text-toss-ink">은퇴 진단 결과</p>
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
        <LiteResultDashboard result={result} />

        {weakPension && (
          <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/90 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-[12px] leading-relaxed text-amber-900">
              국민연금 가입 기간이 짧게 반영되었습니다. 개인 준비 비중이 더 중요할 수 있습니다.
            </p>
          </div>
        )}

        <LiteResultCharts result={result} />

        <div className="space-y-2 rounded-2xl border border-toss-line bg-white px-4 py-3 text-[11px] leading-relaxed text-toss-sub">
          <p>
            <strong className="text-toss-ink">간편 진단 가정:</strong> 월 저축 합계는 입력하신 개인연금 월 납입(있을
            경우)을 반영한 뒤, 나머지를 은행·증권 비율({Math.round(LITE_BUCKET_RATIO.bank * 100)}% :{' '}
            {Math.round(LITE_BUCKET_RATIO.stock * 100)}%)로 나누었습니다. 개인연금·보험 적립 부분은 시뮬레이터의 연금/보험
            버킷에 반영됩니다. 활동 종료 나이·의료비 등은 표준값을 사용했습니다.
          </p>
          <p>준비 점수·그래프는 참고용 휴리스틱이며, 세부 비교는 설계사 전용 화면에서 조정할 수 있어요.</p>
        </div>

        <div id="lite-consult" className="scroll-mt-6">
          <div className="mb-3 rounded-2xl border border-toss-blue/25 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3.5 text-center shadow-sm ring-1 ring-toss-blue/10">
            <p className="text-[13px] font-bold text-toss-ink">1분이면 접수 끝 — 먼저 연락드릴게요</p>
            <p className="mt-1 text-[11px] leading-relaxed text-toss-sub">
              위 진단 숫자를 바탕으로, 빈칸만 채워 주세요. 부담 없이 가능한 범위부터 상담해 드려요.
            </p>
          </div>
          <ConsultationForm inputs={inputs} simulationResult={result} />
        </div>

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
