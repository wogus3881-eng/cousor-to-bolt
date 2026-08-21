import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { LiteInputValues } from '../../lib/liteToSimulator';
import { LiteLegalDisclaimerCompact } from '../LiteLegalDisclaimer';
import { LITE_COLUMN_CLASS } from '../liteLayout';
import LiteWizardField from './LiteWizardField';

interface Props {
  onSubmit: (values: LiteInputValues) => void;
}

/** 클릭형 은퇴 희망 나이 — 상담 없이 내부적으로 65세 고정 */
const FIXED_RETIREMENT_AGE = 65;

const AGE_BRACKETS = [
  { label: '30대', age: 35 },
  { label: '40대', age: 45 },
  { label: '50대', age: 55 },
] as const;

const INCOME_BRACKETS = [
  { label: '4,000만원 미만', valueMan: 3000 },
  { label: '4,000~6,000만원', valueMan: 5000 },
  { label: '6,000~8,000만원', valueMan: 7000 },
  { label: '8,000만원 이상', valueMan: 10000 },
] as const;

const EXPENSE_BRACKETS = [
  { valueMan: 300, label: '300만원 · 기본적인 생활', caption: '생활비 위주, 큰 씀씀이 없이' },
  { valueMan: 400, label: '400만원 · 여유로운 생활', caption: '외식·취미 여유 있게' },
  { valueMan: 500, label: '500만원 · 풍족한 생활', caption: '여행·자기관리 챙기며' },
  { valueMan: 700, label: '700만원+ · 프리미엄 생활', caption: '골프·해외여행 자유롭게' },
] as const;

type StepId = 'welcome' | 'monthlyExpense' | 'currentAge' | 'annualSalary' | 'currentSavings' | 'monthlySaving';

const STEPS: { id: StepId; title: string; subtitle?: string }[] = [
  {
    id: 'welcome',
    title: '내 노후, 지금 얼마나 버틸까요?',
    subtitle: '5가지만 클릭·입력하면 돼요. 대략적인 값이면 충분해요.',
  },
  {
    id: 'monthlyExpense',
    title: '은퇴 후, 한 달에 얼마씩 쓰고 싶으세요?',
    subtitle: '원하는 생활 수준에 가까운 항목을 골라 주세요. (지금 기준 돈의 크기예요)',
  },
  {
    id: 'currentAge',
    title: '현재 나이대를 골라 주세요',
    subtitle: '연령대의 중앙값으로 계산해요.',
  },
  {
    id: 'annualSalary',
    title: '연 소득은 어느 구간인가요?',
    subtitle: '직장인은 세전 연봉, 자영업자는 월평균 소득 × 12개월 기준이에요.',
  },
  {
    id: 'currentSavings',
    title: '지금까지 모아 둔 돈은 얼마인가요?',
    subtitle: '예·적금·투자·보험 적립·개인연금 등을 합산해서 대략 입력해 주세요.',
  },
  {
    id: 'monthlySaving',
    title: '한 달에 얼마나 모으고 계세요?',
    subtitle: '은행·증권·보험·개인연금(연금저축·IRP) 월 납입까지 모두 합산해 주세요.',
  },
];

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 py-3.5 text-[14px] font-semibold transition ${
        selected
          ? 'border-toss-blue bg-blue-50 text-toss-blue'
          : 'border-toss-line bg-toss-canvas text-toss-sub hover:border-toss-blue/30'
      }`}
    >
      {children}
    </button>
  );
}

function ChoiceCard({
  selected,
  onClick,
  label,
  caption,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  caption: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border-2 px-4 py-3 text-left transition ${
        selected
          ? 'border-toss-blue bg-blue-50'
          : 'border-toss-line bg-toss-canvas hover:border-toss-blue/30'
      }`}
    >
      <p className={`text-[14px] font-semibold ${selected ? 'text-toss-blue' : 'text-toss-ink'}`}>{label}</p>
      <p className="mt-0.5 text-[12px] text-toss-sub">{caption}</p>
    </button>
  );
}

const initialValues: LiteInputValues = {
  currentAge: 45,
  retirementAge: FIXED_RETIREMENT_AGE,
  hasPrivatePension: false,
  privatePensionMonthlyMan: 0,
  annualSalaryMan: 5000,
  currentSavingsMan: 5000,
  monthlySavingTotalMan: 100,
  monthlyExpenseMan: 300,
};

