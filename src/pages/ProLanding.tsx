import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';

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

const NOTICES = [
  {
    date: '2026.08.02',
    tag: '업데이트',
    title: '카카오 계정 로그인 지원 시작',
    body: '이제 카카오 계정으로 간편하게 로그인할 수 있어요. 회원가입 없이 바로 체험판을 시작해 보세요.',
  },
  {
    date: '2026.08.01',
    tag: '이벤트',
    title: 'Trial 무료 체험판 오픈',
    body: '로그인만 하면 카드 등록 없이 바로 진단 결과를 확인할 수 있는 무료 체험판이 열렸습니다. 상담 전 미리 고객 성향을 파악하는 용도로 활용해 보세요.',
  },
  {
    date: '2026.07.20',
    tag: '출시',
    title: '제이하이브 플랜 정식 오픈',
    body: 'Trial / Basic / Pro 3단계 요금제로 보험 전문가용 노후 시뮬레이터가 정식 출시되었습니다.',
  },
];

function NoticeTab() {
  return (
    <div className="space-y-3">
      {NOTICES.map((n) => (
        <div key={n.title} className="rounded-2xl bg-white p-4 border border-navy-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="shrink-0 rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-700">
              {n.tag}
            </span>
            <span className="text-[11px] text-slate-400">{n.date}</span>
          </div>
          <p className="text-[13px] font-bold text-navy-900 mb-1">{n.title}</p>
          <p className="text-[12px] leading-relaxed text-slate-500">{n.body}</p>
        </div>
      ))}
    </div>
  );
}

const FAQS = [
  {
    q: 'Trial(체험판)은 정말 무료인가요?',
    a: '네, 완전 무료예요. 카드 등록도 필요 없고 카카오 로그인만 하면 바로 시작할 수 있어요. 단, 시뮬레이션은 3회까지, 리포트 PDF 저장은 Basic 이상부터 가능해요.',
  },
  {
    q: 'Trial은 언제까지 쓸 수 있나요?',
    a: '가입 후 14일 동안, 총 3회의 시뮬레이션을 이용할 수 있어요. 기간이나 횟수가 지나면 Basic 또는 Pro로 업그레이드해야 계속 이용할 수 있어요.',
  },
  {
    q: '계산 결과는 얼마나 정확한가요?',
    a: '입력하신 정보를 바탕으로 한 참고용 시뮬레이션이에요. 실제 수익률·세법·건강보험료는 매년 바뀔 수 있어 정확한 설계는 전문가 상담을 통해 확인하시는 걸 권장해요.',
  },
  {
    q: '입력한 개인정보는 안전하게 보관되나요?',
    a: '네, 로그인에 필요한 최소한의 정보만 수집하고 있고, 모든 데이터는 암호화된 데이터베이스에 저장돼요.',
  },
  {
    q: 'Basic에서 Pro로 업그레이드하려면 어떻게 하나요?',
    a: '담당자에게 문의해 주시면 등급을 바로 올려드려요. 별도의 복잡한 절차 없이 다음 로그인부터 바로 Pro 기능을 이용할 수 있어요.',
  },
  {
    q: '여러 기기에서 동시에 로그인할 수 있나요?',
    a: '한 번에 한 기기에서만 로그인이 유지돼요. 새로운 기기에서 로그인하면 기존 로그인은 자동으로 종료돼요.',
  },
  {
    q: 'PDF 리포트를 고객 상담 자료로 써도 되나요?',
    a: '네, 그러라고 만든 기능이에요. Basic은 워터마크가 포함된 리포트를 월 5회까지, Pro는 워터마크 없이 무제한으로 저장할 수 있어요.',
  },
];

