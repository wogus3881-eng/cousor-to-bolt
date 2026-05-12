import {
  DEFAULT_BANK_RATE,
  DEFAULT_INS_RATE,
  DEFAULT_STOCK_RATE,
  type SimulatorInputs,
} from './calculator';

const MAN = 10000;

/** 라이트 버전 폼 값 — 필요 시 필드만 추가/조정하면 됩니다. */
export interface LiteInputValues {
  currentAge: number;
  retirementAge: number;
  currentSavingsMan: number;
  /** 월 저축 합계 (만 원) — 내부에서 은행/증권/보험 비율로 나눕니다 */
  monthlySavingTotalMan: number;
  annualSalaryMan: number;
  monthlyExpenseMan: number;
}

/** 월 저축을 3버킷으로 나누는 비율 (합계 1). 상품 정책에 맞게 수정 가능 */
export const LITE_BUCKET_RATIO = {
  bank: 0.3,
  stock: 0.5,
  insurance: 0.2,
} as const;

function calcDefaultPensionYears(currentAge: number) {
  return Math.min(40, Math.max(10, Math.max(0, 60 - currentAge)));
}

/**
 * 라이트 입력 → 프로와 동일한 SimulatorInputs 로 변환.
 * 안 적은 항목은 프로 기본값과 동일한 가정을 둡니다.
 */
export function liteInputToSimulator(raw: LiteInputValues): SimulatorInputs {
  const monthlyTotal = raw.monthlySavingTotalMan * MAN;
  return {
    currentAge: raw.currentAge,
    retirementAge: raw.retirementAge,
    pensionYears: calcDefaultPensionYears(raw.currentAge),
    currentSavings: raw.currentSavingsMan * MAN,
    monthlyBank: monthlyTotal * LITE_BUCKET_RATIO.bank,
    bankRate: DEFAULT_BANK_RATE,
    monthlyStock: monthlyTotal * LITE_BUCKET_RATIO.stock,
    stockRate: DEFAULT_STOCK_RATE,
    monthlyInsurance: monthlyTotal * LITE_BUCKET_RATIO.insurance,
    insuranceRate: DEFAULT_INS_RATE,
    insurancePaymentYears: 10,
    annualSalary: raw.annualSalaryMan * MAN,
    monthlyExpense: raw.monthlyExpenseMan * MAN,
    activeEndAge: 78,
    medicalCostEnabled: true,
    monthlyMedicalCost: MAN * 40,
  };
}

export const LITE_DEFAULTS: LiteInputValues = {
  currentAge: 40,
  retirementAge: 60,
  currentSavingsMan: 5000,
  monthlySavingTotalMan: 100,
  annualSalaryMan: 5000,
  monthlyExpenseMan: 300,
};
