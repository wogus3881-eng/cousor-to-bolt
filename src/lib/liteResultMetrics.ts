import type { SimulationResult } from './calculator';

export type LiteReadinessBand = 'risk' | 'warn' | 'ok';

export interface LiteReadiness {
  score: number;
  band: LiteReadinessBand;
  label: string;
  subline: string;
}

/** 간편 진단용 0~100 준비 점수 (참고용 휴리스틱) */
export function computeLiteReadiness(result: SimulationResult): LiteReadiness {
  const { dignityEndAge, inputs } = result;
  const retire = inputs.retirementAge;
  const span = Math.max(1, 100 - retire);

  let score: number;
  let subline: string;

  if (dignityEndAge === null) {
    // 100세까지 자산이 마르지 않으면 100점
    score = 100;
    subline =
      '현재 입력 기준으로는 100세까지 큰 부족이 없어 보여요. 실제 세금·수익률·의료비는 상담에서 함께 확인해 보세요.';
  } else {
    // 자산이 바닥나는 나이가 늦을수록 22~99점 구간에서 연속적으로 올라간다.
    const surviveYears = dignityEndAge - retire;
    const ratio = Math.max(0, Math.min(1, surviveYears / span));
    const curved = Math.pow(ratio, 1.25);
    score = Math.round(Math.max(22, Math.min(99, 28 + 71 * curved)));
    const shortfallYears = span - surviveYears;
    subline =
      score < 42
        ? `은퇴 후 약 ${dignityEndAge}세 전후로 여유가 줄어들 수 있어요. 지금 구조를 점검해 볼 시점이에요.`
        : `100세 기준으로 약 ${shortfallYears}년 구간에서 추가 준비가 도움이 될 수 있어요.`;
  }

  let band: LiteReadinessBand;
  let label: string;
  if (score < 42) {
    band = 'risk';
    label = '위험';
  } else if (score < 58) {
    band = 'warn';
    label = '주의';
  } else if (score < 80) {
    band = 'warn';
    label = '관찰';
  } else {
    band = 'ok';
    label = '양호';
  }

  return { score, band, label, subline };
}

export interface RetirementIncomeFlow {
  need: number;
  pension: number;
  insurance: number;
  fromAssets: number;
}

export function computeRetirementIncomeFlow(result: SimulationResult): RetirementIncomeFlow {
  const need = Math.max(1, Math.round(result.inflationAdjustedMonthlyExpense));
  const useNet = result.healthInsuranceTriggered;
  const pensionRaw = useNet ? result.pensionNetAtRetirement : result.pensionAtRetirement;
  const pension = Math.max(0, Math.min(need, Math.round(pensionRaw)));
  const insurance = Math.max(0, Math.min(need - pension, Math.round(result.insAnnuityMonthly)));
  const fromAssets = Math.max(0, need - pension - insurance);
  return { need, pension, insurance, fromAssets };
}