export default function LiteWizardScreenQuick({ onSubmit }: Props) {
  const [values, setValues] = useState<LiteInputValues>(initialValues);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function set<K extends keyof LiteInputValues>(key: K) {
    return (val: LiteInputValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));
  }

  function canAdvance(): boolean {
    switch (currentStep.id) {
      case 'monthlyExpense':
        return EXPENSE_BRACKETS.some((b) => b.valueMan === values.monthlyExpenseMan);
      case 'currentAge':
        return AGE_BRACKETS.some((b) => b.age === values.currentAge);
      case 'annualSalary':
        return INCOME_BRACKETS.some((b) => b.valueMan === values.annualSalaryMan);
      default:
        return true;
    }
  }

  function goNext() {
    if (!canAdvance()) return;
    if (isLast) {
      onSubmit({ ...values, retirementAge: FIXED_RETIREMENT_AGE });
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  }

  function renderStepContent(id: StepId) {
    switch (id) {
      case 'welcome':
        return (
          <div className="space-y-3 text-[13px] leading-relaxed text-toss-sub">
            <p>
              한 화면에 <strong className="text-toss-ink">질문 하나씩</strong>만 나와요. 대부분 클릭만 하면 돼요.
            </p>
            <p className="text-[11px]">약 1분이면 끝나요.</p>
          </div>
        );

      case 'monthlyExpense':
        return (
          <div className="flex flex-col gap-2.5">
            {EXPENSE_BRACKETS.map((b) => (
              <ChoiceCard
                key={b.valueMan}
                selected={values.monthlyExpenseMan === b.valueMan}
                onClick={() => set('monthlyExpenseMan')(b.valueMan)}
                label={b.label}
                caption={b.caption}
              />
            ))}
          </div>
        );

      case 'currentAge':
        return (
          <div className="grid grid-cols-3 gap-2.5">
            {AGE_BRACKETS.map((b) => (
              <ChoiceButton key={b.age} selected={values.currentAge === b.age} onClick={() => set('currentAge')(b.age)}>
                {b.label}
              </ChoiceButton>
            ))}
          </div>
        );

      case 'annualSalary':
        return (
          <div className="grid grid-cols-2 gap-2.5">
            {INCOME_BRACKETS.map((b) => (
              <ChoiceButton
                key={b.valueMan}
                selected={values.annualSalaryMan === b.valueMan}
                onClick={() => set('annualSalaryMan')(b.valueMan)}
              >
                {b.label}
              </ChoiceButton>
            ))}
          </div>
        );

      case 'currentSavings':
        return (
          <LiteWizardField
            label="현재 준비 자산"
            value={values.currentSavingsMan}
            onChange={set('currentSavingsMan')}
            min={0}
            max={100000}
            step={100}
            suffix="만 원"
          />
        );

      case 'monthlySaving':
        return (
          <LiteWizardField
            label="매월 저축 합계"
            hint="개인연금 월 납입도 포함해 주세요."
            value={values.monthlySavingTotalMan}
            onChange={set('monthlySavingTotalMan')}
            min={0}
            max={500}
            step={10}
            suffix="만 원"
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-toss-canvas pb-32">
      <div className={`${LITE_COLUMN_CLASS} flex min-h-0 flex-1 flex-col`}>
        {currentStep.id !== 'welcome' && (
          <div className="px-3 pt-5">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-toss-sub">
              <span>
                {stepIndex}/{STEPS.length - 1}단계
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-toss-line">
              <div
                className="h-full rounded-full bg-toss-blue transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col px-3 pt-4">
          <span className="inline-flex w-fit items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-toss-blue shadow-sm ring-1 ring-black/[0.04]">
            간편 진단 · 빠른 버전
          </span>

          <div key={currentStep.id} className="mt-4 flex flex-1 flex-col animate-fade-in">
            <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]">
              <h1 className="text-[20px] font-bold leading-snug tracking-tight text-toss-ink">{currentStep.title}</h1>
              {currentStep.subtitle ? (
                <p className="mt-2 text-[13px] leading-relaxed text-toss-sub">{currentStep.subtitle}</p>
              ) : null}
              <div className="mt-5">{renderStepContent(currentStep.id)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-toss-line bg-white/95 backdrop-blur-md">
        <div className={`${LITE_COLUMN_CLASS} px-3 pb-5 pt-2.5`}>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-toss-line bg-white text-toss-ink transition hover:bg-toss-canvas active:scale-[0.98]"
                aria-label="이전"
              >
                <ArrowLeft size={20} strokeWidth={2.25} />
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-toss-blue py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-toss-blue/25 transition hover:bg-toss-bluePress active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
            >
              {isLast ? (
                <>
                  간편 진단 결과 보기
                  <Check size={18} strokeWidth={2.25} />
                </>
              ) : currentStep.id === 'welcome' ? (
                <>
                  시작하기
                  <ArrowRight size={18} strokeWidth={2.25} />
                </>
              ) : (
                <>
                  다음
                  <ArrowRight size={18} strokeWidth={2.25} />
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-toss-sub">
            본 결과는 참고용이에요. 세부 비중·세법은 상담 시 안내드려요.
          </p>
          <div className="mt-1.5 px-0.5">
            <LiteLegalDisclaimerCompact />
          </div>
        </div>
      </div>
    </div>
  );
}
