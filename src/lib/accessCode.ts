import { supabase } from './supabase';
import type { ProTier } from './proTier';

export interface AccessCodeRecord {
  code: string;
  agent_name: string;
  tier: ProTier;
  is_active: boolean;
}

const STORAGE_KEY = 'pro_access_code';

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

  if (!supabase) return null;

  const { data, error } = await supabase
    .from('access_codes')
    .select('code, agent_name, tier, is_active')
    .eq('code', trimmed)
    .eq('tier', tier)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return data as AccessCodeRecord;
}
