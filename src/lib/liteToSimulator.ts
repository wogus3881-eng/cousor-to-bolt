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
  /** 연금저축·IRP 등 개인연금 가입 여부 */
  hasPrivatePension: boolean;
  /** 가입 시 월 납입(만 원). 미가입이면 무시 */
  privatePensionMonthlyMan: number;
  annualSalaryMan: number;
  currentSavingsMan: number;
  /** 월 저축 합계 (만 원) — 내부에서 은행/증권/보험 비율로 나눕니다 */
  monthlySavingTotalMan: number;
  monthlyExpenseMan: number;
}

/** 개인연금(보험) 버킷 비율. 나머지(은행·증권)는 나이대별로 나눕니다 */
export const LITE_BUCKET_RATIO = {
  insurance: 0.2,
} as const;

/** 나이대가 올라갈수록 안전자산(은행) 비중을 높이는 간단한 스냅샷 배분.
 *  30대 3:7, 40대 4:6, 50대 5:5, 60대 6:4 (은행:증권) 패턴을 20·70대까지 확장. */
export function bankShareForAge(age: number): number {
  if (age < 30) return 0.2;
  if (age < 40) return 0.3;
  if (age < 50) return 0.4;
  if (age < 60) return 0.5;
  if (age < 70) return 0.6;
  return 0.7;
}

function calcDefaultPensionYears(currentAge: number) {
  return Math.min(40, Math.max(10, Math.max(0, 60 - currentAge)));
}

/**
 * 라이트 입력 → 프로와 동일한 SimulatorInputs 로 변환.
 * 안 적은 항목은 프로 기본값과 동일한 가정을 둡니다.
 */
export function liteInputToSimulator(raw: LiteInputValues): SimulatorInputs {
  const monthlyTotal = raw.monthlySavingTotalMan * MAN;
  const defaultInsurance = monthlyTotal * LITE_BUCKET_RATIO.insurance;
  const bankOfRemainder = bankShareForAge(raw.currentAge);

  let monthlyInsurance: number;
  let remainderForBankStock: number;

  if (raw.hasPrivatePension && raw.privatePensionMonthlyMan > 0) {
    const userIns = raw.privatePensionMonthlyMan * MAN;
    monthlyInsurance = Math.min(userIns, monthlyTotal);
    remainderForBankStock = Math.max(0, monthlyTotal - monthlyInsurance);
  } else {
    monthlyInsurance = defaultInsurance;
    remainderForBankStock = Math.max(0, monthlyTotal - monthlyInsurance);
  }

  const monthlyBank = remainderForBankStock * bankOfRemainder;
  const monthlyStock = remainderForBankStock * (1 - bankOfRemainder);

  return {
    currentAge: raw.currentAge,
    retirementAge: raw.retirementAge,
    pensionYears: calcDefaultPensionYears(raw.currentAge),
    currentSavings: raw.currentSavingsMan * MAN,
    monthlyBank,
    bankRate: DEFAULT_BANK_RATE,
    monthlyStock,
    stockRate: DEFAULT_STOCK_RATE,
    monthlyInsurance,
    insuranceRate: DEFAULT_INS_RATE,
    insurancePaymentYears: 10 * 12, // 단위: 개월 (10년 납입 가정)
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
  hasPrivatePension: false,
  privatePensionMonthlyMan: 20,
  annualSalaryMan: 5000,
  currentSavingsMan: 5000,
  monthlySavingTotalMan: 100,
  monthlyExpenseMan: 300,
};
