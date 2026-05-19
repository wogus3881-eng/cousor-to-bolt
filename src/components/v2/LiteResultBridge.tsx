import { ArrowRight, HeartHandshake, Sparkles } from 'lucide-react';
import { LITE_COLUMN_CLASS } from '../liteLayout';

interface Props {
  onContinue: () => void;
}

/** v2 전용 — 부담스러운 숫자 결과 전, 짧은 응원·안내 */
export default function LiteResultBridge({ onContinue }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-toss-canvas">
      <div className={`${LITE_COLUMN_CLASS} flex flex-1 flex-col px-3 pb-32 pt-10`}>
        <div className="animate-fade-in rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <Sparkles size={22} className="text-toss-blue" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 text-[22px] font-bold leading-snug tracking-tight text-toss-ink">
            입력 완료!
            <br />
            <span className="text-toss-blue">이미 한 걸음 나아셨어요</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-toss-sub">
            많은 분들이 이 단계에서 &ldquo;어렵겠다&rdquo;고 느끼지만, 지금 하신 건 <strong className="text-toss-ink">시작</strong>
            이에요. 숫자는 정답이 아니라, 대화를 시작하기 위한 참고 자료예요.
          </p>
        </div>

        <div className="animate-fade-in mt-3 space-y-2.5 rounded-[20px] border border-toss-line bg-white/80 p-5" style={{ animationDelay: '80ms' }}>
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <HeartHandshake size={18} className="text-emerald-600" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-toss-ink">결과를 보기 전에 알아두세요</p>
              <p className="mt-1 text-[12px] leading-relaxed text-toss-sub">
                아래 결과는 <strong className="text-toss-ink">참고용 시뮬레이션</strong>이에요. 부족해 보여도 괜찮아요 — 저축
                습관·세금·연금 구조를 조금만 바꿔도 달라질 수 있어요.
              </p>
            </div>
          </div>
          <ul className="space-y-2 pl-1 text-[12px] leading-relaxed text-toss-sub">
            <li className="flex gap-2">
              <span className="font-bold text-toss-blue">1.</span>
              <span>점수·그래프는 방향을 잡는 데 도움이 되는 정도로만 봐 주세요.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-toss-blue">2.</span>
              <span>걱정되는 부분은 무료 상담에서 함께 풀어 드릴 수 있어요.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-toss-blue">3.</span>
              <span>지금 입력하신 값은 언제든 다시 바꿔 볼 수 있어요.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-toss-line bg-white/95 backdrop-blur-md">
        <div className={`${LITE_COLUMN_CLASS} px-3 pb-5 pt-2.5`}>
          <button
            type="button"
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-toss-blue py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-toss-blue/25 transition hover:bg-toss-bluePress active:scale-[0.99]"
          >
            내 결과 확인하기
            <ArrowRight size={18} strokeWidth={2.25} />
          </button>
          <p className="mt-2 text-center text-[10px] text-toss-sub">본 결과는 참고용이며, 투자·보험 권유가 아닙니다.</p>
        </div>
      </div>
    </div>
  );
}
