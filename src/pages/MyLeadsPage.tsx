import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Users } from 'lucide-react';
import { getCurrentUser, getMyReferralStats, type ReferralStats } from '../lib/auth';
import { getMyLeads, type Lead } from '../lib/leads';
import { getMyAgentProfile, updateMyAgentProfile } from '../lib/agentProfile';
import { PRO_TIER_META } from '../lib/proTier';
import LoginScreen from '../components/LoginScreen';

function formatWon(n: number | null) {
  if (n == null) return '-';
  return `${n.toLocaleString()}원`;
}

export default function MyLeadsPage() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [copied, setCopied] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [agentTitle, setAgentTitle] = useState('');
  const [agentBio, setAgentBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  async function load() {
    setChecking(true);
    const user = await getCurrentUser();
    if (!user) {
      setLoggedIn(false);
      setChecking(false);
      return;
    }
    setLoggedIn(true);
    const pro = user.tier === 'pro';
    setIsPro(pro);
    if (pro) {
      const [s, l, p] = await Promise.all([getMyReferralStats(), getMyLeads(), getMyAgentProfile(user.id)]);
      setStats(s);
      setLeads(l);
      if (p) {
        setDisplayName(p.display_name ?? '');
        setAgentTitle(p.agent_title ?? '');
        setAgentBio(p.agent_bio ?? '');
      }
    }
    setChecking(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSaved(false);
    const { error } = await updateMyAgentProfile(displayName, agentTitle, agentBio);
    setSavingProfile(false);
    if (error) {
      setProfileError(error);
      return;
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
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

  if (!isPro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-navy-100 bg-white p-6 text-center shadow-sm">
          <p className="text-base font-bold text-navy-900 mb-2">Pro 전용 기능이에요</p>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
            고객용 링크와 리드 확인은 Pro 구독자에게만 제공돼요.
          </p>
          <Link
            to={PRO_TIER_META.pro.path}
            className="inline-block w-full rounded-xl bg-navy-900 text-white text-sm font-bold py-3"
          >
            Pro 보기
          </Link>
        </div>
      </div>
    );
  }

  const myLink = stats ? `${window.location.origin}/intro?agent=${stats.referralCode}` : '';

  async function handleCopy() {
    if (!myLink) return;
    await navigator.clipboard.writeText(myLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold-100">
            <Users size={26} className="text-gold-600" />
          </div>
          <h1 className="text-lg font-extrabold text-navy-900">내 고객용 링크</h1>
          <p className="mt-1 text-[12px] text-slate-500">
            이 링크를 고객에게 보내면, 고객이 직접 진단하고 신청한 내역이 여기 쌓여요.
          </p>
        </div>

        {stats && (
          <div className="mb-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold text-navy-400 mb-1">내 링크</p>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="flex-1 truncate text-[12px] text-slate-600">{myLink}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-bold text-white flex items-center gap-1"
              >
                <Copy size={12} />
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="mb-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-[13px] font-bold text-navy-900 mb-1">내 소개 (소개 페이지에 표시)</p>
          <p className="text-[11px] text-slate-400 mb-3">
            고객이 링크를 열면 진단 전에 이 정보가 먼저 보여요. 비워두면 소개 화면 없이 바로 진단으로 넘어가요.
          </p>
          <div className="space-y-2.5">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름 (예: 홍길동)"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-300 focus:ring-2 focus:ring-navy-100"
            />
            <input
              type="text"
              value={agentTitle}
              onChange={(e) => setAgentTitle(e.target.value)}
              placeholder="소속 (예: OO생명 강남지점)"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-300 focus:ring-2 focus:ring-navy-100"
            />
            <textarea
              value={agentBio}
              onChange={(e) => setAgentBio(e.target.value)}
              placeholder="소개글 (예: 고객님의 노후를 제 일처럼 설계해 드립니다.)"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-300 focus:ring-2 focus:ring-navy-100"
            />
          </div>
          {profileError && <p className="mt-2 text-[11px] font-medium text-red-500">{profileError}</p>}
          <button
            type="submit"
            disabled={savingProfile}
            className="mt-3 w-full rounded-xl bg-navy-900 py-2.5 text-[12px] font-bold text-white disabled:opacity-50"
          >
            {savingProfile ? '저장 중...' : profileSaved ? '저장됨' : '저장'}
          </button>
        </form>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-[13px] font-bold text-navy-900 mb-3">받은 리드 ({leads.length}건)</p>
          {leads.length === 0 ? (
            <p className="text-[12px] text-slate-400">아직 신청한 고객이 없어요. 링크를 공유해 보세요.</p>
          ) : (
            <div className="space-y-2">
              {leads.map((l) => (
                <div key={l.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-navy-900">{l.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(l.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {l.phone} · 희망시간 {l.preferred_time}
                    {l.location ? ` · ${l.location}` : ''}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {l.current_age ?? '-'}세 → {l.retirement_age ?? '-'}세 은퇴 · 월 희망생활비{' '}
                    {formatWon(l.monthly_expense)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link to="/pro" className="mt-6 block text-center text-[12px] font-bold text-navy-600 underline underline-offset-2">
          Pro 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
