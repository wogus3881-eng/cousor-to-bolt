import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  clearStoredAccess,
  getStoredAccess,
  saveStoredAccess,
  verifyAccessCode,
} from '../lib/accessCode';
import { checkSessionValidity, getCurrentUser, startSessionWatcher, type AuthUser } from '../lib/auth';
import { PRO_TIER_META, type ProTier } from '../lib/proTier';
import LoginScreen from './LoginScreen';

interface Props {
  tier: ProTier;
  children: ReactNode;
}

const TIER_RANK: Record<ProTier, number> = { trial: 0, basic: 1, pro: 2 };

/** 실제 계정으로 로그인해서 들어왔는지(내 리드·친구 초대 등 "내 정보" 기능 노출 가능)
 *  vs 접근코드(강의·임시 공유용)로 들어왔는지 구분합니다. */
const ProAccessContext = createContext<{ isAuthenticated: boolean }>({ isAuthenticated: false });

export function useProAccess() {
  return useContext(ProAccessContext);
}

export default function ProAccessGate({ tier, children }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      // 1순위: 로그인 계정으로 접근 (신규 방식)
      const user = await getCurrentUser();
      if (user) {
        // 페이지를 새로 열 때마다(새로고침 포함) 이 세션이 다른 기기에 의해
        // 밀려나지 않았는지 즉시 확인합니다. 탭을 계속 켜둔 채로만 감지되는
        // 워처(30초 주기)와 달리, 매번 새로 접속하는 경우까지 확실히 막습니다.
        const valid = await checkSessionValidity(user.id);
        if (valid && user.tier !== tier && TIER_RANK[user.tier] > TIER_RANK[tier]) {
          // 내 등급이 지금 보고 있는 페이지보다 높으면(예: Pro 회원이 Trial 페이지로 로그인)
          // 업그레이드 버튼을 누를 필요 없이 바로 내 등급 페이지로 보냅니다.
          const query = searchParams.toString();
          if (!cancelled) navigate(`${PRO_TIER_META[user.tier].path}${query ? `?${query}` : ''}`, { replace: true });
          return;
        }
        if (valid && TIER_RANK[user.tier] >= TIER_RANK[tier]) {
          if (!cancelled) {
            setAuthUser(user);
            setGranted(true);
            setChecking(false);
          }
          return;
        }
        if (!valid && !cancelled) {
          setKickedMessage('다른 기기에서 로그인되어 이 세션은 종료되었습니다. 다시 로그인해 주세요.');
        }
      }

      // 2순위: 접근코드 방식 (기존 방식, 당분간 병행 지원)
      const urlCode = searchParams.get('code');

      if (urlCode) {
        const record = await verifyAccessCode(urlCode, tier);
        if (record) {
          saveStoredAccess({ code: record.code, tier: record.tier, agentName: record.agent_name });
          if (!cancelled) {
            setGranted(true);
            setChecking(false);
          }
          return;
        }
        if (!cancelled) navigate('/blocked', { replace: true });
        return;
      }

      const stored = getStoredAccess(tier);
      if (stored) {
        const record = await verifyAccessCode(stored.code, tier);
        if (record) {
          saveStoredAccess({ code: record.code, tier: record.tier, agentName: record.agent_name });
          if (!cancelled) {
            setGranted(true);
            setChecking(false);
          }
          return;
        }
        clearStoredAccess();
      }

      // 로그인 계정도, 접근코드도 없으면 로그인 화면 표시 (Trial 포함 모든 티어)
      if (!cancelled) {
        setShowLogin(true);
        setChecking(false);
      }
    }

    checkAccess();
    return () => { cancelled = true; };
  }, [tier, searchParams, navigate]);

  // 로그인 계정으로 들어온 경우, 다른 기기에서 로그인해서 이 세션이 밀려나는지 계속 감시
  useEffect(() => {
    if (!authUser) return;
    const stop = startSessionWatcher(authUser.id, () => {
      setGranted(false);
      setAuthUser(null);
      setKickedMessage('다른 기기에서 로그인되어 이 세션은 종료되었습니다. 다시 로그인해 주세요.');
      setShowLogin(true);
    });
    return stop;
  }, [authUser]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">접근 권한 확인 중...</p>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div>
        {kickedMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center">
            <p className="text-[12px] font-medium text-amber-800">{kickedMessage}</p>
          </div>
        )}
        <LoginScreen
          onSuccess={async () => {
            const user = await getCurrentUser();
            if (user && user.tier !== tier && TIER_RANK[user.tier] > TIER_RANK[tier]) {
              const query = searchParams.toString();
              navigate(`${PRO_TIER_META[user.tier].path}${query ? `?${query}` : ''}`, { replace: true });
            } else if (user && TIER_RANK[user.tier] >= TIER_RANK[tier]) {
              setAuthUser(user);
              setShowLogin(false);
              setKickedMessage(null);
              setGranted(true);
            } else if (user) {
              // 로그인은 됐지만 등급이 부족한 경우
              navigate('/blocked', { replace: true });
            }
          }}
        />
      </div>
    );
  }

  if (!granted) return null;

  return (
    <ProAccessContext.Provider value={{ isAuthenticated: !!authUser }}>
      {children}
    </ProAccessContext.Provider>
  );
}
