export interface AgentLeadConfig {
  agentId: string;
  /** Google Apps Script 웹앱 exec URL */
  googleSheetWebAppUrl: string;
  /** 시트·알림에 표시할 유입 경로 라벨 */
  sourceLabel: string;
  /** Supabase consultations.agent_id (미설정 시 agentId 사용) */
  supabaseAgentId?: string;
}

export const DEFAULT_AGENT_ID = 'default';

/** 기본(공용) 리드 수신 URL — agent 파라미터 없을 때 사용 */
export const DEFAULT_GOOGLE_SHEET_WEBAPP_EXEC =
  'https://script.google.com/macros/s/AKfycbwb3Coja4KvriGKPXw-xFq99BOoxP8QvX9h8YOO8x4HLNFUnhRNICfeQdDKbDfYWtKBHw/exec';

const DEFAULT_CONFIG: AgentLeadConfig = {
  agentId: DEFAULT_AGENT_ID,
  googleSheetWebAppUrl: DEFAULT_GOOGLE_SHEET_WEBAPP_EXEC,
  sourceLabel: '이기적인 은퇴설계',
};

/**
 * 설계사별 리드 엔드포인트.
 * 새 설계사 추가 시 agentId 키와 googleSheetWebAppUrl을 등록하세요.
 */
const AGENT_REGISTRY: Record<string, AgentLeadConfig> = {
  // 예시:
  // abc123: {
  //   agentId: 'abc123',
  //   googleSheetWebAppUrl: 'https://script.google.com/macros/s/.../exec',
  //   sourceLabel: '이기적인 은퇴설계 · abc123',
  // },
};

export function resolveAgentConfig(agentParam: string | null | undefined): AgentLeadConfig {
  const id = agentParam?.trim();
  if (!id) return DEFAULT_CONFIG;
  return AGENT_REGISTRY[id] ?? { ...DEFAULT_CONFIG, agentId: id, sourceLabel: `이기적인 은퇴설계 · ${id}` };
}

export function supabaseAgentId(config: AgentLeadConfig): string {
  return config.supabaseAgentId ?? config.agentId;
}
