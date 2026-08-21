import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import ConsultationForm from './ConsultationForm';
import LiteLegalDisclaimer from './LiteLegalDisclaimer';
import LiteResultCharts from './LiteResultCharts';
import LiteResultDashboard from './LiteResultDashboard';
import { DEFAULT_BANK_RATE, DEFAULT_INS_RATE, DEFAULT_STOCK_RATE, type SimulationResult } from '../lib/calculator';
import { LITE_BUCKET_RATIO, bankShareForAge } from '../lib/liteToSimulator';
import { LITE_COLUMN_CLASS } from './liteLayout';

interface Props {
  result: SimulationResult;
  onBack: () => void;
  hideConsultation?: boolean;
  /** true면 상담 신청 전까지 상세 분석(4~8번 영역)을 잠금 처리합니다 */
  enableGate?: boolean;
}

export default function LiteResultScreen({ result, onBack, hideConsultation = false, enableGate = false }: Props) {
  const { inputs, dignityEndAge, weakPension } = result;

  const isSafe = dignityEndAge === null;

  const bankShare = bankShareForAge(inputs.currentAge);
  const bankPct = Math.round(bankShare * 100);
  const stockPct = 100 - bankPct;

  const consultRef = useRef<HTMLDivElement>(null);
  const [showJumpButton, setShowJumpButton] = useState(!hideConsultation);
  const [unlocked, setUnlocked] = useState(false);

  // hideConsultation이면 상담폼 자체가 없어 게이트가 무의미하므로 항상 전체 공개
  const gateActive = enableGate && !hideConsultation;
  const dashboardVariant = gateActive && !unlocked ? 'teaser' : 'full';

  useEffect(() => {
    if (hideConsultation || !consultRef.current) return;
    const el = consultRef.current;
    const observer = new IntersectionObserver(([entry]) => setShowJumpButton(!entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hideConsultation]);

  function scrollToConsult() {
    document.getElementById('lite-consult')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="flex min-h-screen flex-col bg-toss-canvas">
      <header className="sticky top-0 z-20 border-b border-toss-line bg-white/90 backdrop-blur-md">
        <div className={`${LITE_COLUMN_CLASS} px-3 pb-3 pt-6`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-toss-canvas text-toss-ink transition hover:bg-toss-line/80 active:scale-95"
              aria-label="뒤로"
            >
              <ChevronLeft size={20} strokeWidth={2.25} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-toss-sub">고객 간편 진단</p>
              <p className="truncate text-[15px] font-bold text-toss-ink">은퇴 진단 결과</p>
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

      <div className={`${LITE_COLUMN_CLASS} flex flex-1 flex-col gap-3 px-3 py-4`}>
        <div id="lite-result-capture" className="flex flex-col gap-3">
          <LiteResultDashboard result={result} variant={dashboardVariant} onUnlockClick={scrollToConsult} />

          {weakPension && (
            <div className="flex gap-2.5 rounded-2xl border border-amber-100 bg-amber-50/90 p-3.5">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[12px] leading-relaxed text-amber-900">
                국민연금 가입 기간이 짧게 반영되었습니다. 개인 준비 비중이 더 중요할 수 있습니다.
              </p>
            </div>
          )}

          <LiteResultCharts result={result} variant={dashboardVariant} />

          {dashboardVariant === 'full' && (
            <div className="space-y-1.5 rounded-2xl border border-toss-line bg-white px-3.5 py-2.5 text-[10px] leading-relaxed text-toss-sub">
              <p>
                <strong className="text-toss-ink">간편 진단 가정:</strong> 월 저축 합계 중 개인연금(연금저축·IRP 등) 월
                납입분(있을 경우 실제 입력값, 없으면 전체의 {Math.round(LITE_BUCKET_RATIO.insurance * 100)}%)을 먼저 뗀 뒤,
                나머지를 입력하신 나이({inputs.currentAge}세)에 맞춰 은행 {bankPct}% : 증권 {stockPct}% 비율로
                나누었습니다(나이대가 높을수록 은행 비중을 높이는 방식). 개인연금·보험 적립 부분은 시뮬레이터의 연금/보험 버킷에
                반영됩니다. 활동 종료 나이·의료비 등은 표준값을 사용했습니다.
              </p>
              <p>
                은행 연 {DEFAULT_BANK_RATE}%, 개인연금/보험연금 연 {DEFAULT_INS_RATE}%, 증권은 장기 투자형 가정 연{' '}
                {DEFAULT_STOCK_RATE}%로 단순 계산했으며, 실제 상품·시장 수익률과 다를 수 있어요.
              </p>
              <p>준비 점수·그래프는 참고용 휴리스틱이며, 세부 비교는 무료 상담 시 함께 확인할 수 있어요.</p>
            </div>
          )}
        </div>
      </div>

      {!hideConsultation && (
        <div id="lite-consult" ref={consultRef} className={`${LITE_COLUMN_CLASS} scroll-mt-6 px-3 pb-6`}>
          <div className="mb-2.5 rounded-2xl border border-toss-blue/25 bg-gradient-to-r from-blue-50 to-sky-50 px-3.5 py-3 text-center shadow-sm ring-1 ring-toss-blue/10">
            <p className="text-[12px] font-bold text-toss-ink">1분이면 접수 끝 — 먼저 연락드릴게요</p>
            <p className="mt-1 text-[10px] leading-relaxed text-toss-sub">
              위 진단 숫자를 바탕으로, 빈칸만 채워 주세요. 부담 없이 가능한 범위부터 상담해 드려요.
            </p>
          </div>
          <ConsultationForm inputs={inputs} onSubmitSuccess={() => setUnlocked(true)} />
        </div>
      )}

      <div className={`${LITE_COLUMN_CLASS} px-3 pb-6`}>
        <LiteLegalDisclaimer />
      </div>

      {showJumpButton && (
        <button
          type="button"
          onClick={scrollToConsult}
          aria-label="상담 신청란으로 이동"
          className="fixed bottom-5 right-5 z-30 flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-toss-blue text-white shadow-lg shadow-toss-blue/30 transition hover:bg-toss-bluePress"
        >
          <ChevronDown size={22} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
