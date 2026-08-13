import { Link } from 'react-router-dom';
import { PRO_TIER_META, type ProTier } from '../lib/proTier';
import { getBasicUsage, getTrialUsage } from '../lib/proUsageLimits';
import { useProAccess } from './ProAccessGate';

interface Props {
  tier: ProTier;
}

const BADGE_CLASS: Record<ProTier, string> = {
  trial: 'bg-slate-200 text-slate-700',
  basic: 'bg-navy-100 text-navy-700',
  pro: 'bg-gold-100 text-gold-800',
};

export default function ProTierBar({ tier }: Props) {
  const meta = PRO_TIER_META[tier];
  const usage = tier === 'basic' ? getBasicUsage() : tier === 'trial' ? getTrialUsage() : null;
  const { isAuthenticated } = useProAccess();

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-navy-200 bg-white px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${BADGE_CLASS[tier]}`}>
          {meta.label}
        </span>
        <p className="truncate text-[11px] text-navy-500">{meta.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {usage && 'daysRemaining' in usage && (
          <span className="hidden text-[10px] text-navy-400 sm:inline">
            시뮬 {usage.simulations}회 · 체험 {usage.daysRemaining}일 남음
          </span>
        )}
        {usage && 'simLimit' in usage && (
          <span className="hidden text-[10px] text-navy-400 sm:inline">
            시뮬 {usage.simulations}/{usage.simLimit}
            {usage.printLimit > 0 ? ` · 리포트 ${usage.prints}/${usage.printLimit}` : ''}
          </span>
        )}
        {isAuthenticated && (
          <Link to="/invite" className="shrink-0 text-[10px] font-medium text-navy-400 hover:text-navy-600">
            🎁 친구 초대
          </Link>
        )}
        {isAuthenticated && tier === 'pro' && (
          <Link to="/leads" className="shrink-0 text-[10px] font-medium text-navy-400 hover:text-navy-600">
            📋 내 리드
          </Link>
        )}
        {tier === 'pro' ? (
          <Link to={PRO_TIER_META.basic.path} className="text-[10px] font-medium text-navy-400 hover:text-navy-600">
            Basic
          </Link>
        ) : (
          <Link
            to={tier === 'trial' ? PRO_TIER_META.basic.path : PRO_TIER_META.pro.path}
            className="rounded-lg bg-navy-900 px-2.5 py-1 text-[10px] font-bold text-gold-300 hover:bg-navy-800"
          >
            {tier === 'trial' ? 'Basic 결제' : 'Pro'}
          </Link>
        )}
      </div>
    </div>
  );
}
