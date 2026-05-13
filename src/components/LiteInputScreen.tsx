import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { LiteInputValues } from '../lib/liteToSimulator';
import { LITE_DEFAULTS } from '../lib/liteToSimulator';

interface Props {
  onSubmit: (values: LiteInputValues) => void;
  initialValues?: LiteInputValues;
}

function Field({
  label,
  hint,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  suffix: string;
  min: number;
  max: number;
  step?: number;
}) {
  const clamped = Math.min(max, Math.max(min, value || 0));
  return (
    <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
      <p className="text-[13px] font-semibold text-toss-ink">{label}</p>
      {hint ? (
        <p className="mt-1 mb-2 text-[12px] leading-snug text-toss-sub">{hint}</p>
      ) : (
        <div className="mb-1" />
      )}
      <div className="mt-1 flex items-baseline justify-end gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 text-right text-[26px] font-bold leading-none tracking-tight text-toss-ink border-0 border-b-2 border-toss-line focus:border-toss-blue outline-none bg-transparent min-w-0 py-1 transition-colors"
        />
        <span className="text-[15px] font-medium text-toss-sub shrink-0 pb-1">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-4 h-1.5 rounded-full accent-[#3182f6] bg-toss-line"
      />
    </div>
  );
}

export default function LiteInputScreen({ onSubmit, initialValues }: Props) {
  const [v, setV] = useState<LiteInputValues>(initialValues ?? LITE_DEFAULTS);

  function set<K extends keyof LiteInputValues>(key: K) {
    return (n: number) => setV((prev) => ({ ...prev, [key]: n }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (v.retirementAge <= v.currentAge) return;
    onSubmit(v);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-screen bg-toss-canvas pb-36">
      <header className="px-5 pt-10 pb-6 bg-toss-canvas">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-toss-blue shadow-sm ring-1 ring-black/[0.04]">
          간편 진단
        </span>
        <h1 className="mt-4 text-[26px] font-bold leading-[1.35] tracking-tight text-toss-ink">
          내 노후,
          <br />
          <span className="text-toss-blue">지금 얼마나 버틸까요?</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-toss-sub">
          핵심만 입력하면 한계선을 빠르게 확인할 수 있어요.
        </p>
        <div className="mt-5 rounded-2xl bg-white/90 px-4 py-3 text-[12px] leading-relaxed text-toss-sub shadow-sm ring-1 ring-black/[0.04]">
          월 저축은 은행·증권·보험을 합산해 주세요. 내부적으로 표준 비율로 나누어 계산해요.
        </div>
      </header>

      <div className="flex-1 px-4 flex flex-col gap-3">
        <Field
          label="현재 나이"
          value={v.currentAge}
          onChange={(n) => {
            setV((prev) => {
              const age = n;
              let retire = prev.retirementAge;
              if (retire <= age) retire = Math.min(75, age + 1);
              return { ...prev, currentAge: age, retirementAge: retire };
            });
          }}
          min={25}
          max={58}
          suffix="세"
        />
        <Field
          label="은퇴 희망 나이"
          value={v.retirementAge}
          onChange={set('retirementAge')}
          min={v.currentAge + 1}
          max={75}
          suffix="세"
        />
        <Field
          label="현재 준비 자산"
          hint="예·적금·투자·보험 적립 등 합산"
          value={v.currentSavingsMan}
          onChange={set('currentSavingsMan')}
          min={0}
          max={100000}
          step={100}
          suffix="만 원"
        />
        <Field
          label="매월 저축 합계"
          hint="은행·증권·보험 월 납입 합산"
          value={v.monthlySavingTotalMan}
          onChange={set('monthlySavingTotalMan')}
          min={0}
          max={500}
          step={10}
          suffix="만 원"
        />
        <Field
          label="세전 연봉 (국민연금 산정용)"
          value={v.annualSalaryMan}
          onChange={set('annualSalaryMan')}
          min={3000}
          max={30000}
          step={100}
          suffix="만 원"
        />
        <Field
          label="은퇴 후 희망 월 생활비"
          hint="지금 기준 돈의 크기로 입력"
          value={v.monthlyExpenseMan}
          onChange={set('monthlyExpenseMan')}
          min={50}
          max={1000}
          step={10}
          suffix="만 원"
        />

        {v.retirementAge <= v.currentAge && (
          <p className="text-[13px] text-red-500 font-medium px-1">은퇴 나이는 현재 나이보다 커야 해요.</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-toss-line bg-white/95 px-4 pb-8 pt-3 backdrop-blur-md">
        <button
          type="submit"
          disabled={v.retirementAge <= v.currentAge}
          className="flex w-full items-center justify-center gap-1 rounded-2xl bg-toss-blue py-4 text-[16px] font-semibold text-white shadow-lg shadow-toss-blue/25 transition hover:bg-toss-bluePress active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
        >
          간편 진단 결과 보기
          <ChevronRight size={18} strokeWidth={2.25} />
        </button>
        <p className="mt-2.5 text-center text-[11px] text-toss-sub">
          본 결과는 참고용이에요. 세부 비중·세법은 상담 시 안내드려요.
        </p>
        <Link
          to="/pro"
          className="mt-2 block text-center text-[12px] font-medium text-toss-sub underline decoration-toss-line underline-offset-4 hover:text-toss-ink"
        >
          설계사 전용 · 상세 진단
        </Link>
      </div>
    </form>
  );
}
