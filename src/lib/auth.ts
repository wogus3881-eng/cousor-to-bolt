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

export async function signUp(
  email: string,
  password: string,
  referralCode?: string
): Promise<{ error: string | null; loggedIn: boolean }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.', loggedIn: false };
  const ref = referralCode?.trim().toUpperCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: ref ? { data: { ref } } : undefined,
  });
  if (error) return { error: error.message, loggedIn: false };
  // profiles row는 DB 트리거(on_auth_user_created)가 자동으로 만들어줍니다.
  // 이메일 인증이 켜져있어 아직 로그인 세션이 없는 상태에서도 안정적으로 동작합니다.
  if (data.user && data.session) {
    // 이메일 확인이 꺼져있는 프로젝트라면 가입과 동시에 세션이 생기므로 바로 클레임
    await claimSession(data.user.id);
    return { error: null, loggedIn: true };
  }
  return { error: null, loggedIn: false };
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  if (data.user) await claimSession(data.user.id);
  return { error: null };
}

/** 카카오 로그인 시작 — 카카오 인증 후 현재 페이지(코드·경로 포함)로 되돌아옵니다. */
export async function signInWithKakao(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: window.location.href },
  });
  if (error) return { error: error.message };
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

  // 카카오 로그인 등 OAuth 콜백으로 막 돌아온 경우 아직 세션을 클레임하지 않았으므로 여기서 처리
  if (!localStorage.getItem(SESSION_TOKEN_KEY)) {
    await claimSession(user.id);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle();

  // 프로필이 없으면(가입 절차 중 끊긴 경우 등) trial로 자동 생성
  if (!profile) {
    await supabase.from('profiles').insert({ id: user.id, display_name: user.email?.split('@')[0] });
  }

  return {
    id: user.id,
    email: user.email ?? '',
    tier: (profile?.tier as ProTier) ?? 'trial',
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

export interface ReferralStats {
  referralCode: string;
  referredCount: number;
}

/** 본인의 추천 코드와 지금까지 이 코드로 가입한 인원 수를 가져옵니다. */
export async function getMyReferralStats(): Promise<ReferralStats | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_my_referral_stats');
  if (error || !data || data.length === 0) return null;
  return { referralCode: data[0].referral_code, referredCount: Number(data[0].referred_count) };
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
