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
  const { dignityEndAge, inputs, pensionReplacementRate } = result;
  const retire = inputs.retirementAge;
  const span = Math.max(1, 100 - retire);

  if (dignityEndAge === null) {
    const bonus = Math.min(12, Math.floor(pensionReplacementRate / 4));
    const score = Math.min(96, 80 + bonus);
    return {
      score,
      band: 'ok',
      label: '양호',
      subline:
        '현재 가정만으로는 100세까지 큰 부족이 없어 보여요. 세부 조정은 상담에서 함께 확인해 보세요.',
    };
  }

  const surviveYears = dignityEndAge - retire;
  const ratio = Math.max(0, Math.min(1, surviveYears / span));
  const curved = Math.pow(ratio, 1.25);
  const score = Math.round(Math.max(22, Math.min(72, 28 + 54 * curved)));

  let band: LiteReadinessBand;
  let label: string;
  if (score < 42) {
    band = 'risk';
    label = '위험';
  } else if (score < 58) {
    band = 'warn';
    label = '주의';
  } else {
    band = 'warn';
    label = '관찰';
  }

  const shortfallYears = span - surviveYears;
  const subline =
    band === 'risk'
      ? `은퇴 후 약 ${dignityEndAge}세 전후로 여유가 줄어들 수 있어요. 지금 구조를 점검해 볼 시점이에요.`
      : `100세 기준으로 약 ${shortfallYears}년 구간에서 추가 준비가 도움이 될 수 있어요.`;

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
