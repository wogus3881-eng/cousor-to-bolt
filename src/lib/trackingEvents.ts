/** 광고 채널별 전환 이벤트 트래킹 유틸 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    wcs_add?: Record<string, string>;
    wcs?: { inflow: () => void; do?: () => void; cnv?: (a: string, b: string) => string };
    _nasa?: Record<string, unknown>;
    wcs_do?: () => void;
  }
}

/** 메타 픽셀 리드 이벤트 발동 */
export function trackMetaLead(params?: { name?: string; agentId?: string }) {
  try {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: '은퇴설계 상담 신청',
        content_category: agentId2Channel(params?.agentId),
      });
    }
  } catch {
    // 픽셀 미설치 환경에서 조용히 무시
  }
}

/** 네이버 전환 이벤트 발동 */
export function trackNaverLead() {
  try {
    if (typeof window !== 'undefined' && window.wcs_do) {
      if (!window._nasa) window._nasa = {};
      window._nasa['cnv'] = window.wcs?.cnv?.('4', '1') ?? '';
      window.wcs_do?.();
    }
  } catch {
    // 미설치 환경 무시
  }
}

/** agentId → 채널명 변환 */
function agentId2Channel(agentId?: string): string {
  if (!agentId) return 'default';
  if (agentId.startsWith('insta')) return 'instagram';
  if (agentId.startsWith('fb') || agentId.startsWith('facebook')) return 'facebook';
  if (agentId.startsWith('naver')) return 'naver';
  if (agentId.startsWith('youtube') || agentId.startsWith('yt')) return 'youtube';
  return agentId;
}
