import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { LiteInputValues } from '../lib/liteToSimulator';
import { LITE_DEFAULTS } from '../lib/liteToSimulator';
import { stashLiteValuesForPro } from '../lib/liteProHandoff';
import { LiteLegalDisclaimerCompact } from './LiteLegalDisclaimer';
import { LITE_COLUMN_CLASS } from './liteLayout';

interface Props {
  onSubmit: (values: LiteInputValues) => void;
  initialValues?: LiteInputValues;
}

function mergeLiteInitial(partial?: LiteInputValues): LiteInputValues {
  return {
    ...LITE_DEFAULTS,
    ...partial,
    hasPrivatePension: partial?.hasPrivatePension ?? LITE_DEFAULTS.hasPrivatePension,
    privatePensionMonthlyMan: partial?.privatePensionMonthlyMan ?? LITE_DEFAULTS.privatePensionMonthlyMan,
  };
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
    <div className="rounded-[16px] bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.035)] ring-1 ring-black/[0.03]">
      <p className="text-[12px] font-semibold text-toss-ink">{label}</p>
      {hint ? (
        <p className="mb-1.5 mt-0.5 text-[11px] leading-snug text-toss-sub">{hint}</p>
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
          className="min-w-0 flex-1 border-0 border-b-2 border-toss-line bg-transparent py-0.5 text-right text-[22px] font-bold leading-none tracking-tight text-toss-ink outline-none transition-colors focus:border-toss-blue"
        />
        <span className="shrink-0 pb-0.5 text-[13px] font-medium text-toss-sub">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full rounded-full bg-toss-line accent-[#3182f6]"
      />
    </div>
  );
}

export default function LiteInputScreen({ onSubmit, initialValues }: Props) {
  const [v, setV] = useState<LiteInputValues>(() => mergeLiteInitial(initialValues));
  const [pensionYesError, setPensionYesError] = useState(false);

  function set<K extends keyof LiteInputValues>(key: K) {
    return (val: LiteInputValues[K]) => setV((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (v.retirementAge <= v.currentAge) return;
    if (v.hasPrivatePension && v.privatePensionMonthlyMan < 1) {
      setPensionYesError(true);
      return;
    }
    setPensionYesError(false);
    onSubmit(v);
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-screen flex-col bg-toss-canvas pb-32">
      <div className={`${LITE_COLUMN_CLASS} flex min-h-0 flex-1 flex-col`}>
        <header className="bg-toss-canvas px-3 pb-4 pt-6">
          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-toss-blue shadow-sm ring-1 ring-black/[0.04]">
            간편 진단
          </span>
          <h1 className="mt-3 text-[23px] font-bold leading-[1.3] tracking-tight text-toss-ink">
            내 노후,
            <br />
            <span className="text-toss-blue">지금 얼마나 버틸까요?</span>
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-toss-sub">
            위에서부터 순서대로만 적으면 돼요. 대략적인 값이면 충분해요.
          </p>
          <div className="mt-3 rounded-2xl bg-white/90 px-3.5 py-2.5 text-[11px] leading-relaxed text-toss-sub shadow-sm ring-1 ring-black/[0.04]">
            월 저축 합계에서 개인연금(연금저축·IRP) 월 납입을 빼지 마세요. 가입 중이면 아래에서 따로 적어 주시면, 나머지는
            은행·증권 쪽으로만 나눕니다.
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-2.5 px-3">
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
            label="세전 연봉 (국민연금 산정용)"
            value={v.annualSalaryMan}
            onChange={set('annualSalaryMan')}
            min={3000}
            max={30000}
            step={100}
            suffix="만 원"
          />

          <div className="rounded-[16px] bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.035)] ring-1 ring-black/[0.03]">
            <p className="text-[12px] font-semibold text-toss-ink">개인연금 가입 여부</p>
            <p className="mt-0.5 text-[11px] leading-snug text-toss-sub">
              연금저축·IRP 등 <strong className="text-toss-ink">월 납입 중인 퇴직연금</strong>이 있으면 예를 눌러 주세요.
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPensionYesError(false);
                  setV((p) => ({ ...p, hasPrivatePension: false }));
                }}
                className={`rounded-xl border-2 py-3 text-[13px] font-semibold transition ${
                  !v.hasPrivatePension
                    ? 'border-toss-blue bg-blue-50 text-toss-blue'
                    : 'border-toss-line bg-toss-canvas text-toss-sub'
                }`}
              >
                아니오
              </button>
              <button
                type="button"
                onClick={() => setV((p) => ({ ...p, hasPrivatePension: true }))}
                className={`rounded-xl border-2 py-3 text-[13px] font-semibold transition ${
                  v.hasPrivatePension
                    ? 'border-toss-blue bg-blue-50 text-toss-blue'
                    : 'border-toss-line bg-toss-canvas text-toss-sub'
                }`}
              >
                예
              </button>
            </div>
            {v.hasPrivatePension && (
              <div className="mt-2.5 border-t border-toss-line pt-2.5">
                <Field
                  label="개인연금 월 납입액"
                  hint="연금저축·IRP 등 합산 (만 원)"
                  value={v.privatePensionMonthlyMan}
                  onChange={(n) => {
                    setPensionYesError(false);
                    setV((p) => ({ ...p, privatePensionMonthlyMan: n }));
                  }}
                  min={1}
                  max={500}
                  step={1}
                  suffix="만 원"
                />
              </div>
            )}
            {pensionYesError && (
              <p className="mt-2 text-[11px] font-medium text-red-500">가입 중이면 월 납입액을 1만 원 이상 입력해 주세요.</p>
            )}
          </div>

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
            hint="은행·증권·보험·개인연금 월 납입까지 모두 합산"
            value={v.monthlySavingTotalMan}
            onChange={set('monthlySavingTotalMan')}
            min={0}
            max={500}
            step={10}
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
            <p className="px-1 text-[13px] font-medium text-red-500">은퇴 나이는 현재 나이보다 커야 해요.</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-toss-line bg-white/95 backdrop-blur-md">
        <div className={`${LITE_COLUMN_CLASS} px-3 pb-5 pt-2.5`}>
          <button
            type="submit"
            disabled={v.retirementAge <= v.currentAge || (v.hasPrivatePension && v.privatePensionMonthlyMan < 1)}
            className="flex w-full items-center justify-center gap-1 rounded-2xl bg-toss-blue py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-toss-blue/25 transition hover:bg-toss-bluePress active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
          >
            간편 진단 결과 보기
            <ChevronRight size={18} strokeWidth={2.25} />
          </button>
          <p className="mt-2 text-center text-[10px] text-toss-sub">
            본 결과는 참고용이에요. 세부 비중·세법은 상담 시 안내드려요.
          </p>
          <div className="mt-1.5 px-0.5">
            <LiteLegalDisclaimerCompact />
          </div>
          <Link
            to="/pro"
            onClick={() => stashLiteValuesForPro(v)}
            className="mt-1.5 block text-center text-[11px] font-medium text-toss-sub underline decoration-toss-line underline-offset-4 hover:text-toss-ink"
          >
            설계사 전용 · 상세 진단
          </Link>
        </div>
      </div>
    </form>
  );
}
