import { Link } from 'react-router-dom';
import { PRO_TIER_META, type ProTier } from '../lib/proTier';
import { getBasicUsage } from '../lib/proUsageLimits';

interface Props {
  tier: ProTier;
}

export default function ProTierBar({ tier }: Props) {
  const meta = PRO_TIER_META[tier];
  const usage = tier === 'basic' ? getBasicUsage() : null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-navy-200 bg-white px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            tier === 'plus' ? 'bg-gold-100 text-gold-800' : 'bg-navy-100 text-navy-700'
          }`}
        >
          {meta.label}
        </span>
        <p className="truncate text-[11px] text-navy-500">{meta.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {usage && (
          <span className="hidden text-[10px] text-navy-400 sm:inline">
            시뮬 {usage.simulations}/{usage.simLimit} · 리포트 {usage.prints}/{usage.printLimit}
          </span>
        )}
        {tier === 'basic' ? (
          <Link
            to={PRO_TIER_META.plus.path}
            className="rounded-lg bg-navy-900 px-2.5 py-1 text-[10px] font-bold text-gold-300 hover:bg-navy-800"
          >
            Plus
          </Link>
        ) : (
          <Link to={PRO_TIER_META.basic.path} className="text-[10px] font-medium text-navy-400 hover:text-navy-600">
            Basic
          </Link>
        )}
      </div>
    </div>
  );
}
