import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { LiteInputValues } from '../../lib/liteToSimulator';
import { LITE_DEFAULTS } from '../../lib/liteToSimulator';
import { LiteLegalDisclaimerCompact } from '../LiteLegalDisclaimer';
import { LITE_COLUMN_CLASS } from '../liteLayout';
import LiteWizardField from './LiteWizardField';
import { canAdvanceStep, getVisibleSteps, type WizardStepId } from './liteWizardSteps';

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

export default function LiteWizardScreen({ onSubmit, initialValues }: Props) {
  const [values, setValues] = useState<LiteInputValues>(() => mergeLiteInitial(initialValues));
  const [stepId, setStepId] = useState<WizardStepId>('welcome');

  const steps = useMemo(() => getVisibleSteps(values), [values]);
  const stepIndex = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const currentStep = steps[stepIndex] ?? steps[0];
  const activeStepId = currentStep.id;
  const isLast = stepIndex === steps.length - 1;
  const canAdvance = canAdvanceStep(activeStepId, values);
  const progress = steps.length > 1 ? ((stepIndex + 1) / steps.length) * 100 : 100;

  function set<K extends keyof LiteInputValues>(key: K) {
    return (val: LiteInputValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));
  }

  function goNext() {
    if (!canAdvance) return;
    if (isLast) {
      onSubmit(values);
      return;
    }
    setStepId(steps[stepIndex + 1].id);
  }

  function goBack() {
    if (stepIndex === 0) return;
    setStepId(steps[stepIndex - 1].id);
  }

  function renderStepContent(id: WizardStepId) {
    switch (id) {
      case 'welcome':
        return (
          <div className="space-y-3 text-[13px] leading-relaxed text-toss-sub">
            <p>
              한 화면에 <strong className="text-toss-ink">질문 하나씩</strong>만 나와요. 모르는 값은 대략만 적어도 괜찮아요.
            </p>
            <div className="rounded-xl bg-toss-canvas px-3.5 py-3 text-[12px]">
              <p className="font-semibold text-toss-ink">이렇게 진행돼요</p>
              <ol className="mt-2 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-toss-blue text-[10px] font-bold text-white">
                    1
                  </span>
                  나이 · 은퇴 계획
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-toss-blue text-[10px] font-bold text-white">
                    2
                  </span>
                  소득 · 연금 · 저축
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-toss-blue text-[10px] font-bold text-white">
                    3
                  </span>
                  은퇴 후 생활비
                </li>
              </ol>
            </div>
            <p className="text-[11px]">약 2분이면 끝나요.</p>
          </div>
        );

      case 'currentAge':
        return (
          <LiteWizardField
            label="현재 나이"
            value={values.currentAge}
            onChange={(n) => {
              setValues((prev) => {
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
        );

      case 'retirementAge':
        return (
          <>
            <LiteWizardField
              label="은퇴 희망 나이"
              value={values.retirementAge}
              onChange={set('retirementAge')}
              min={values.currentAge + 1}
              max={75}
              suffix="세"
            />
            {values.retirementAge <= values.currentAge && (
              <p className="mt-3 text-[12px] font-medium text-red-500">은퇴 나이는 현재 나이보다 커야 해요.</p>
            )}
          </>
        );

      case 'annualSalary':
        return (
          <LiteWizardField
            label="연 소득"
            hint="국민연금은 상한이 있어 일정 수준 이상 늘지 않아요."
            value={values.annualSalaryMan}
            onChange={set('annualSalaryMan')}
            min={3000}
            max={30000}
            step={100}
            suffix="만 원"
          />
        );

      case 'privatePension':
        return (
          <div className="grid grid-cols-2 gap-2.5">
            <ChoiceButton
              selected={!values.hasPrivatePension}
              onClick={() => setValues((p) => ({ ...p, hasPrivatePension: false }))}
            >
              아니오
            </ChoiceButton>
            <ChoiceButton
              selected={values.hasPrivatePension}
              onClick={() => setValues((p) => ({ ...p, hasPrivatePension: true }))}
            >
              예
            </ChoiceButton>
          </div>
        );

      case 'privatePensionAmount':
        return (
          <LiteWizardField
            label="개인연금 월 납입액"
            value={values.privatePensionMonthlyMan}
            onChange={set('privatePensionMonthlyMan')}
            min={1}
            max={500}
            suffix="만 원"
          />
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

      case 'monthlyExpense':
        return (
          <LiteWizardField
            label="은퇴 후 희망 월 생활비"
            value={values.monthlyExpenseMan}
            onChange={set('monthlyExpenseMan')}
            min={50}
            max={1000}
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
        {activeStepId !== 'welcome' && (
          <div className="px-3 pt-5">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-toss-sub">
              <span>
                {stepIndex}/{steps.length - 1}단계
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
            간편 진단 v2
          </span>

          <div key={activeStepId} className="mt-4 flex flex-1 flex-col animate-fade-in">
            <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]">
              <h1 className="text-[20px] font-bold leading-snug tracking-tight text-toss-ink">{currentStep.title}</h1>
              {currentStep.subtitle ? (
                <p className="mt-2 text-[13px] leading-relaxed text-toss-sub">{currentStep.subtitle}</p>
              ) : null}
              <div className="mt-5">{renderStepContent(activeStepId)}</div>
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
              disabled={!canAdvance}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-toss-blue py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-toss-blue/25 transition hover:bg-toss-bluePress active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
            >
              {isLast ? (
                <>
                  간편 진단 결과 보기
                  <Check size={18} strokeWidth={2.25} />
                </>
              ) : activeStepId === 'welcome' ? (
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
