import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type TabKey = 'notice' | 'review' | 'guide' | 'faq' | 'plans';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'notice', label: '공지사항' },
  { key: 'review', label: '후기' },
  { key: 'guide', label: '사용 방법' },
  { key: 'faq', label: 'FAQ' },
  { key: 'plans', label: 'Trial/Basic/Pro' },
];

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-200 bg-white p-6 text-center">
      <p className="text-sm font-bold text-navy-900 mb-1">{title}</p>
      <p className="text-[12px] text-slate-400">내용 준비 중입니다.</p>
    </div>
  );
}

export default function ProLanding() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('notice');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-navy-100 bg-white px-4 py-6 text-center">
        <p className="text-[11px] font-bold text-navy-400 tracking-wide uppercase mb-1">제이하이브 플랜</p>
        <h1 className="text-lg font-extrabold text-navy-900">이기적인 은퇴설계</h1>
      </header>

      <nav className="sticky top-0 z-10 flex overflow-x-auto border-b border-navy-100 bg-white px-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-3 text-[13px] font-bold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-slate-400 hover:text-navy-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {tab === 'notice' && <Placeholder title="공지사항" />}
        {tab === 'review' && <Placeholder title="후기" />}
        {tab === 'guide' && <Placeholder title="계산기 사용 방법" />}
        {tab === 'faq' && <Placeholder title="자주 하는 질문" />}
        {tab === 'plans' && <Placeholder title="Trial / Basic / Pro 차이" />}
      </main>

      <div className="sticky bottom-0 border-t border-navy-100 bg-white/95 backdrop-blur px-4 py-4">
        <button
          onClick={() => navigate('/pro/trial')}
          className="w-full rounded-2xl bg-gradient-to-r from-navy-800 to-navy-700 py-4 text-sm font-bold text-white shadow-lg shadow-navy-900/30"
        >
          무료로 체험하기 →
        </button>
      </div>
    </div>
  );
}
