import { Sparkles, TrendingUp } from 'lucide-react';
import type { SimulationResult } from '../lib/calculator';
import { formatKRW } from '../lib/calculator';
import {
  computeLiteReadiness,
  computeRetirementIncomeFlow,
  type LiteReadinessBand,
} from '../lib/liteResultMetrics';

interface Props {
  result: SimulationResult;
}

function bandHeroClass(band: LiteReadinessBand) {
  if (band === 'ok') return 'border-sky-100 bg-gradient-to-br from-sky-50 to-white';
  if (band === 'risk') return 'border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/80';
  return 'border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/60';
}

function ringColor(band: LiteReadinessBand) {
  if (band === 'ok') return '#0ea5e9';
  if (band === 'risk') return '#ef4444';
  return '#f97316';
}

function ScoreRing({ score, band }: { score: number; band: LiteReadinessBand }) {
  const r = 52;
  const stroke = 9;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * (1 - pct);
  const color = ringColor(band);

  return (
    <div className="relative h-[120px] w-[120px] shrink-0">
      <svg width={120} height={120} className="-rotate-90" aria-hidden>
        <circle cx={60} cy={60} r={r} fill="none" stroke="#e5e8eb" strokeWidth={stroke} />
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-[11px] font-semibold text-toss-sub">준비 점수</span>
        <span className="text-[28px] font-extrabold leading-none tracking-tight text-toss-ink">{score}</span>
        <span className="text-[10px] font-medium text-toss-sub">/ 100</span>
      </div>
    </div>
  );
}

function FlowRow({
  label,
  amount,
  need,
  barClass,
}: {
  label: string;
  amount: number;
  need: number;
  barClass: string;
}) {
  const pct = need > 0 ? Math.min(100, (amount / need) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-toss-ink">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums text-toss-ink">{formatKRW(amount)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function buildAdvisorCopy(result: SimulationResult, band: LiteReadinessBand): string {
  const { weakPension, monthlySavingsNeededFor100, dignityEndAge } = result;
  const parts: string[] = [];

  if (band === 'ok') {
    parts.push('입력하신 조건에서는 큰 리스크가 드러나지 않았어요.');
    parts.push('그래도 세법·상품·가족 상황은 사람마다 달라서, 맞춤 점검을 한 번 받아보시면 안심에 도움이 됩니다.');
  } else {
    parts.push('간편 진단 기준으로는 은퇴 이후 현금흐름에 부담이 생길 여지가 있어요.');
    if (weakPension) parts.push('국민연금 가입 기간이 짧게 반영되어, 개인 준비 비중이 더 커질 수 있습니다.');
    if (monthlySavingsNeededFor100 > 0 && dignityEndAge !== null) {
      parts.push(
        `참고로, 100세까지 맞추려면 매월 약 ${formatKRW(Math.round(monthlySavingsNeededFor100))} 정도의 추가 저축이 필요할 수 있다는 추정치도 나왔어요(단순 가정).`,
      );
    }
    parts.push('대출·보험·ISA·연금 구조를 어떻게 쌓을지 전문가와 짧게라도 상의해 보시길 권해 드려요.');
  }

  return parts.join(' ');
}

export default function LiteResultDashboard({ result }: Props) {
  const readiness = computeLiteReadiness(result);
  const flow = computeRetirementIncomeFlow(result);
  const { retirementBalance, dignityEndAge, extraNeeded } = result;
  const monthlyGap = flow.fromAssets;

  const shortageLabel =
    dignityEndAge !== null && dignityEndAge <= 90 && extraNeeded > 0
      ? formatKRW(extraNeeded)
      : dignityEndAge === null
        ? '해당 없음'
        : '참고 범위 밖';

  const limitLabel = dignityEndAge === null ? '100세+ 추정' : `약 ${dignityEndAge}세`;

  return (
    <div className="flex flex-col gap-3">
      <section
        className={`rounded-[18px] border p-4 shadow-[0_2px_14px_rgba(0,0,0,0.045)] ring-1 ring-black/[0.03] ${bandHeroClass(readiness.band)}`}
      >
        <p className="text-[12px] font-bold text-toss-ink">은퇴 준비 한눈에 보기</p>
        <div className="mt-3 flex gap-4">
          <ScoreRing score={readiness.score} band={readiness.band} />
          <div className="min-w-0 flex-1 pt-1">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                readiness.band === 'ok'
                  ? 'bg-sky-100 text-sky-800'
                  : readiness.band === 'risk'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {readiness.label}
            </span>
            <p className="mt-2 text-[14px] font-bold leading-snug text-toss-ink">
              {readiness.band === 'ok'
                ? '지금 리듬을 유지할수록 좋아요'
                : '지금 구조를 한 번 점검해 볼 만해요'}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-toss-sub">{readiness.subline}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-[10px] font-medium text-toss-sub">90세까지 부족 추정</p>
          <p className={`mt-1 text-[15px] font-bold tabular-nums ${extraNeeded > 0 ? 'text-red-600' : 'text-toss-ink'}`}>
            {shortageLabel}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-[10px] font-medium text-toss-sub">품격 유지 한계</p>
          <p className="mt-1 text-[15px] font-bold text-emerald-700 tabular-nums">{limitLabel}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-[10px] font-medium text-toss-sub">은퇴 시점 예상 자산</p>
          <p className="mt-1 text-[15px] font-bold text-toss-blue tabular-nums">{formatKRW(retirementBalance)}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-[10px] font-medium text-toss-sub">은퇴 직후 월 부족분</p>
          <p className={`mt-1 text-[15px] font-bold tabular-nums ${monthlyGap > 0 ? 'text-orange-600' : 'text-toss-ink'}`}>
            {formatKRW(monthlyGap)}
          </p>
        </div>
      </section>

      <section className="rounded-[18px] border border-toss-line bg-white p-3.5 shadow-sm ring-1 ring-black/[0.03]">
        <div className="flex items-center gap-2 border-l-[3px] border-toss-blue pl-2">
          <p className="text-[13px] font-bold text-toss-ink">은퇴 직후 월 현금흐름 구조</p>
        </div>
        <p className="mt-1.5 pl-2 text-[11px] leading-relaxed text-toss-sub">
          필요 생활비(물가 반영)를 100%로 두고, 국민연금·보험·자산에서 메울 부분을 나눈 참고도예요.
        </p>
        <div className="mt-3 space-y-3">
          <FlowRow label="필요 생활비" amount={flow.need} need={flow.need} barClass="bg-slate-400" />
          <FlowRow label="국민연금(추정)" amount={flow.pension} need={flow.need} barClass="bg-toss-blue" />
          <FlowRow label="보험·연금 수령" amount={flow.insurance} need={flow.need} barClass="bg-violet-500" />
          <FlowRow label="자산에서 메울 부분" amount={flow.fromAssets} need={flow.need} barClass="bg-orange-500" />
        </div>
      </section>

      <section className="rounded-[18px] border border-navy-800/20 bg-gradient-to-br from-navy-900 to-navy-950 p-4 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Sparkles size={16} className="text-amber-200" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">진단 코멘트</p>
            <p className="text-[13px] font-bold">다음 단계 가이드</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-navy-100/95">{buildAdvisorCopy(result, readiness.band)}</p>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <TrendingUp size={14} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[11px] leading-relaxed text-navy-100/90">
            숫자만으로 결정하지 마시고, <strong className="text-white">무료 상담</strong>에서 가족·세금·상품까지 한 번에
            짚어보세요.
          </p>
        </div>
      </section>
    </div>
  );
}
