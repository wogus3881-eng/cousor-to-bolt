import type { LiteInputValues } from '../../lib/liteToSimulator';

export type WizardStepId =
  | 'welcome'
  | 'currentAge'
  | 'retirementAge'
  | 'annualSalary'
  | 'privatePension'
  | 'privatePensionAmount'
  | 'currentSavings'
  | 'monthlySaving'
  | 'monthlyExpense';

export interface WizardStepMeta {
  id: WizardStepId;
  title: string;
  subtitle?: string;
}

export const WIZARD_STEPS: WizardStepMeta[] = [
  {
    id: 'welcome',
    title: '내 노후, 지금 얼마나 버틸까요?',
    subtitle: '7가지만 순서대로 알려주시면 돼요. 대략적인 값이면 충분해요.',
  },
  {
    id: 'currentAge',
    title: '먼저, 현재 나이를 알려주세요',
    subtitle: '25세부터 58세까지 입력할 수 있어요.',
  },
  {
    id: 'retirementAge',
    title: '언제쯤 은퇴하고 싶으세요?',
    subtitle: '희망하시는 은퇴 나이를 골라 주세요.',
  },
  {
    id: 'annualSalary',
    title: '연 소득은 얼마 정도인가요?',
    subtitle: '직장인은 세전 연봉, 자영업자는 월평균 소득 × 12개월로 대략 입력해 주세요.',
  },
  {
    id: 'privatePension',
    title: '개인연금에 가입 중이신가요?',
    subtitle: '연금저축·IRP 등 월 납입 중인 퇴직연금이 있으면 예를 눌러 주세요.',
  },
  {
    id: 'privatePensionAmount',
    title: '개인연금, 한 달에 얼마씩 넣고 계세요?',
    subtitle: '연금저축·IRP 등 합산 금액이에요.',
  },
  {
    id: 'currentSavings',
    title: '지금까지 모아 둔 돈은 얼마인가요?',
    subtitle: '예·적금·투자·보험 적립 등을 합산해서 대략 입력해 주세요.',
  },
  {
    id: 'monthlySaving',
    title: '한 달에 얼마나 모으고 계세요?',
    subtitle: '은행·증권·보험·개인연금 월 납입까지 모두 합산해 주세요.',
  },
  {
    id: 'monthlyExpense',
    title: '은퇴 후, 한 달에 얼마씩 쓰고 싶으세요?',
    subtitle: '지금 기준 돈의 크기로 입력해 주세요.',
  },
];

export function getVisibleSteps(values: LiteInputValues): WizardStepMeta[] {
  return WIZARD_STEPS.filter((step) => {
    if (step.id === 'privatePensionAmount') return values.hasPrivatePension;
    return true;
  });
}

export function canAdvanceStep(stepId: WizardStepId, values: LiteInputValues): boolean {
  switch (stepId) {
    case 'welcome':
      return true;
    case 'currentAge':
      return values.currentAge >= 25 && values.currentAge <= 58;
    case 'retirementAge':
      return values.retirementAge > values.currentAge && values.retirementAge <= 75;
    case 'annualSalary':
      return values.annualSalaryMan >= 3000;
    case 'privatePension':
      return true;
    case 'privatePensionAmount':
      return values.privatePensionMonthlyMan >= 1;
    case 'currentSavings':
      return values.currentSavingsMan >= 0;
    case 'monthlySaving':
      return values.monthlySavingTotalMan >= 0;
    case 'monthlyExpense':
      return values.monthlyExpenseMan >= 50;
    default:
      return true;
  }
}
