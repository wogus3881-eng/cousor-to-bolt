import { supabase } from './supabase';
import type { SimulatorInputs } from './calculator';

export interface SavedClient {
  id: string;
  label: string;
  inputs: SimulatorInputs;
  updated_at: string;
}

export async function listSavedClients(): Promise<SavedClient[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('saved_clients')
    .select('id, label, inputs, updated_at')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[savedClients] 목록 조회 오류:', error.message);
    return [];
  }
  return (data ?? []) as SavedClient[];
}

export async function saveClient(label: string, inputs: SimulatorInputs): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인 계정으로만 저장할 수 있어요.' };

  const { error } = await supabase.from('saved_clients').insert({
    user_id: user.id,
    label,
    inputs,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteSavedClient(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('saved_clients').delete().eq('id', id);
}
