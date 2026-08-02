import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    tag: '이벤트',
    title: '친구 초대하면 다음 달 반값',
    body: '로그인 후 상단의 "🎁 친구 초대" 메뉴에서 내 추천 코드와 링크를 확인할 수 있어요. 그 링크로 가입한 친구가 결제하면, 다음 달 구독료를 할인해 드려요.',
  },
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
    a: 'henry-lim@naver.com으로 문의해 주시면 등급을 바로 올려드려요. 별도의 복잡한 절차 없이 다음 로그인부터 바로 Pro 기능을 이용할 수 있어요.',
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

const INPUT_SECTIONS = [
  {
    title: '기본 정보',
    icon: '👤',
    items: [
      { label: '현재 나이 / 은퇴 희망 나이', desc: '만 나이 기준으로 입력해요. 은퇴 희망 나이는 경제활동을 그만두는 시점이에요.' },
      { label: '국민연금 가입 기간 · 수급 개시 연령', desc: '현재 나이부터 만 60세까지 자동 계산되고, 직접 조정할 수도 있어요. 가입 기간이 길수록 소득대체율이 올라가요.' },
      { label: '현재 세전 연봉', desc: '국민연금 수령액을 계산하는 기준이 되는 값이에요.' },
      {
        label: '[자영업자·프리랜서] 소득을 모를 때 역산하는 법',
        desc: '지역가입자는 국민연금 보험료(9%)를 본인이 전액 부담해요. 그래서 매달 내는 국민연금 납부액만 알면 "월 납부액 ÷ 9%"로 기준소득월액(월 소득)을 거꾸로 구할 수 있어요. 예: 매달 18만 원을 낸다면 18만 ÷ 0.09 = 월 소득 약 200만 원. 상한액·하한액은 매년 바뀌니 정확한 금액은 국민연금공단 고지서로 확인하는 걸 권장해요.',
      },
    ],
  },
  {
    title: '현재 준비 현황',
    icon: '💰',
    items: [
      { label: '은행·CMA / 증권·ETF / 보험 해지환급금', desc: '지금 갖고 있는 예금·적금·주식·펀드·보험 해지환급금을 각각 입력해요.' },
      { label: 'IRP·연금저축 / ISA / 연금저축펀드', desc: '세제 혜택 계좌별로 현재 적립된 금액을 나눠서 입력하면 절세 효과까지 정확하게 반영돼요.' },
    ],
  },
  {
    title: '자산별 정밀 배분 (Pro)',
    icon: '📊',
    items: [
      { label: '계좌별 월 납입액 · 예상 수익률 · 납입 기간', desc: '은행/증권/보험 각각 얼마씩 얼마나 오래 넣을지, 기대 수익률은 얼마인지 세분화해서 입력해요. 계좌별로 세금 처리 방식이 달라서 정확도가 크게 올라가요.' },
    ],
  },
  {
    title: '생활비 & 보험료',
    icon: '☕',
    items: [
      { label: '품격 유지 월 생활비', desc: '은퇴 후 지금 돈의 가치로 원하는 한 달 생활비예요. 물가상승률을 반영해 미래 시점 금액으로 자동 환산돼요.' },
      { label: '월 보장성 보험료', desc: '실손·암·종신 등 보장성 보험료 합계예요. 모르면 0으로 두고 상담 때 확인해도 괜찮아요.' },
    ],
  },
  {
    title: '퇴직급여 & 목적자금',
    icon: '💼',
    items: [
      { label: '예상 퇴직급여 · 수령 방식', desc: '퇴직 시점 예상 수령액과 IRP 이전(저율과세) vs 일시금 수령(퇴직소득세 공제) 중 방식을 선택해요.' },
      { label: '목적자금 이벤트', desc: '결혼·주택마련·자녀교육·자녀결혼처럼 은퇴 전 큰돈이 나가는 시점을 추가하면 시뮬레이션이 더 현실적으로 반영돼요.' },
    ],
  },
  {
    title: '생활비 설정',
    icon: '🏠',
    items: [
      { label: '활동 종료 나이', desc: '이 나이 이후로는 생활비가 75% 수준으로 자동으로 줄어들어요.' },
      { label: '월 의료비 예비금', desc: '80세 이후 의료비·간병비로 추가되는 금액이에요. 물가상승률이 반영돼 매년 늘어나요.' },
    ],
  },
];

