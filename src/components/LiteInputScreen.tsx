import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
      <p className="text-xs font-semibold text-navy-800">{label}</p>
      {hint && <p className="text-[10px] text-navy-400 mt-0.5 mb-2">{hint}</p>}
      <div className="flex items-baseline gap-2 mt-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 text-right text-xl font-extrabold text-navy-900 border-b-2 border-gold-500 outline-none bg-transparent min-w-0"
        />
        <span className="text-sm text-navy-400 shrink-0">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-3 accent-navy-600"
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
    <form onSubmit={handleSubmit} className="flex flex-col min-h-screen bg-navy-950 pb-32">
      <div className="bg-gradient-to-b from-navy-900 to-navy-800 px-5 pt-12 pb-8 border-b border-navy-700">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-gold-400 uppercase bg-navy-800 border border-gold-700/40 px-3 py-1 rounded-full mb-3">
              간편 진단
            </span>
            <h1 className="text-[24px] font-extrabold text-white leading-tight tracking-tight">
              내 노후,
              <br />
              <span className="text-gold-400">언제쯤 흔들릴까요?</span>
            </h1>
            <p className="text-sm text-navy-300 mt-2 leading-relaxed">
              핵심만 입력하면 대략적인 한계선을 빠르게 확인할 수 있습니다.
            </p>
          </div>
          <Star className="text-gold-400 shrink-0 mt-1 fill-gold-400/30" size={28} />
        </div>
        <p className="text-[10px] text-navy-400 mt-4 leading-snug border border-navy-600/50 rounded-xl px-3 py-2 bg-navy-800/40">
          월 저축 합계는 은행·증권·보험을 합산해 입력해 주세요. 내부적으로 표준 비율로 나누어 계산합니다.
        </p>
      </div>

      <div className="flex-1 px-4 pt-6 flex flex-col gap-3 bg-slate-50">
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
          <p className="text-xs text-red-500 font-medium px-1">은퇴 나이는 현재 나이보다 커야 합니다.</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-white/95 backdrop-blur border-t border-navy-100 space-y-2 z-10">
        <button
          type="submit"
          disabled={v.retirementAge <= v.currentAge}
          className="w-full bg-gradient-to-r from-navy-800 to-navy-700 hover:from-navy-700 hover:to-navy-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 shadow-xl shadow-navy-900/30 border border-gold-600/30"
        >
          간편 진단 결과 보기
          <ChevronRight size={18} />
        </button>
        <p className="text-[10px] text-center text-navy-400">
          본 결과는 참고용이며, 세부 비중·세법은 상담 시 안내드립니다.
        </p>
        <Link
          to="/pro"
          className="block text-center text-[11px] text-navy-400 hover:text-navy-600 underline underline-offset-2"
        >
          설계사 전용 · 상세 진단 화면
        </Link>
      </div>
    </form>
  );
}
