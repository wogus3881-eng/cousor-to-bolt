import { supabase } from './supabase';
import type { SimulatorInputs } from './calculator';

export interface FixedCosts {
  housing: number;
  telecom: number;
  loan: number;
  car: number;
  living: number;
  other: number;
}

export const DEFAULT_FIXED_COSTS: FixedCosts = {
  housing: 0, telecom: 0, loan: 0, car: 0, living: 0, other: 0,
};

export interface SavedClient {
  id: string;
  label: string;
  inputs: SimulatorInputs;
  fixed_costs: FixedCosts;
  updated_at: string;
}

export async function listSavedClients(): Promise<SavedClient[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('saved_clients')
    .select('id, label, inputs, fixed_costs, updated_at')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[savedClients] 목록 조회 오류:', error.message);
    return [];
  }
  return (data ?? []) as SavedClient[];
}

export async function saveClient(
  label: string,
  inputs: SimulatorInputs,
  fixedCosts: FixedCosts
): Promise<{ error: string | null; id: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.', id: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인 계정으로만 저장할 수 있어요.', id: null };

  const { data, error } = await supabase.from('saved_clients').insert({
    user_id: user.id,
    label,
    inputs,
    fixed_costs: fixedCosts,
  }).select('id').single();
  if (error) return { error: error.message, id: null };
  return { error: null, id: data.id as string };
}

export async function updateClient(
  id: string,
  inputs: SimulatorInputs,
  fixedCosts: FixedCosts
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await supabase.from('saved_clients').update({
    inputs,
    fixed_costs: fixedCosts,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteSavedClient(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('saved_clients').delete().eq('id', id);
}
