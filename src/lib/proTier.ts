export type ProTier = 'basic' | 'plus';

export interface ProFeatureFlags {
  liveAdjustment: boolean;
  taxDetailSection: boolean;
  taxScenarioCompare: boolean;
  yearByYearTable: boolean;
  lifecycleSettings: boolean;
  solutionInsightBox: boolean;
  reportWatermark: boolean;
  unlimitedPrint: boolean;
  unlimitedSimulations: boolean;
  pension401kBucket: boolean;
  pensionStartAgeSelect: boolean;
  scenarioCompare3: boolean;
  isaCalculation: boolean;
  breakEvenAnalysis: boolean;
  taxSavingsChart: boolean;
}

export const PRO_TIER_META: Record<
  ProTier,
  { label: string; shortLabel: string; description: string; path: string }
> = {
  basic: {
    label: 'Pro Basic',
    shortLabel: 'Basic',
    description: '정밀 입력 · 핵심 진단 · 제한 리포트',
    path: '/pro/basic',
  },
  plus: {
    label: 'Pro Plus',
    shortLabel: 'Plus',
    description: '실시간 조정 · 세금 시나리오 · 무제한 리포트',
    path: '/pro/plus',
  },
};

export const PRO_BASIC_LIMITS = {
  simulationsPerMonth: 30,
  printsPerMonth: 5,
} as const;

export function proFeatures(tier: ProTier): ProFeatureFlags {
  const isPlus = tier === 'plus';
  return {
    liveAdjustment: isPlus,
    taxDetailSection: isPlus,
    taxScenarioCompare: isPlus,
    yearByYearTable: isPlus,
    lifecycleSettings: isPlus,
    solutionInsightBox: isPlus,
    reportWatermark: !isPlus,
    unlimitedPrint: isPlus,
    unlimitedSimulations: isPlus,
    pension401kBucket: true,
    pensionStartAgeSelect: true,
    scenarioCompare3: isPlus,
    isaCalculation: isPlus,
    breakEvenAnalysis: isPlus,
    taxSavingsChart: isPlus,
  };
}
