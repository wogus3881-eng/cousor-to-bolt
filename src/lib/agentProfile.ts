import { supabase } from './supabase';

export interface AgentProfile {
  display_name: string | null;
  agent_title: string | null;
  agent_bio: string | null;
  agent_photo_url: string | null;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** 로그인한 본인의 프로필(이름·소속·소개글·사진)을 가져옵니다. */
export async function getMyAgentProfile(userId: string): Promise<AgentProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, agent_title, agent_bio, agent_photo_url')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** 본인 프로필(이름·소속·소개글·사진)을 수정합니다. tier는 이 경로로 건드릴 수 없습니다. */
export async function updateMyAgentProfile(
  displayName: string,
  agentTitle: string,
  agentBio: string,
  agentPhotoUrl: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await supabase.rpc('update_my_agent_profile', {
    p_display_name: displayName,
    p_agent_title: agentTitle,
    p_agent_bio: agentBio,
    p_agent_photo_url: agentPhotoUrl,
  });
  if (error) return { error: error.message };
  return { error: null };
}

/** referral_code로 특정 설계사의 공개 프로필(이름·소속·소개글·사진)만 조회합니다.
 *  고객용 소개 페이지에서 비로그인 상태로도 호출됩니다. */
export async function getAgentPublicProfile(code: string): Promise<AgentProfile | null> {
  if (!supabase || !code.trim()) return null;
  const { data, error } = await supabase.rpc('get_agent_public_profile', { p_code: code.trim() });
  if (error || !data || data.length === 0) return null;
  return data[0];
}

/** 프로필 사진을 본인 폴더(agent-photos/{userId}/photo.<ext>)에 업로드하고 공개 URL을 반환합니다.
 *  같은 경로에 upsert하므로 다시 올리면 기존 사진을 덮어씁니다. */
export async function uploadAgentPhoto(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Supabase가 설정되지 않았습니다.' };
  if (!file.type.startsWith('image/')) return { url: null, error: '이미지 파일만 업로드할 수 있어요.' };
  if (file.size > MAX_PHOTO_BYTES) return { url: null, error: '5MB 이하의 이미지만 업로드할 수 있어요.' };

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/photo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('agent-photos')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from('agent-photos').getPublicUrl(path);
  // 캐시 무효화를 위해 매번 다른 쿼리스트링을 붙여서, 덮어쓴 사진이 바로 반영되도록 합니다.
  const url = `${data.publicUrl}?v=${Date.now()}`;
  return { url, error: null };
}