const RESULT_ITEMS = [
  { label: '"OO세에 종료됩니다" (헤드라인)', desc: '지금 준비 상황이 그대로 이어질 경우, 자산이 바닥나는 예상 나이예요. 기대수명(100세)보다 빠르면 부족액이 있다는 뜻이에요.' },
  { label: '은퇴 시점 예상 자산', desc: '은퇴하는 나이까지 은행·증권·보험 계좌에 쌓이는 총 자산 규모예요.' },
  { label: '은퇴 후 필요 월 생활비', desc: '입력한 "지금 가치" 생활비에 물가상승률(연 3%)을 반영해서, 은퇴 시점 기준으로 환산한 실제 필요 금액이에요.' },
  { label: '품격 유지 부족액', desc: '100세까지 지금 수준의 생활을 유지하는 데 지금 준비된 자산으로는 얼마나 모자란지 보여줘요.' },
  { label: '국민연금 예상 월 수령', desc: '가입 기간·소득대체율 기준으로 계산된 국민연금 수령 예상액이에요. 수급 개시 이후 매년 물가상승률만큼 올라요.' },
  { label: '세금·건보료로 사라지는 돈', desc: '은행·증권 계좌의 이자소득세(15.4%)와 건강보험료로 평생 얼마나 빠져나가는지 보여줘요. 보험(비과세) 비중을 높이면 이 금액이 줄어요.' },
  { label: '수익률 시나리오 3종 비교 (Pro)', desc: '증권 수익률을 ±2%p 낮추거나(보수적) 높였을 때(낙관적) 자산 고갈 시점이 어떻게 달라지는지 비교해요.' },
];

const GRAPH_ITEMS = [
  { color: 'bg-red-500', label: '명목 자산', desc: '원금과 이자를 그대로 합친 금액이에요. 물가상승은 반영 안 된 "숫자 그대로"의 자산이에요.' },
  { color: 'bg-orange-400', label: '실질 가치', desc: '명목 자산을 현재 물가 기준 구매력으로 환산한 금액이에요. 시간이 지날수록 명목 자산과의 차이가 벌어져요.' },
  { color: 'bg-emerald-500', label: '절세계좌 재원', desc: 'ISA·IRP처럼 세제 혜택을 받는 계좌에 남아있는 자산이에요.' },
  { color: 'bg-slate-400', label: '은행 예금만', desc: '만약 전부 은행 예금으로만 굴렸다면 어땠을지 비교하는 기준선이에요.' },
];

function AccordionSection({ items }: { items: { label: string; desc: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={it.label} className="rounded-xl bg-navy-50/60">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left"
          >
            <span className="text-[12.5px] font-bold text-navy-800">{it.label}</span>
            <span className={`shrink-0 text-navy-400 text-[11px] transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open === i && (
            <div className="px-3.5 pb-3 text-[11.5px] leading-relaxed text-slate-500">{it.desc}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function GuideTab() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-[13px] font-bold text-navy-900 mb-1">① 입력 방법</h2>
        <p className="text-[11.5px] text-slate-400 mb-3">순서대로 채우면 돼요. 모르는 값은 대략만 입력해도 괜찮아요.</p>
        <div className="space-y-3">
          {INPUT_SECTIONS.map((sec) => (
            <div key={sec.title} className="rounded-2xl bg-white border border-navy-100 shadow-sm p-3.5">
              <p className="text-[13px] font-bold text-navy-900 mb-2">
                <span className="mr-1.5">{sec.icon}</span>
                {sec.title}
              </p>
              <AccordionSection items={sec.items} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-bold text-navy-900 mb-1">② 결과 화면 읽는 법</h2>
        <p className="text-[11.5px] text-slate-400 mb-3">결과 화면에 뜨는 숫자들이 각각 무슨 뜻인지 정리했어요.</p>
        <div className="rounded-2xl bg-white border border-navy-100 shadow-sm p-3.5">
          <AccordionSection items={RESULT_ITEMS} />
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-bold text-navy-900 mb-1">③ 그래프 보는 법</h2>
        <p className="text-[11.5px] text-slate-400 mb-3">
          "축적기 → 인출기 통합 분석 그래프"에는 선이 4개 겹쳐 있어요. 각 선의 의미예요.
        </p>
        <div className="rounded-2xl bg-white border border-navy-100 shadow-sm p-3.5 space-y-2.5">
          {GRAPH_ITEMS.map((g) => (
            <div key={g.label} className="flex gap-2.5">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${g.color}`} />
              <div>
                <p className="text-[12px] font-bold text-navy-800">{g.label}</p>
                <p className="text-[11.5px] leading-relaxed text-slate-500">{g.desc}</p>
              </div>
            </div>
          ))}
          <p className="pt-1 text-[11px] text-slate-400 border-t border-navy-50 mt-2">
            그래프 위 회색 세로선은 은퇴 시점, 빨간 세로선은 자산 고갈 예상 시점이에요.
          </p>
        </div>
      </section>
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

