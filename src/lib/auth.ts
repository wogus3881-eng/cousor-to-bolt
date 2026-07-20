import { supabase } from './supabase';
import type { ProTier } from './proTier';

export interface AuthUser {
  id: string;
  email: string;
  tier: ProTier;
}

const SESSION_TOKEN_KEY = 'jhive_session_token';

function generateSessionToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 로그인 성공 직후 호출: 새 세션 토큰을 발급해서 서버에 기록하고, 이전에
 *  다른 기기에서 로그인해 있던 세션을 자동으로 무효화합니다. */
async function claimSession(userId: string): Promise<void> {
  if (!supabase) return;
  const token = generateSessionToken();
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  await supabase.from('active_sessions').upsert({
    user_id: userId,
    session_token: token,
    updated_at: new Date().toISOString(),
  });
}

export async function signUp(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      display_name: email.split('@')[0],
    });
    // 이메일 확인이 꺼져있는 프로젝트라면 가입과 동시에 세션이 생기므로 바로 클레임
    if (data.session) await claimSession(data.user.id);
  }
  return { error: null };
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  if (data.user) await claimSession(data.user.id);
  return { error: null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle();

  // 프로필이 없으면(가입 절차 중 끊긴 경우 등) basic으로 자동 생성
  if (!profile) {
    await supabase.from('profiles').insert({ id: user.id, display_name: user.email?.split('@')[0] });
  }

  return {
    id: user.id,
    email: user.email ?? '',
    tier: (profile?.tier as ProTier) ?? 'basic',
  };
}

/** 다른 기기에서 로그인해서 이 세션이 더 이상 유효한 세션이 아닌지 확인합니다.
 *  무효화된 경우 자동으로 로그아웃 처리하고 false를 반환합니다. */
export async function checkSessionValidity(userId: string): Promise<boolean> {
  if (!supabase) return true;
  const localToken = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!localToken) return true; // 세션을 아직 클레임하지 않은 상태 (로그인 직후 등) — 판단 보류

  const { data } = await supabase
    .from('active_sessions')
    .select('session_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (data && data.session_token !== localToken) {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_TOKEN_KEY);
    return false;
  }
  return true;
}

/** 일정 주기로 세션 유효성을 확인하는 워처를 시작합니다.
 *  다른 기기에서 로그인해서 이 세션이 밀려나면 onInvalidated 콜백이 호출됩니다.
 *  반환된 함수를 호출하면 워처를 정지합니다(컴포넌트 unmount 시 꼭 호출). */
export function startSessionWatcher(
  userId: string,
  onInvalidated: () => void,
  intervalMs = 30000
): () => void {
  const interval = setInterval(async () => {
    const valid = await checkSessionValidity(userId);
    if (!valid) onInvalidated();
  }, intervalMs);

  // 탭이 다시 활성화될 때도 즉시 한 번 확인 (노트북 덮었다 열었을 때 등)
  const onFocus = async () => {
    const valid = await checkSessionValidity(userId);
    if (!valid) onInvalidated();
  };
  window.addEventListener('focus', onFocus);

  return () => {
    clearInterval(interval);
    window.removeEventListener('focus', onFocus);
  };
}
