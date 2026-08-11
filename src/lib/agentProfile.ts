import { supabase } from './supabase';

export interface AgentProfile {
  display_name: string | null;
  agent_title: string | null;
  agent_bio: string | null;
}

/** 로그인한 본인의 프로필(이름·소속·소개글)을 가져옵니다. */
export async function getMyAgentProfile(userId: string): Promise<AgentProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, agent_title, agent_bio')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** 본인 프로필(이름·소속·소개글)을 수정합니다. tier는 이 경로로 건드릴 수 없습니다. */
export async function updateMyAgentProfile(
  displayName: string,
  agentTitle: string,
  agentBio: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await supabase.rpc('update_my_agent_profile', {
    p_display_name: displayName,
    p_agent_title: agentTitle,
    p_agent_bio: agentBio,
  });
  if (error) return { error: error.message };
  return { error: null };
}

/** referral_code로 특정 설계사의 공개 프로필(이름·소속·소개글)만 조회합니다.
 *  고객용 소개 페이지에서 비로그인 상태로도 호출됩니다. */
export async function getAgentPublicProfile(code: string): Promise<AgentProfile | null> {
  if (!supabase || !code.trim()) return null;
  const { data, error } = await supabase.rpc('get_agent_public_profile', { p_code: code.trim() });
  if (error || !data || data.length === 0) return null;
  return data[0];
}
