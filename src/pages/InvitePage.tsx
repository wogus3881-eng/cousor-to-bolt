import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Gift } from 'lucide-react';
import { getCurrentUser, getMyReferralStats, type ReferralStats } from '../lib/auth';
import LoginScreen from '../components/LoginScreen';

export default function InvitePage() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setChecking(true);
    const user = await getCurrentUser();
    if (!user) {
      setLoggedIn(false);
      setChecking(false);
      return;
    }
    setLoggedIn(true);
    const s = await getMyReferralStats();
    setStats(s);
    setChecking(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">불러오는 중...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onSuccess={load} />;
  }

  const inviteLink = stats ? `${window.location.origin}/pro?ref=${stats.referralCode}` : '';

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold-100">
            <Gift size={26} className="text-gold-600" />
          </div>
          <h1 className="text-lg font-extrabold text-navy-900">친구 초대</h1>
          <p className="mt-1 text-[12px] text-slate-500">
            내 링크로 가입한 친구가 결제하면 다음 달 구독료를 할인해 드려요.
          </p>
        </div>

        {stats ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold text-navy-400 mb-1">내 추천 코드</p>
            <p className="text-2xl font-extrabold tracking-widest text-navy-900 mb-4">{stats.referralCode}</p>

            <p className="text-[11px] font-bold text-navy-400 mb-1">초대 링크</p>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="flex-1 truncate text-[12px] text-slate-600">{inviteLink}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-bold text-white flex items-center gap-1"
              >
                <Copy size={12} />
                {copied ? '복사됨' : '복사'}
              </button>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[12px] text-slate-500">
                지금까지 이 코드로 가입한 인원: <strong className="text-navy-900">{stats.referredCount}명</strong>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-[12px] text-slate-400">추천 코드를 불러오지 못했습니다.</p>
        )}

        <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-400">
          할인은 결제 처리 시 담당자가 확인 후 다음 달 구독료에 반영해 드려요. 문의: henry-lim@naver.com
        </p>

        <Link to="/pro" className="mt-6 block text-center text-[12px] font-bold text-navy-600 underline underline-offset-2">
          Pro 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
