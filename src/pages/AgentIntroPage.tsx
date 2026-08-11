import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { getAgentPublicProfile, type AgentProfile } from '../lib/agentProfile';

export default function AgentIntroPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agentCode = searchParams.get('agent') ?? '';
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<AgentProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!agentCode.trim()) {
        navigate('/v2', { replace: true });
        return;
      }
      const p = await getAgentPublicProfile(agentCode);
      const hasContent = p && (p.display_name || p.agent_title || p.agent_bio);
      if (!hasContent) {
        // 프로필을 아직 안 채웠으면 소개 화면 없이 바로 진단으로 보냅니다.
        if (!cancelled) navigate(`/v2?agent=${encodeURIComponent(agentCode)}`, { replace: true });
        return;
      }
      if (!cancelled) {
        setProfile(p);
        setChecking(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [agentCode, navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-toss-canvas">
        <p className="text-sm font-medium text-toss-sub">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-toss-canvas px-6 py-10">
      <div className="w-full max-w-sm rounded-[24px] border border-toss-line bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-toss-blue/10">
          <User size={28} className="text-toss-blue" />
        </div>
        {profile?.display_name && (
          <h1 className="text-lg font-extrabold text-toss-ink">{profile.display_name}</h1>
        )}
        {profile?.agent_title && (
          <p className="mt-1 text-[12px] font-semibold text-toss-blue">{profile.agent_title}</p>
        )}
        {profile?.agent_bio && (
          <p className="mt-4 text-[13px] leading-relaxed text-toss-sub whitespace-pre-wrap">{profile.agent_bio}</p>
        )}

        <button
          type="button"
          onClick={() => navigate(`/v2?agent=${encodeURIComponent(agentCode)}`)}
          className="mt-6 w-full rounded-2xl bg-toss-blue py-4 text-sm font-bold text-white shadow-lg shadow-toss-blue/25 transition hover:bg-toss-bluePress"
        >
          진단 시작하기 →
        </button>
      </div>
    </div>
  );
}