const PRICE_PLANS = [
  { key: 'trial', name: 'Trial', monthly: '무료', yearly: null, note: '14일 · 3회 한정' },
  { key: 'basic', name: 'Basic', monthly: '29,000원', yearly: '290,000원', note: '연 결제 시 2개월 무료' },
  { key: 'pro', name: 'Pro', monthly: '49,000원', yearly: '490,000원', note: '연 결제 시 2개월 무료', highlight: true },
] as const;

function PriceCards() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PRICE_PLANS.map((p) => (
        <div
          key={p.key}
          className={`rounded-2xl border p-3 text-center ${
            'highlight' in p && p.highlight
              ? 'border-gold-400 bg-gold-50 shadow-sm'
              : 'border-navy-100 bg-white'
          }`}
        >
          <p className="text-[11px] font-bold text-navy-500 mb-1">{p.name}</p>
          <p className="text-[15px] font-extrabold text-navy-900 leading-tight">{p.monthly}</p>
          {p.monthly !== '무료' && <p className="text-[10px] text-slate-400 mb-1">/ 월</p>}
          {p.yearly && (
            <p className="text-[10px] text-emerald-600 font-bold mt-1">연 {p.yearly} (2개월 무료)</p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">{p.note}</p>
        </div>
      ))}
    </div>
  );
}

const REFUND_POLICY = [
  '최초 결제 후 7일 이내이고 서비스를 이용하지 않았다면 전액 환불해 드려요.',
  '서비스를 이용하기 시작한 이후에는 단순 변심에 의한 환불은 어려워요. 대신 자동결제 해지는 언제든 가능하고, 해지해도 이미 결제한 기간까지는 계속 이용할 수 있어요.',
  '연 구독을 중도 해지하는 경우도 마찬가지로 환불은 안 되지만, 다음 자동결제만 중단되고 남은 기간은 끝까지 이용할 수 있어요.',
  '서비스 오류 등 회사 귀책 사유로 정상적으로 이용하지 못한 기간이 있다면 해당 기간만큼 별도로 보상해 드려요.',
];

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

      <PriceCards />

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

      <div className="rounded-2xl bg-white border border-navy-100 shadow-sm p-4">
        <p className="text-[12.5px] font-bold text-navy-900 mb-2">환불 정책</p>
        <ul className="space-y-1.5">
          {REFUND_POLICY.map((line) => (
            <li key={line} className="flex gap-2 text-[11.5px] leading-relaxed text-slate-500">
              <span className="shrink-0 text-navy-300">·</span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-[11px] text-slate-400">결제 방법에 대해 궁금한 점은 henry-lim@naver.com으로 문의해 주세요.</p>
      <p className="text-center text-[11px] text-slate-400">
        <Link to="/terms" className="underline underline-offset-2">이용약관</Link> 보기
      </p>
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
        {tab === 'guide' && <GuideTab />}
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