function FaqTab() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {FAQS.map((f, i) => (
        <div key={f.q} className="rounded-2xl bg-white border border-navy-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <span className="text-[13px] font-bold text-navy-900">Q. {f.q}</span>
            <span className={`shrink-0 text-navy-400 transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-[12px] leading-relaxed text-slate-500 border-t border-navy-50 pt-3">
              {f.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

type CellValue = boolean | string;

const FEATURE_ROWS: { label: string; trial: CellValue; basic: CellValue; pro: CellValue }[] = [
  { label: '기본 은퇴 진단 (자산 고갈 시점 · 국민연금 분석)', trial: true, basic: true, pro: true },
  { label: '계좌별 자산 정밀 입력', trial: true, basic: true, pro: true },
  { label: '시뮬레이션 횟수', trial: '3회 (1회성)', basic: '월 30회', pro: '무제한' },
  { label: 'PDF 리포트 저장', trial: false, basic: '월 5회 (워터마크)', pro: '무제한' },
  { label: '워터마크 없는 리포트', trial: false, basic: false, pro: true },
  { label: '실시간 슬라이더 조정', trial: false, basic: false, pro: true },
  { label: '3버킷 시나리오 비교 (보수·현재·낙관)', trial: false, basic: false, pro: true },
  { label: '연도별 상세 현금흐름 테이블', trial: false, basic: false, pro: true },
  { label: '과세 vs 비과세 시나리오 비교', trial: false, basic: false, pro: true },
  { label: 'ISA·IRP 절세 분석', trial: false, basic: false, pro: true },
  { label: '절세 인사이트 상세 리포트', trial: false, basic: false, pro: true },
];

function Cell({ value }: { value: CellValue }) {
  if (typeof value === 'string') {
    return <span className="text-[11px] font-bold text-navy-800">{value}</span>;
  }
  return value ? (
    <Check size={16} className="mx-auto text-emerald-600" />
  ) : (
    <X size={14} className="mx-auto text-slate-300" />
  );
}

function PlansTab() {
  const proExclusiveCount = FEATURE_ROWS.filter((r) => r.pro === true && r.basic === false).length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 p-4 text-center">
        <p className="text-[12px] font-bold text-gold-400 mb-1">Pro 전용 기능 {proExclusiveCount}가지</p>
        <p className="text-[13px] font-bold text-white leading-relaxed">
          실시간 조정 · 세금 시나리오 · 절세 분석까지,<br />
          Pro는 진짜 &apos;상담 무기&apos;가 되는 기능이 다 들어있어요.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="border-b border-navy-100">
              <th className="w-[46%] px-3 py-3 text-left font-bold text-navy-500">기능</th>
              <th className="px-2 py-3 text-center font-bold text-slate-500">Trial</th>
              <th className="px-2 py-3 text-center font-bold text-slate-500">Basic</th>
              <th className="px-2 py-3 text-center font-bold text-navy-900 bg-gold-50">
                Pro <span className="ml-1 rounded-full bg-gold-400 px-1.5 py-0.5 text-[9px] text-navy-900">추천</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-navy-50 last:border-0">
                <td className="px-3 py-2.5 text-navy-700">{row.label}</td>
                <td className="px-2 py-2.5 text-center"><Cell value={row.trial} /></td>
                <td className="px-2 py-2.5 text-center"><Cell value={row.basic} /></td>
                <td className="px-2 py-2.5 text-center bg-gold-50/60"><Cell value={row.pro} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-[11px] text-slate-400">가격 및 결제 방법은 담당 설계사에게 문의해 주세요.</p>
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

      <main className="mx-auto max-w-lg px-4 py-6 pb-24 space-y-4">
        {tab === 'notice' && <NoticeTab />}
        {tab === 'review' && <Placeholder title="후기" />}
        {tab === 'guide' && <Placeholder title="계산기 사용 방법" />}
        {tab === 'faq' && <FaqTab />}
        {tab === 'plans' && <PlansTab />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-navy-100 bg-white/95 backdrop-blur px-4 py-4">
        <button
          onClick={() => navigate('/pro/trial')}
          className="mx-auto block w-full max-w-lg rounded-2xl bg-gradient-to-r from-navy-800 to-navy-700 py-4 text-sm font-bold text-white shadow-lg shadow-navy-900/30"
        >
          무료로 체험하기 →
        </button>
      </div>
    </div>
  );
}
