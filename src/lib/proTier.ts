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
    // ── Basic ✅ / Plus ✅ (공통 기능) ──────────────────────────────
    pension401kBucket: true,       // 기본 계산 (은퇴자산, 부족액)
    pensionStartAgeSelect: true,   // 국민연금 분석
    lifecycleSettings: true,       // 치료비 리스크 섹션 (계좌별 현재 자산 입력)

    // ── Basic ❌ / Plus ✅ (Plus 전용 기능) ────────────────────────
    yearByYearTable: isPlus,       // 연도별 상세 테이블
    liveAdjustment: isPlus,        // 실시간 슬라이더 조정
    scenarioCompare3: isPlus,      // 3버킷 시나리오 비교
    solutionInsightBox: isPlus,    // 절세 인사이트 상세
    isaCalculation: isPlus,        // ISA/IRP 세금 분석
    unlimitedPrint: isPlus,        // PDF 출력 (무제한)

    // ── 기타 연관 flags ──────────────────────────────────────────
    taxDetailSection: isPlus,
    taxScenarioCompare: isPlus,
    breakEvenAnalysis: isPlus,
    taxSavingsChart: isPlus,
    reportWatermark: !isPlus,      // Basic은 워터마크 표시
    unlimitedSimulations: isPlus,
  };
}
