export interface AgeRangeHint {
  label: string;   // 예: "30대"
  avg: number;     // 만원 단위
}

/**
 * 현재 나이 기준으로 보여줄 나이대별 평균 힌트 반환
 * - 30대(30~39): 30대·40대 평균 표시
 * - 40대(40~49): 40대·50대 평균 표시
 * - 50대(50~59): 50대·60대 평균 표시
 * - 60대 이상: 60대 평균만 표시
 * - 29세 이하: 30대 평균만 표시
 */

const AGE_RANGE_AVERAGES: Record<string, number> = {
  '30대': 18,   // 월 평균 18만원 (생명보험협회 2023)
  '40대': 26,   // 월 평균 26만원
  '50대': 35,   // 월 평균 35만원
  '60대': 42,   // 월 평균 42만원
};

export function getProtectionInsuranceHints(currentAge: number): AgeRangeHint[] {
  if (currentAge < 30) {
    return [
      { label: '30대', avg: AGE_RANGE_AVERAGES['30대'] },
    ];
  }
  if (currentAge < 40) {
    return [
      { label: '30대', avg: AGE_RANGE_AVERAGES['30대'] },
      { label: '40대', avg: AGE_RANGE_AVERAGES['40대'] },
    ];
  }
  if (currentAge < 50) {
    return [
      { label: '40대', avg: AGE_RANGE_AVERAGES['40대'] },
      { label: '50대', avg: AGE_RANGE_AVERAGES['50대'] },
    ];
  }
  if (currentAge < 60) {
    return [
      { label: '50대', avg: AGE_RANGE_AVERAGES['50대'] },
      { label: '60대', avg: AGE_RANGE_AVERAGES['60대'] },
    ];
  }
  return [
    { label: '60대', avg: AGE_RANGE_AVERAGES['60대'] },
  ];
}
