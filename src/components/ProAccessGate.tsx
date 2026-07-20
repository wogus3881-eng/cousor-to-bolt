import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  clearStoredAccess,
  getStoredAccess,
  saveStoredAccess,
  verifyAccessCode,
} from '../lib/accessCode';
import type { ProTier } from '../lib/proTier';

interface Props {
  tier: ProTier;
  children: ReactNode;
}

export default function ProAccessGate({ tier, children }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
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

      if (!cancelled) navigate('/blocked', { replace: true });
    }

    checkAccess();
    return () => { cancelled = true; };
  }, [tier, searchParams, navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">접근 권한 확인 중...</p>
      </div>
    );
  }

  if (!granted) return null;

  return <>{children}</>;
}
