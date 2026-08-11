export type ProTier = 'trial' | 'basic' | 'pro';

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
  printDisabled: boolean;
  clientProfiles: boolean;
}

export const PRO_TIER_META: Record<
  ProTier,
  { label: string; shortLabel: string; description: string; path: string }
> = {
  trial: {
    label: 'Pro Trial',
    shortLabel: 'Trial',
    description: '무료 체험 · 핵심 진단만 · 횟수 한정',
    path: '/pro/trial',
  },
  basic: {
    label: 'Pro Basic',
    shortLabel: 'Basic',
    description: '정밀 입력 · 핵심 진단 · 제한 리포트',
    path: '/pro/basic',
  },
  pro: {
    label: 'Pro',
    shortLabel: 'Pro',
    description: '실시간 조정 · 세금 시나리오 · 무제한 리포트',
    path: '/pro/pro',
  },
};

export const PRO_BASIC_LIMITS = {
  simulationsPerMonth: 30,
  printsPerMonth: 5,
} as const;

/** Trial은 매달 리셋되는 Basic과 달리, 가입 후 기간·총 횟수로 한 번만 한도가 소진됩니다. */
export const PRO_TRIAL_LIMITS = {
  simulationsTotal: 5,
  validDays: 14,
} as const;

export function proFeatures(tier: ProTier): ProFeatureFlags {
  const isPro = tier === 'pro';
  const isTrial = tier === 'trial';
  return {
    // ── Trial ✅ / Basic ✅ / Pro ✅ (전 티어 공통 기능) ────────────
    pension401kBucket: true,       // 기본 계산 (은퇴자산, 부족액)
    pensionStartAgeSelect: true,   // 국민연금 분석
    lifecycleSettings: true,       // 치료비 리스크 섹션 (계좌별 현재 자산 입력)

    // ── Trial ❌ / Basic ❌ / Pro ✅ (Pro 전용 기능) ──────────────
    yearByYearTable: isPro,        // 연도별 상세 테이블
    liveAdjustment: isPro,         // 실시간 슬라이더 조정
    scenarioCompare3: isPro,       // 3버킷 시나리오 비교
    solutionInsightBox: isPro,     // 절세 인사이트 상세
    isaCalculation: isPro,         // ISA/IRP 세금 분석
    unlimitedPrint: isPro,         // PDF 출력 (무제한)
    clientProfiles: isPro,         // 고객 정보 저장 · 불러오기

    // ── 기타 연관 flags ──────────────────────────────────────────
    taxDetailSection: isPro,
    taxScenarioCompare: isPro,
    breakEvenAnalysis: isPro,
    taxSavingsChart: isPro,
    reportWatermark: !isPro,       // Trial·Basic은 워터마크 표시
    unlimitedSimulations: isPro,
    printDisabled: isTrial,        // Trial은 리포트 저장 자체가 불가 (Basic 이상부터 가능)
  };
}
