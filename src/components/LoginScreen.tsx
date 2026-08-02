import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signIn, signInWithKakao, signUp } from '../lib/auth';

interface Props {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: Props) {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  async function handleKakaoLogin() {
    setError(null);
    setKakaoLoading(true);
    const { error: err } = await signInWithKakao();
    if (err) {
      setError(err);
      setKakaoLoading(false);
    }
    // 성공 시 카카오 페이지로 리다이렉트되므로 별도 처리 불필요
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email.trim(), password);
        if (err) {
          setError(err);
          return;
        }
        onSuccess();
      } else {
        const { error: err, loggedIn } = await signUp(email.trim(), password, referralCode);
        if (err) {
          setError(err);
          return;
        }
        if (loggedIn) {
          onSuccess();
        } else {
          setSignupDone(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (signupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-center">
          <p className="text-base font-bold text-navy-900 mb-2">가입 신청 완료</p>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
            <strong className="text-navy-700">{email}</strong>로 가입해 주셔서 감사합니다.
            메일함에서 인증 링크를 확인해 주세요. (스팸함도 확인해 주세요)
          </p>
          <button
            onClick={() => { setSignupDone(false); setMode('signin'); }}
            className="w-full rounded-xl bg-navy-900 text-white text-sm font-bold py-3"
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-[11px] font-bold text-navy-400 tracking-wide uppercase mb-1">제이하이브 플랜</p>
          <h1 className="text-lg font-extrabold text-navy-900">
            {mode === 'signin' ? '로그인' : '회원가입'}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleKakaoLogin}
          disabled={kakaoLoading}
          className="w-full rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] disabled:opacity-50 text-[#191919] text-sm font-bold py-3 transition-colors mb-3"
        >
          {kakaoLoading ? '연결 중...' : '카카오로 시작하기'}
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] text-slate-400">또는 이메일로</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1 block">추천인 코드 (선택)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="예: AB12CD"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-navy-200"
              />
            </div>
          )}

          {error && (
            <p className="text-[12px] text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-sm font-bold py-3 transition-colors"
          >
            {loading ? '처리 중...' : mode === 'signin' ? '로그인' : '가입하기'}
          </button>
        </form>

        {mode === 'signup' && (
          <p className="text-center text-[10px] text-slate-300 mt-3">
            가입 시{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              이용약관
            </a>
            에 동의하는 것으로 간주됩니다.
          </p>
        )}

        <p className="text-center text-[12px] text-slate-400 mt-4">
          {mode === 'signin' ? (
            <>
              아직 계정이 없으신가요?{' '}
              <button onClick={() => { setMode('signup'); setError(null); }} className="text-navy-600 font-bold underline underline-offset-2">
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button onClick={() => { setMode('signin'); setError(null); }} className="text-navy-600 font-bold underline underline-offset-2">
                로그인
              </button>
            </>
          )}
        </p>

        <p className="text-center text-[10px] text-slate-300 mt-6">
          로그인은 한 번에 한 기기에서만 유지됩니다. 다른 기기에서 로그인하면 기존 세션은 자동으로 종료됩니다.
        </p>
      </div>
    </div>
  );
}
