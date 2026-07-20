import { supabase } from './supabase';
import type { ProTier } from './proTier';

export interface AccessCodeRecord {
  code: string;
  agent_name: string;
  tier: ProTier;
  is_active: boolean;
}

const STORAGE_KEY = 'pro_access_code';

/** Supabase 미연결(로컬 개발) 환경에서만 사용. import.meta.env.DEV 가드로
 *  프로덕션 빌드 시 이 배열 자체가 번들에서 완전히 제거됩니다(dead-code elimination). */
const FALLBACK_ACCESS_CODES: AccessCodeRecord[] = import.meta.env.DEV ? [
  // ── Basic 코드 (5개) ──────────────────────────────────────────
  { code: 'BASIC-TEST01', agent_name: '테스트 Basic 1', tier: 'basic', is_active: true },
  { code: 'BASIC-TEST02', agent_name: '테스트 Basic 2', tier: 'basic', is_active: true },
  { code: 'BASIC-TEST03', agent_name: '테스트 Basic 3', tier: 'basic', is_active: true },
  { code: 'BASIC-TEST04', agent_name: '테스트 Basic 4', tier: 'basic', is_active: true },
  { code: 'BASIC-TEST05', agent_name: '테스트 Basic 5', tier: 'basic', is_active: true },
  // ── Plus 코드 ─────────────────────────────────────────────────
  { code: 'PLUS-TEST01', agent_name: '테스트 설계사 1', tier: 'plus', is_active: true },
  { code: 'PLUS-TEST02', agent_name: '테스트 설계사 2', tier: 'plus', is_active: true },
  { code: 'PLUS-TEST03', agent_name: '테스트 설계사 3', tier: 'plus', is_active: true },
  { code: 'PLUS-TEST04', agent_name: '테스트 설계사 4', tier: 'plus', is_active: true },
  { code: 'PLUS-TEST05', agent_name: '테스트 설계사 5', tier: 'plus', is_active: true },
  { code: 'HENRY', agent_name: 'Henry', tier: 'plus', is_active: true },
] : [];

function verifyFallbackCode(code: string, tier: ProTier): AccessCodeRecord | null {
  return FALLBACK_ACCESS_CODES.find(
    (row) => row.code === code && row.tier === tier && row.is_active,
  ) ?? null;
}

interface StoredAccess {
  code: string;
  tier: ProTier;
  agentName: string;
}

export function getStoredAccess(tier: ProTier): StoredAccess | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccess;
    if (parsed.tier !== tier || !parsed.code) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredAccess(record: StoredAccess): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function clearStoredAccess(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function verifyAccessCode(code: string, tier: ProTier): Promise<AccessCodeRecord | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  // Supabase 자체가 설정 안 된 환경(로컬 개발 등)에서만 테스트 코드로 검증.
  // Supabase가 연결된 상태(운영 환경)에서는 조회 결과가 없거나 오류가 나도
  // 절대 테스트 코드로 새지 않고 그대로 실패 처리합니다(fail-closed).
  if (!supabase) return verifyFallbackCode(trimmed, tier);

  const { data, error } = await supabase
    .from('access_codes')
    .select('code, agent_name, tier, is_active')
    .eq('code', trimmed)
    .eq('tier', tier)
    .maybeSingle();

  if (error) {
    console.error('[accessCode] Supabase 조회 오류:', error.message);
    return null;
  }
  if (!data) return null;
  if (!data.is_active) return null;
  return data as AccessCodeRecord;
}
