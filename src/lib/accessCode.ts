import { supabase } from './supabase';
import type { ProTier } from './proTier';

export interface AccessCodeRecord {
  code: string;
  agent_name: string;
  tier: ProTier;
  is_active: boolean;
}

const STORAGE_KEY = 'pro_access_code';

/** Supabase 미연결·마이그레이션 전 Bolt 등에서 사용 (시드와 동일) */
const FALLBACK_ACCESS_CODES: AccessCodeRecord[] = [
  { code: 'BASIC-TEST01', agent_name: '테스트 설계사 A', tier: 'basic', is_active: true },
  { code: 'PLUS-TEST01', agent_name: '테스트 설계사 B', tier: 'plus', is_active: true },
  { code: 'PLUS-TEST02', agent_name: '테스트 설계사 C', tier: 'plus', is_active: true },
];

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

  if (!supabase) return verifyFallbackCode(trimmed, tier);

  const { data, error } = await supabase
    .from('access_codes')
    .select('code, agent_name, tier, is_active')
    .eq('code', trimmed)
    .eq('tier', tier)
    .maybeSingle();

  if (error || !data) return verifyFallbackCode(trimmed, tier);
  if (!data.is_active) return null;
  return data as AccessCodeRecord;
}
