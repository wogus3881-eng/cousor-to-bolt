import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { PRO_TIER_META } from '../lib/proTier';

interface Props {
  title: string;
  description: string;
  compact?: boolean;
}

export default function ProUpgradePrompt({ title, description, compact }: Props) {
  return (
    <div
      className={`rounded-2xl border border-gold-300/60 bg-gradient-to-br from-amber-50 to-white ${
        compact ? 'px-4 py-3' : 'px-5 py-4'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900">
          <Sparkles size={16} className="text-gold-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-navy-900">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-navy-600">{description}</p>
          <Link
            to={PRO_TIER_META.plus.path}
            className="mt-2 inline-flex items-center text-[11px] font-bold text-navy-800 underline decoration-gold-400 underline-offset-4 hover:text-navy-950"
          >
            {PRO_TIER_META.plus.label}로 업그레이드 →
          </Link>
        </div>
      </div>
    </div>
  );
}
