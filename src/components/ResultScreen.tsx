import { useState, useMemo, useRef, useEffect } from 'react';

import {

  AreaChart,

  Area,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  ReferenceLine,

  ReferenceArea,

  Legend,

  ResponsiveContainer,

} from 'recharts';

import { ChevronLeft, AlertTriangle, TrendingDown, Lightbulb, Table2, SlidersHorizontal, CalendarDays, BadgeAlert, ShieldAlert, Flame, ChevronRight, Info, Landmark, Shield, TrendingUp, AlertCircle } from 'lucide-react';

import { simulate, formatKRW, formatMan, DEFAULT_BANK_RATE, DEFAULT_STOCK_RATE, DEFAULT_INS_RATE } from '../lib/calculator';

import type { SimulationResult, SimulatorInputs } from '../lib/calculator';
import { proFeatures, type ProTier } from '../lib/proTier';
import { canRunBasicPrint, recordBasicPrint } from '../lib/proUsageLimits';
import ProUpgradePrompt from './ProUpgradePrompt';



interface Props {

  result: SimulationResult;

  onBack: () => void;

  tier?: ProTier;

}



const BLUE   = '#3b82f6';

const RED    = '#ef4444';

const GOLD   = '#eda607';

const EMERALD = '#10b981';

const SLATE  = '#64748b';

const CHART_LEGEND_PROPS = {
  wrapperStyle: { fontSize: 10, color: '#0f2057', fontWeight: 700, paddingTop: 8 },
  iconSize: 8,
} as const;

const PENSION_ANNUAL_INCREASE = 0.03;
const LIFE_EXPECTANCY = 100;

function calcTotalNetPensionTo100(
  baseMonthlyPension: number,
  startAge: number,
  adjustmentRate: number,
  healthInsuranceTriggered: boolean,
): number {
  const PENSION_TAX = 0.04;
  const HEALTH_INS = 0.08;
  const HEALTH_THRESHOLD = 20000000;
  let total = 0;
  for (let age = startAge; age <= LIFE_EXPECTANCY; age++) {
    const yrs = age - startAge;
    const grossMonthly = baseMonthlyPension * (1 + adjustmentRate)
      * Math.pow(1 + PENSION_ANNUAL_INCREASE, yrs);
    const annual = grossMonthly * 12;
    const tax = annual * PENSION_TAX;
    const hi = healthInsuranceTriggered || annual > HEALTH_THRESHOLD ? grossMonthly * HEALTH_INS * 12 : 0;
    total += annual - tax - hi;
  }
  return total;
}

function formatPensionAdjustment(rate: number): string {
  if (rate < 0) return `${Math.abs(rate * 100).toFixed(0)}% 감액`;
  if (rate > 0) return `+${(rate * 100).toFixed(1)}% 증액`;
  return '조정 없음';
}



function formatAxis(v: number) {

  if (v >= 100000000) return `${(v / 100000000).toFixed(0)}억`;

  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;

  return String(v);

}



interface TooltipProps {

  active?: boolean;

  payload?: Array<{ name: string; value: number; color: string }>;

  label?: string;

}



function CustomTooltip({ active, payload, label }: TooltipProps) {

  if (!active || !payload?.length) return null;

  return (

    <div className="bg-navy-900 border border-navy-700 rounded-xl shadow-xl p-3 text-xs min-w-[150px]">

      <p className="font-bold text-gold-400 mb-2">{label}세</p>

      {payload.map((p) => (

        <div key={p.name} className="flex justify-between gap-4 mb-1">

          <span style={{ color: p.color }} className="font-medium">{p.name}</span>

          <span className="font-semibold text-white">{formatKRW(p.value, true)}</span>

        </div>

      ))}

    </div>

  );

}



function StatCard({ label, value, sub, accent = false, danger = false }: {

  label: string; value: string; sub?: string; accent?: boolean; danger?: boolean;

}) {

  return (

    <div className={`rounded-2xl p-4 border ${danger ? 'bg-red-50 border-red-200' : accent ? 'bg-navy-50 border-navy-200' : 'bg-white border-navy-100'}`}>

      <p className={`text-[11px] font-semibold mb-1 ${danger ? 'text-red-500' : accent ? 'text-navy-500' : 'text-navy-400'}`}>{label}</p>

      <p className={`text-lg font-extrabold leading-tight ${danger ? 'text-red-600' : accent ? 'text-navy-700' : 'text-navy-900'}`}>{value}</p>

      {sub && <p className="text-[10px] text-navy-400 mt-0.5">{sub}</p>}

    </div>

  );

}



const MAN_R = 10000;



// ── 컴팩트 슬라이더 ────────────────────────────────────────────────────────────

function CompactSlider({

  label, value, min, max, step, display, track, thumb, onChange,

}: {

  label: string; value: number; min: number; max: number; step: number;

  display: (v: number) => string; track: string; thumb: string;

  onChange: (v: number) => void;

}) {

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (

    <div>

      <div className="flex items-center justify-between mb-1.5">

        <span className="text-[10px] text-slate-500">{label}</span>

        <span className="text-[11px] font-bold text-slate-800">{display(value)}</span>

      </div>

      <div className="relative h-1.5">

        <div className="absolute inset-0 rounded-full bg-slate-100" />

        <div className={`absolute h-full rounded-full ${track} transition-all duration-150`} style={{ width: `${pct}%` }} />

        <input type="range" min={min} max={max} step={step} value={value}

          onChange={(e) => onChange(Number(e.target.value))}

          className="absolute inset-0 w-full opacity-0 cursor-pointer" />

        <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${thumb} border-2 border-white shadow-md pointer-events-none`}

          style={{ left: `calc(${pct}% - 8px)` }} />

      </div>

    </div>

  );

}



// ── 실시간 조정 패널 ───────────────────────────────────────────────────────────

function LivePensionSlider({

  inputs,

  annualFinancialTax,

  onChange,

}: {

  inputs: SimulatorInputs;

  annualFinancialTax: number;

  onChange: (updated: SimulatorInputs) => void;

}) {

  const {

    pensionYears,

    monthlyBank, bankRate,

    monthlyStock, stockRate,

    monthlyInsurance, insuranceRate,

  } = inputs;



  const bankR = bankRate ?? DEFAULT_BANK_RATE;

  const stockR = stockRate ?? DEFAULT_STOCK_RATE;

  const insR = insuranceRate ?? DEFAULT_INS_RATE;



  const pct = ((pensionYears - 10) / 30) * 100;

  const trackColor = pensionYears < 20 ? 'bg-red-400' : pensionYears < 30 ? 'bg-amber-400' : 'bg-emerald-500';

  const tier = pensionYears < 20

    ? { label: '소득대체율 12%', color: 'text-red-500' }

    : pensionYears < 30

    ? { label: '소득대체율 18%', color: 'text-amber-500' }

    : { label: '소득대체율 25%', color: 'text-emerald-600' };



  const totalMonthly = monthlyBank + monthlyStock + monthlyInsurance;

  const showTaxWarning = stockR >= 8;



  return (

    <div className="bg-white rounded-2xl border border-navy-200 shadow-sm overflow-hidden">

      {/* 헤더 */}

      <div className="px-5 pt-4 pb-3 border-b border-navy-50 flex items-center gap-2 bg-navy-900 rounded-t-2xl">

        <SlidersHorizontal size={15} className="text-gold-400" />

        <p className="text-sm font-bold text-white">실시간 조정</p>

        <span className="text-[10px] text-navy-300 ml-auto">그래프 즉시 반영</span>

      </div>



      <div className="px-5 py-4 flex flex-col gap-5">

        {/* 국민연금 */}

        <div>

          <div className="flex items-center justify-between mb-2">

            <div className="flex items-center gap-1.5">

              <CalendarDays size={13} className="text-slate-400" />

              <p className="text-[11px] font-semibold text-slate-700">국민연금 가입 기간</p>

            </div>

            <div>

              <span className="text-sm font-extrabold text-slate-900">{pensionYears}년</span>

              <span className={`ml-1.5 text-[10px] font-bold ${tier.color}`}>{tier.label}</span>

            </div>

          </div>

          <div className="relative h-2">

            <div className="absolute inset-0 rounded-full bg-slate-100" />

            <div className={`absolute h-full rounded-full ${trackColor} transition-all`} style={{ width: `${pct}%` }} />

            <input type="range" min={10} max={40} step={1} value={pensionYears}

              onChange={(e) => onChange({ ...inputs, pensionYears: Number(e.target.value) })}

              className="absolute inset-0 w-full opacity-0 cursor-pointer" />

            <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${trackColor} border-2 border-white shadow-lg pointer-events-none`}

              style={{ left: `calc(${pct}% - 10px)` }} />

          </div>

          <div className="flex justify-between mt-1"><span className="text-[10px] text-slate-300">10년</span><span className="text-[10px] text-slate-300">40년</span></div>

        </div>



        {/* ── 은행 버킷 ── */}

        <div className="rounded-xl border border-navy-200 overflow-hidden">

          <div className="bg-navy-700 px-3 py-2 flex items-center gap-1.5">

            <Landmark size={12} className="text-white" />

            <span className="text-[11px] font-bold text-white">은행 적립</span>

            <span className="ml-auto text-[9px] bg-navy-500 text-white px-1.5 py-0.5 rounded-full">과세</span>

          </div>

          <div className="px-3 py-3 flex flex-col gap-3">

            <CompactSlider label="매월 적립액"

              value={monthlyBank} min={0} max={MAN_R * 300} step={MAN_R * 10}

              display={(v) => `${Math.floor(v / MAN_R)}만 원`}

              track="bg-slate-500" thumb="bg-slate-600"

              onChange={(v) => onChange({ ...inputs, monthlyBank: v })} />

            <CompactSlider label="수익률 (연)"

              value={bankR} min={0.5} max={15} step={0.5}

              display={(v) => `${v.toFixed(1)}%`}

              track="bg-slate-400" thumb="bg-slate-500"

              onChange={(v) => onChange({ ...inputs, bankRate: v })} />

          </div>

        </div>



        {/* ── 증권 버킷 ── */}

        <div className="rounded-xl border border-red-200 overflow-hidden">

          <div className="bg-red-600 px-3 py-2 flex items-center gap-1.5">

            <TrendingUp size={12} className="text-white" />

            <span className="text-[11px] font-bold text-white">증권 투자</span>

            <span className="ml-auto text-[9px] bg-red-400 text-white px-1.5 py-0.5 rounded-full">과세</span>

          </div>

          <div className="px-3 py-3 flex flex-col gap-3">

            <CompactSlider label="매월 적립액"

              value={monthlyStock} min={0} max={MAN_R * 300} step={MAN_R * 10}

              display={(v) => `${Math.floor(v / MAN_R)}만 원`}

              track="bg-red-500" thumb="bg-red-600"

              onChange={(v) => onChange({ ...inputs, monthlyStock: v })} />

            <CompactSlider label="수익률 (연)"

              value={stockR} min={0.5} max={15} step={0.5}

              display={(v) => `${v.toFixed(1)}%`}

              track="bg-red-400" thumb="bg-red-500"

              onChange={(v) => onChange({ ...inputs, stockRate: v })} />

          </div>

          {/* 세금 경고: 증권 수익률 8% 이상 */}

          {showTaxWarning && (

            <div className="mx-3 mb-3 bg-red-50 border border-red-100 rounded-lg p-2.5 flex gap-2">

              <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />

              <p className="text-[10px] text-red-700 leading-relaxed">

                <strong>수익률이 높을수록 세금과 건보료 부담도 커집니다.</strong>

                {' '}비과세 계좌의 가치가 더 높아지는 시점입니다.

              </p>

            </div>

          )}

        </div>



        {/* ── 보험 버킷 ── */}

        <div className="rounded-xl border border-gold-300 overflow-hidden">

          <div className="bg-gold-600 px-3 py-2 flex items-center gap-1.5">

            <Shield size={12} className="text-white" />

            <span className="text-[11px] font-bold text-white">보험·비과세 연금</span>

            <span className="ml-auto text-[9px] bg-gold-200 text-gold-900 px-1.5 py-0.5 rounded-full">비과세</span>

          </div>

          <div className="px-3 py-3 flex flex-col gap-3">

            <CompactSlider label="매월 적립액"

              value={monthlyInsurance} min={0} max={MAN_R * 300} step={MAN_R * 10}

              display={(v) => `${Math.floor(v / MAN_R)}만 원`}

              track="bg-amber-500" thumb="bg-amber-600"

              onChange={(v) => onChange({ ...inputs, monthlyInsurance: v })} />

            <CompactSlider label="수익률 (연)"

              value={insR} min={0.5} max={15} step={0.5}

              display={(v) => `${v.toFixed(1)}%`}

              track="bg-amber-400" thumb="bg-amber-500"

              onChange={(v) => onChange({ ...inputs, insuranceRate: v })} />

            <CompactSlider label="납입 기간"

              value={inputs.insurancePaymentYears ?? 120} min={1} max={240} step={1}

              display={(v) => `${v}개월 (${Math.floor(v/12)}년 ${v%12 > 0 ? v%12 + '개월' : ''})`}

              track="bg-amber-300" thumb="bg-amber-500"

              onChange={(v) => onChange({ ...inputs, insurancePaymentYears: v })} />

            {/* 납입 종료 후 복리 증식 안내 */}

            {inputs.insurancePaymentYears != null && inputs.insurancePaymentYears <= 10 && monthlyInsurance > 0 && (

              <div className="flex items-start gap-1.5 bg-amber-50 rounded-lg px-2.5 py-2 border border-amber-100">

                <span className="text-amber-500 shrink-0 mt-0.5 text-[10px] font-extrabold">★</span>

                <p className="text-[10px] text-amber-800 leading-snug">

                  현재의 집중 투자가 미래의 강력한 복리 효과를 만듭니다.

                  <br /><span className="text-amber-600 font-semibold">{inputs.currentAge + Math.min(inputs.insurancePaymentYears ?? 10, Math.max(0, inputs.retirementAge - inputs.currentAge))}세 이후 납입 없이</span> 스스로 증식됩니다.

                </p>

              </div>

            )}

          </div>

        </div>



        {/* 과세 자산 세금 인사이트 */}

        {annualFinancialTax > 0 && (

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">

            <Flame size={13} className="text-orange-500 shrink-0 mt-0.5" />

            <p className="text-[10px] text-slate-600 leading-relaxed">

              은퇴 첫해 은행·증권 자산 수익에서{' '}

              <strong className="text-orange-600">{formatKRW(annualFinancialTax, true)}</strong>의

              세금·건보료가 발생합니다. 보험 비중을 높이면 이 비용이 절감됩니다.

            </p>

          </div>

        )}



        {/* 구성 비중 바 */}

        {totalMonthly > 0 && (

          <div>

            <p className="text-[10px] text-slate-400 mb-1.5">현재 적립 비중</p>

            <div className="flex h-3 rounded-full overflow-hidden">

              <div className="bg-slate-500 transition-all" style={{ width: `${(monthlyBank / totalMonthly) * 100}%` }} />

              <div className="bg-red-500 transition-all" style={{ width: `${(monthlyStock / totalMonthly) * 100}%` }} />

              <div className="bg-amber-400 transition-all" style={{ width: `${(monthlyInsurance / totalMonthly) * 100}%` }} />

            </div>

            <div className="flex justify-between mt-1.5 text-[10px]">

              <span className="text-slate-500">은행 {Math.round((monthlyBank / totalMonthly) * 100)}%</span>

              <span className="text-red-500">증권 {Math.round((monthlyStock / totalMonthly) * 100)}%</span>

              <span className="text-amber-600">보험 {Math.round((monthlyInsurance / totalMonthly) * 100)}%</span>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}



export default function ResultScreen({ result: initialResult, onBack, tier = 'plus' }: Props) {

  const features = proFeatures(tier);
  const [showTable, setShowTable] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const [liveInputs, setLiveInputs] = useState<SimulatorInputs>(initialResult.inputs);
  /** 좁은 화면·일부 폰(가로/세로 판별 이슈): 차트 라벨 비활성 + 단순 레이아웃 */
  const [compactChart, setCompactChart] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => {
      const shortSide = Math.min(window.innerWidth, window.innerHeight);
      setCompactChart(mq.matches || shortSide < 520);
    };
    update();
    mq.addEventListener('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);



  // 실시간 재계산

  const result = useMemo(() => simulate(liveInputs), [liveInputs]);



  const {

    inputs,

    retirementBalance,

    retirementBalanceBank,

    retirementBalanceStock,

    retirementBalanceInsurance,

    inflationAdjustedMonthlyExpense,

    pensionAtRetirement,

    pensionNetAtRetirement,

    pensionReplacementRate,

    dignityEndAge,

    dignityEndAgeGross,

    dignityEndAgeInsOnly,

    extraNeeded,

    yearRows,

    weakPension,

    highIncome,

    pensionCapped,

    pensionUncapped,

    totalTaxBurden,

    taxFreeYearsGained,

    healthInsuranceTriggered,

    monthlySavingsNeededFor100,

    insurancePaymentEndAge,

    insAnnuityMonthly,

    annualFinancialTaxAtRetirement,

    pensionAdjustmentRate,

    pensionBreakevenAge,

    isaTaxSaved,

    pension401kTotalTax,

  } = result;



  const stockRateBase = liveInputs.stockRate ?? DEFAULT_STOCK_RATE;

  const scenarioResults = useMemo(() => {
    const conservativeRate = Math.max(1, stockRateBase - 2);
    const optimisticRate = stockRateBase + 2;
    return {
      conservative: simulate({ ...liveInputs, stockRate: conservativeRate }),
      current: simulate({ ...liveInputs, stockRate: stockRateBase }),
      optimistic: simulate({ ...liveInputs, stockRate: optimisticRate }),
    };
  }, [liveInputs, stockRateBase]);

  const pensionTotalDiffVs65 = useMemo(() => {
    const startAge = inputs.pensionStartAge ?? 65;
    const totalAt65 = calcTotalNetPensionTo100(pensionAtRetirement, 65, 0, healthInsuranceTriggered);
    const totalAtStart = calcTotalNetPensionTo100(
      pensionAtRetirement,
      startAge,
      pensionAdjustmentRate,
      healthInsuranceTriggered,
    );
    return totalAtStart - totalAt65;
  }, [inputs.pensionStartAge, pensionAtRetirement, pensionAdjustmentRate, healthInsuranceTriggered]);



  const { activeEndAge, medicalCostEnabled } = inputs;

  const reportActionsRef = useRef<HTMLDivElement>(null);

  function scrollToReportActions() {
    reportActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const { retirementAge, monthlyExpense } = inputs;

  const isSafe = dignityEndAge === null;



  // 자산 추이 그래프용: 현재 나이부터 전체

  // 시나리오2: 보험 제외
  const noInsResult = useMemo(() => simulate({ ...liveInputs, monthlyInsurance: 0, savingsInsurance: 0 }), [liveInputs]);
  // 시나리오3: 은행만
  const bankOnlyResult = useMemo(() => simulate({ ...liveInputs, monthlyInsurance: 0, savingsInsurance: 0, monthlyStock: 0, savingsStock: 0, monthlyPension401k: 0, savingsPension401k: 0, isaMonthly: 0, savingsIsa: 0 }), [liveInputs]);
  const noInsRowMap = new Map(noInsResult.yearRows.map(r => [r.age, r]));
  const bankRowMap = new Map(bankOnlyResult.yearRows.map(r => [r.age, r]));

  const graphData = yearRows.map((r) => ({

    age: r.age,

    잔고: r.balance > 0 ? Math.round(r.balance) : 0,

    실질가치: r.balanceReal > 0 ? Math.round(r.balanceReal) : 0,

    절세계좌만: (() => { const row = noInsRowMap.get(r.age); return row && row.balance > 0 ? Math.round(row.balance) : 0; })(),

    은행만: (() => { const row = bankRowMap.get(r.age); return row && row.balance > 0 ? Math.round(row.balance) : 0; })(),

    isAccumulationPhase: r.isAccumulationPhase,

  }));



  // 수입·지출 차트용: 은퇴 이후만 (배당 포함)

  const incomeExpenseData = yearRows

    .filter((r) => r.age >= retirementAge)

    .map((r) => ({

      age: r.age,

      생활비: Math.round(r.livingExpense + r.medicalExpense),

      의료비: Math.round(r.medicalExpense),

      국민연금: Math.round(r.pensionNet),

      배당소득: Math.round(r.dividendIncome),

      배당실질: Math.round(r.dividendReal),

      보험연금: inputs.monthlyInsurance > 0 ? Math.round(r.insuranceAnnuity) : 0,

    }));



  const depletionAge = dignityEndAge;

  const depletionAgeGross = dignityEndAgeGross;



  return (

    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* Sticky header */}

      <div className="bg-navy-900 px-4 pt-12 pb-4 border-b border-navy-700 sticky top-0 z-20">

        <div className="flex items-center gap-3">

          <button

            onClick={onBack}

            className="w-9 h-9 rounded-xl bg-navy-800 flex items-center justify-center text-navy-200 hover:bg-navy-700 transition"

          >

            <ChevronLeft size={18} />

          </button>

          <div>

            <p className="text-[11px] text-navy-400 font-medium">진단 결과</p>

            <p className="text-sm font-bold text-white">노후 품격 유지 한계선</p>

          </div>

          {!isSafe ? (

            <div className="ml-auto flex items-center gap-1.5 bg-red-900/50 border border-red-700 rounded-xl px-3 py-1.5">

              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />

              <span className="text-[11px] font-extrabold text-red-300">{dignityEndAge}세 종료</span>

            </div>

          ) : (

            <div className="ml-auto flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-700 rounded-xl px-3 py-1.5">

              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

              <span className="text-[11px] font-extrabold text-emerald-300">100세 안전</span>

            </div>

          )}

        </div>

      </div>



      <div className="flex-1 px-4 py-5 flex flex-col gap-4">



        <div id="pro-result-pdf-capture" className="flex flex-col gap-4">

        {/* ── Headline Banner ── */}

        {!isSafe ? (

          <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 text-white p-6 shadow-2xl border border-navy-700 transition-all duration-500">

            <div className="flex items-center gap-2 mb-3">

              <AlertTriangle size={15} className="text-red-400" />

              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-red-400">노후 품격 위기 경보</span>

            </div>

            <p className="text-[13px] text-navy-300 mb-2">현재 준비 상황을 기준으로</p>

            <p className="text-[22px] font-extrabold leading-tight transition-all duration-300">

              고객님의 품격 있는 노후는<br />

              <span className="text-red-400">{dignityEndAge}세에 종료됩니다</span>

            </p>

            <div className="h-px bg-gold-600/30 my-4" />

            <p className="text-[12px] text-navy-300 leading-relaxed">

              인플레이션 반영 시 은퇴 후 원하는{' '}

              <strong className="text-white">{formatMan(monthlyExpense)}</strong>은

              실질 구매력이 절반 이하로 떨어지며,

              기대수명(100세)보다{' '}

              <strong className="text-red-400">{100 - (dignityEndAge ?? 0)}년 이른</strong> 시점에 예상 자산이 고갈됩니다.

            </p>

          </div>

        ) : (

          <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-700 text-white p-6 shadow-xl border border-gold-600/30">

            <p className="text-[11px] font-bold tracking-widest uppercase text-gold-400 mb-2">진단 결과</p>

            <p className="text-xl font-extrabold">100세까지 품격이 유지됩니다.</p>

            <p className="text-sm text-navy-300 mt-2">현재 준비 상황으로 안정적인 노후가 가능합니다.</p>

          </div>

        )}



        {/* ── 국민연금 경고 (25년 미만) ── */}

        {weakPension && (

          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-fade-in">

            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />

            <p className="text-[12px] text-amber-900 leading-relaxed font-medium">

              <strong>경고: 국민연금 납입 기간이 짧아 노후 기초 자산이 매우 취약합니다.</strong><br />

              개인 연금을 통한 강제 저축이 시급합니다.

            </p>

          </div>

        )}



        {/* ── 경고 통계 2종: 노인 자살률 + 인플레이션 (2열) ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-rose-200 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500">
                <ShieldAlert size={13} className="text-white" />
              </div>
              <span className="text-[8px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">필독</span>
            </div>
            <p className="text-[11px] font-extrabold text-rose-900 leading-snug">노인 자살률 OECD 1위</p>
            <p className="text-[10px] font-bold text-rose-700 mt-1 leading-relaxed">
              10만 명당 41.7명 · OECD 2.6배<br />
              이유 1위: 경제난 · 건강문제
            </p>
            <p className="text-[8px] text-rose-400 mt-1.5">출처: OECD·한국보건사회연구원</p>
          </div>

          {(() => {
            const yearsToRet = retirementAge - inputs.currentAge;
            const expAtRet = Math.round(monthlyExpense * Math.pow(1.03, yearsToRet) / 10000) * 10000;
            const ratio = expAtRet / monthlyExpense;
            return (
              <div className="rounded-2xl bg-gradient-to-br from-red-900 to-red-800 p-3 border border-red-700">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">📈</span>
                  <p className="text-[8px] font-bold text-red-300 tracking-wide uppercase">인플레이션</p>
                </div>
                <p className="text-white text-[11px] font-extrabold leading-snug">
                  {Math.floor(monthlyExpense / 10000).toLocaleString()}만원<br />
                  → <span className="text-red-300">{retirementAge}세 {Math.floor(expAtRet / 10000).toLocaleString()}만원</span>
                </p>
                <div className="bg-black/20 rounded-lg p-2 mt-2 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[7px] text-red-400">증가배율</p>
                    <p className="text-[13px] font-bold text-amber-300">×{ratio.toFixed(1)}</p>
                  </div>
                </div>
                <p className="text-[8px] text-red-400 mt-1.5">※ 연 3% 물가상승률 기준</p>
              </div>
            );
          })()}
        </div>

        {/* ── Key Metrics ── */}

        <div className="grid grid-cols-2 gap-3">

          <div className="col-span-2 rounded-2xl p-4 bg-navy-900 border border-navy-700">

            <p className="text-[11px] font-semibold text-gold-400 mb-1">은퇴 시점 예상 자산 ({retirementAge}세)</p>

            <p className="text-xl font-extrabold text-white mb-3">{formatKRW(retirementBalance)}</p>

            <div className="grid grid-cols-3 gap-2">

              <div className="bg-white rounded-xl p-2.5 text-center">

                <Landmark size={12} className="text-slate-400 mx-auto mb-1" />

                <p className="text-[10px] text-slate-400">은행</p>

                <p className="text-xs font-bold text-slate-700">{formatKRW(retirementBalanceBank, true)}</p>

              </div>

              <div className="bg-white rounded-xl p-2.5 text-center">

                <TrendingUp size={12} className="text-blue-400 mx-auto mb-1" />

                <p className="text-[10px] text-slate-400">증권</p>

                <p className="text-xs font-bold text-slate-700">{formatKRW(retirementBalanceStock, true)}</p>

              </div>

              <div className="bg-white rounded-xl p-2.5 text-center">

                <Shield size={12} className="text-emerald-500 mx-auto mb-1" />

                <p className="text-[10px] text-slate-400">보험</p>

                <p className="text-xs font-bold text-emerald-600">{formatKRW(retirementBalanceInsurance, true)}</p>

              </div>

            </div>

          </div>

          <StatCard

            label="은퇴 후 필요 월 생활비"

            value={formatKRW(inflationAdjustedMonthlyExpense)}

            sub={`현재 ${formatMan(monthlyExpense)} → 물가 반영`}

          />

          <StatCard

            label={isSafe ? '90세까지 여유 자금' : '품격 유지 부족액'}

            value={formatKRW(extraNeeded)}

            sub={isSafe ? '안정적 수준' : `90세까지 부족`}

            danger={!isSafe}

          />

          {/* 국민연금 카드 — 상한선 시각화 포함 */}

          <div className={`rounded-2xl p-4 border col-span-2 ${pensionCapped ? 'bg-navy-50 border-navy-200' : 'bg-white border-navy-100'}`}>

            <div className="flex items-center justify-between mb-2">

              <p className="text-[11px] font-semibold text-navy-400">

                국민연금 예상 월 수령 ({pensionReplacementRate.toFixed(0)}% 소득대체율 · {inputs.pensionYears}년)

              </p>

              {pensionCapped && (

                <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full tracking-wide">

                  상한선 적용

                </span>

              )}

            </div>

            <div className="flex items-baseline gap-3">

              <p className="text-lg font-extrabold text-blue-600">{formatKRW(pensionAtRetirement)}</p>

              {healthInsuranceTriggered && (

                <p className="text-sm font-bold text-red-500">

                  → 세후 {formatKRW(pensionNetAtRetirement)}

                </p>

              )}

            </div>

            <p className="text-[10px] text-slate-400 mt-0.5">

              은퇴 시점 기준 · 이후 매년 3% 인상

              {healthInsuranceTriggered && ' · 건보료+연금소득세 차감 후'}

            </p>



            {/* 상한선 시각화 바 */}

            {pensionCapped && pensionUncapped > 0 && (

              <div className="mt-3">

                <div className="flex justify-between text-[10px] text-slate-400 mb-1">

                  <span>소득 기반 계산액</span>

                  <span className="text-slate-500 font-semibold">{formatKRW(pensionUncapped, true)} → 상한선 차단</span>

                </div>

                <div className="relative h-3 rounded-full bg-slate-200 overflow-hidden">

                  {/* 실제 수령 비율 */}

                  <div

                    className="absolute h-full rounded-full bg-blue-400 transition-all duration-500"

                    style={{ width: `${Math.min(100, (pensionAtRetirement / pensionUncapped) * 100)}%` }}

                  />

                  {/* 상한 기준선 */}

                  <div className="absolute right-0 top-0 h-full w-0.5 bg-red-400" />

                </div>

                <div className="flex justify-between text-[10px] mt-1">

                  <span className="text-blue-500 font-semibold">{formatKRW(pensionAtRetirement, true)} 실수령</span>

                  <span className="text-red-400 font-semibold">상한 {formatKRW(pensionUncapped, true)}</span>

                </div>

              </div>

            )}

          </div>

        </div>



        {/* ── 고소득자 팩트 안내 ── */}

        {highIncome && (

          <div className="flex gap-3 bg-slate-900 rounded-2xl p-4 animate-fade-in">

            <BadgeAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />

            <p className="text-[12px] text-slate-200 leading-relaxed">

              <strong className="text-amber-400">고객님은 고소득자에 해당하여</strong> 국민연금 납부액과 수령액이 상한선(기준소득 617만 원)에 걸려 있습니다.

              소득 대비 연금 수령액 비율(소득대체율)이 일반인보다 훨씬 낮으므로,{' '}

              <strong className="text-amber-300">반드시 개인 연금으로 소득 공백을 메워야 합니다.</strong>

            </p>

          </div>

        )}



        {/* ── 세금/건보료 섹션 (Plus) ── */}

        {features.taxDetailSection && (healthInsuranceTriggered || totalTaxBurden > 0) && (

          <div className="rounded-2xl border border-red-100 bg-red-50 overflow-hidden">

            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-red-100">

              <Flame size={15} className="text-red-500" />

              <p className="text-sm font-bold text-red-700">세금·건보료로 사라지는 돈</p>

            </div>

            <div className="px-4 py-4 space-y-3">

              <p className="text-[12px] text-red-800 leading-relaxed">

                고객님이 준비하신 과세형 자산은 은퇴 후 평생 동안 약{' '}

                <strong className="text-red-600 text-[13px]">{formatKRW(totalTaxBurden)}</strong>의

                건보료와 세금을 국가에 납부하게 됩니다.

              </p>



              {taxFreeYearsGained > 0 && (

                <div className="bg-white rounded-xl p-3 border border-red-100">

                  <div className="flex items-start gap-2">

                    <ShieldAlert size={14} className="text-emerald-600 shrink-0 mt-0.5" />

                    <p className="text-[11px] text-slate-700 leading-relaxed">

                      전액 <strong className="text-emerald-700">비과세(보험) 계좌</strong>로 준비했다면,

                      자산 고갈 시점을{' '}

                      <strong className="text-emerald-600 text-[13px]">{taxFreeYearsGained}년</strong> 더 늦출 수 있었습니다.

                      아래 그래프의 <strong className="text-emerald-600">초록 선</strong>이 그 시뮬레이션입니다.

                    </p>

                  </div>

                </div>

              )}



              {/* 세전 vs 세후 연금 비교 바 */}

              {healthInsuranceTriggered && (

                <div>

                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">

                    <span>세전 연금</span>

                    <span>세후 실수령</span>

                  </div>

                  <div className="relative h-3 rounded-full bg-red-100 overflow-hidden">

                    <div

                      className="absolute h-full rounded-full bg-emerald-400 transition-all duration-500"

                      style={{ width: `${Math.min(100, (pensionNetAtRetirement / pensionAtRetirement) * 100)}%` }}

                    />

                  </div>

                  <div className="flex justify-between text-[10px] mt-1">

                    <span className="text-emerald-600 font-semibold">{formatKRW(pensionNetAtRetirement, true)} 실수령</span>

                    <span className="text-red-400 font-semibold">

                      -{formatKRW(pensionAtRetirement - pensionNetAtRetirement, true)} 차감

                    </span>

                  </div>

                </div>

              )}

            </div>

          </div>

        )}



        {/* ── 수익률 시나리오 3종 비교 ── */}

        <div className="relative rounded-2xl border border-navy-100 bg-white overflow-hidden shadow-sm">

          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-navy-100">

            <TrendingUp size={15} className="text-blue-600" />

            <p className="text-sm font-bold text-navy-900">수익률 시나리오 3종 비교</p>

          </div>

          <div className={`px-4 py-4 ${!features.scenarioCompare3 ? 'blur-sm pointer-events-none select-none' : ''}`}>

            <p className="text-[11px] text-navy-500 mb-3">증권 수익률 ±2%p 변동 시 은퇴 자산·고갈 시점 비교</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              {([
                {
                  key: 'conservative',
                  label: '보수적',
                  sub: `수익률 ${Math.max(1, stockRateBase - 2).toFixed(1)}%`,
                  border: 'border-amber-300',
                  badge: null,
                  data: scenarioResults.conservative,
                },
                {
                  key: 'current',
                  label: '현재',
                  sub: `수익률 ${stockRateBase.toFixed(1)}%`,
                  border: 'border-blue-400',
                  badge: '현재 설정',
                  data: scenarioResults.current,
                },
                {
                  key: 'optimistic',
                  label: '낙관적',
                  sub: `수익률 ${(stockRateBase + 2).toFixed(1)}%`,
                  border: 'border-emerald-400',
                  badge: null,
                  data: scenarioResults.optimistic,
                },
              ] as const).map(({ key, label, sub, border, badge, data }) => (

                <div key={key} className={`rounded-xl border-2 ${border} bg-slate-50 p-3 flex flex-col gap-2`}>

                  <div className="flex items-center justify-between gap-1">

                    <div>

                      <p className="text-xs font-bold text-navy-900">{label}</p>

                      <p className="text-[10px] text-navy-400">{sub}</p>

                    </div>

                    {badge && (

                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">{badge}</span>

                    )}

                  </div>

                  <div className="space-y-1.5 text-[11px]">

                    <div className="flex justify-between gap-2">

                      <span className="text-navy-500">은퇴 자산</span>

                      <span className="font-bold text-navy-900">{formatKRW(data.retirementBalance, true)}</span>

                    </div>

                    <div className="flex justify-between gap-2">

                      <span className="text-navy-500">자산 소진</span>

                      <span className="font-bold text-navy-900">{data.dignityEndAge ?? '100세+'}</span>

                    </div>

                    <div className="flex justify-between gap-2">

                      <span className="text-navy-500">100세 추가저축</span>

                      <span className="font-bold text-navy-900">

                        {data.monthlySavingsNeededFor100 <= 0

                          ? '충분'

                          : `${formatKRW(data.monthlySavingsNeededFor100, true)}/월`}

                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

          {!features.scenarioCompare3 && (

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-2xl">

              <p className="text-sm font-bold text-navy-900">Plus에서 확인하세요</p>

              <p className="text-[11px] text-navy-500 mt-1">수익률 시나리오 비교는 Pro Plus 전용입니다</p>

            </div>

          )}

        </div>



        {features.breakEvenAnalysis && (

          <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">

            <div className="flex items-center gap-2 mb-3">

              <CalendarDays size={15} className="text-indigo-600" />

              <p className="text-sm font-bold text-navy-900">연금 수급 손익분기 분석</p>

            </div>

            <div className="space-y-2 text-[12px] text-navy-700 leading-relaxed">

              <p>

                선택하신 수급 개시 연령 기준 조정:{' '}

                <strong className="text-indigo-700">{formatPensionAdjustment(pensionAdjustmentRate)}</strong>

              </p>

              <p>

                65세 기준 대비 손익분기:{' '}

                <strong className="text-indigo-700">약 {pensionBreakevenAge}세</strong>

              </p>

              <p>

                65세 수령 대비 100세까지 총 수령액 차이:{' '}

                <strong className={pensionTotalDiffVs65 >= 0 ? 'text-emerald-700' : 'text-red-600'}>

                  {pensionTotalDiffVs65 >= 0 ? '+' : ''}{formatKRW(pensionTotalDiffVs65, true)}

                </strong>

              </p>

            </div>

          </div>

        )}



        {features.taxSavingsChart && (() => {

          const yearBarScale = 5000000;

          const bars = [

            { label: 'ISA 절세액', value: isaTaxSaved, display: formatKRW(isaTaxSaved, true), color: 'bg-emerald-500' },

            { label: '퇴직연금 절세 효과', value: pension401kTotalTax, display: formatKRW(pension401kTotalTax, true), color: 'bg-indigo-500' },

            { label: '비과세 연장', value: taxFreeYearsGained * yearBarScale, display: `${taxFreeYearsGained}년`, color: 'bg-amber-500' },

          ];

          const maxVal = Math.max(...bars.map(b => b.value), 1);

          return (

            <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">

              <div className="flex items-center gap-2 mb-4">

                <Shield size={15} className="text-emerald-600" />

                <p className="text-sm font-bold text-navy-900">절세·세금 효과 비교</p>

              </div>

              <div className="space-y-4">

                {bars.map(bar => (

                  <div key={bar.label}>

                    <div className="flex justify-between items-baseline mb-1.5">

                      <span className="text-[11px] font-medium text-navy-600">{bar.label}</span>

                      <span className="text-[12px] font-bold text-navy-900">{bar.display}</span>

                    </div>

                    <div className="h-2.5 rounded-full bg-navy-100 overflow-hidden">

                      <div

                        className={`h-full rounded-full ${bar.color} transition-all duration-500`}

                        style={{ width: `${Math.max(4, (bar.value / maxVal) * 100)}%` }}

                      />

                    </div>

                  </div>

                ))}

              </div>

            </div>

          );

        })()}



        {/* ── 실시간 자산 조정 패널 (Plus) ── */}

        <div className="pdf-exclude">
        {features.liveAdjustment ? (
        <LivePensionSlider

          inputs={liveInputs}

          annualFinancialTax={annualFinancialTaxAtRetirement}

          onChange={setLiveInputs}

        />
        ) : (
          <ProUpgradePrompt
            title="실시간 조정은 Pro Plus"
            description="상담 중 슬라이더로 연금·3버킷·수익률을 바꾸면 그래프가 즉시 반영됩니다. Basic은 입력 화면에서 값을 수정한 뒤 다시 진단해 주세요."
          />
        )}
        </div>

        {/* ── 고객 입력 자산현황 요약 (PDF 전용 포함) ── */}
        <div className="bg-white rounded-2xl p-5 border border-navy-100 shadow-sm">
          <p className="text-sm font-bold text-navy-900 mb-3">고객 입력 자산현황 요약</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-navy-50 rounded-xl p-3">
              <p className="text-[10px] text-navy-400 font-medium">현재 나이 · 은퇴 희망 나이</p>
              <p className="text-[13px] font-bold text-navy-900 mt-0.5">{inputs.currentAge}세 → {inputs.retirementAge}세</p>
            </div>
            <div className="bg-navy-50 rounded-xl p-3">
              <p className="text-[10px] text-navy-400 font-medium">은퇴 후 월 생활비 (현재가치)</p>
              <p className="text-[13px] font-bold text-navy-900 mt-0.5">{formatKRW(inputs.monthlyExpense, true)}</p>
            </div>
          </div>

          <p className="text-[11px] font-bold text-navy-600 mb-2">현재 보유자산</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-[12px]">
            <div className="flex justify-between"><span className="text-navy-500">은행/CMA</span><span className="font-semibold text-navy-800">{formatKRW(inputs.savingsBank ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">증권/ETF</span><span className="font-semibold text-navy-800">{formatKRW(inputs.savingsStock ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">보험 해지환급금</span><span className="font-semibold text-navy-800">{formatKRW(inputs.savingsInsurance ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">IRP·연금저축</span><span className="font-semibold text-navy-800">{formatKRW(inputs.savingsPension401k ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">ISA</span><span className="font-semibold text-navy-800">{formatKRW(inputs.savingsIsa ?? 0, true)}</span></div>
            <div className="flex justify-between border-t border-navy-100 pt-1.5 mt-0.5"><span className="font-bold text-navy-700">합계</span><span className="font-bold text-navy-900">
              {formatKRW((inputs.savingsBank ?? 0) + (inputs.savingsStock ?? 0) + (inputs.savingsInsurance ?? 0) + (inputs.savingsPension401k ?? 0) + (inputs.savingsIsa ?? 0), true)}
            </span></div>
          </div>

          <p className="text-[11px] font-bold text-navy-600 mb-2">월 저축·납입액</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
            <div className="flex justify-between"><span className="text-navy-500">은행/CMA</span><span className="font-semibold text-navy-800">{formatKRW(inputs.monthlyBank ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">증권/ETF</span><span className="font-semibold text-navy-800">{formatKRW(inputs.monthlyStock ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">보험/비과세 연금</span><span className="font-semibold text-navy-800">{formatKRW(inputs.monthlyInsurance ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">IRP</span><span className="font-semibold text-navy-800">{formatKRW(inputs.monthlyPension401k ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">연금저축</span><span className="font-semibold text-navy-800">{formatKRW(inputs.monthlyPensionSavings ?? 0, true)}</span></div>
            <div className="flex justify-between"><span className="text-navy-500">ISA</span><span className="font-semibold text-navy-800">{formatKRW(inputs.isaMonthly ?? 0, true)}</span></div>
            <div className="flex justify-between border-t border-navy-100 pt-1.5 mt-0.5 col-span-2"><span className="font-bold text-navy-700">합계</span><span className="font-bold text-navy-900">
              {formatKRW((inputs.monthlyBank ?? 0) + (inputs.monthlyStock ?? 0) + (inputs.monthlyInsurance ?? 0) + (inputs.monthlyPension401k ?? 0) + (inputs.monthlyPensionSavings ?? 0) + (inputs.isaMonthly ?? 0), true)}
            </span></div>
          </div>
        </div>

        {/* ── 자산 축적~소진 통합 차트 ── */}

        <div className="bg-white rounded-2xl p-5 border border-navy-100 shadow-sm">

          <div className="mb-1">

            <p className="text-[11px] text-navy-400 font-medium">현재 나이 ~ 100세 전체 자산 흐름</p>

            <p className="text-sm font-bold text-navy-900">축적기 → 인출기 통합 분석 그래프</p>

          </div>

          {/* 은퇴 피크 실질가치 안내 */}

          {retirementBalance > 0 && (() => {

            const yearsToRet = retirementAge - inputs.currentAge;

            const realVal = retirementBalance * Math.pow(1 / (1 + 0.03), yearsToRet);

            const pct = Math.round((realVal / retirementBalance) * 100);

            return (

              <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">

                <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />

                <p className="text-[10px] text-amber-800 leading-relaxed">

                  은퇴 시점 명목 자산 <strong>{formatKRW(retirementBalance, true)}</strong>의

                  현재 구매력은 약 <strong className="text-amber-600">{formatKRW(realVal, true)} ({pct}%)</strong>입니다.

                  {' '}물가상승률(연 3%) 적용 시 명목 자산과 실질 가치의 차이가 갈수록 커집니다.

                </p>

              </div>

            );

          })()}

          {healthInsuranceTriggered && (

            <p className="text-[10px] text-red-400 font-medium mb-3">

              음영 영역 = 세금·건보료로 사라지는 자산 차이

            </p>

          )}



          <div className={`w-full overflow-x-auto overscroll-x-contain touch-pan-x ${compactChart ? 'min-w-0' : ''}`}>
          <div style={compactChart ? { minWidth: 300 } : undefined}>
          <ResponsiveContainer width="100%" height={compactChart ? 320 : 280}>

            <AreaChart data={graphData} margin={compactChart ? { top: 8, right: 4, left: 0, bottom: 4 } : { top: 30, right: 8, left: 0, bottom: 0 }}>

              <defs>

                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">

                  <stop offset="5%" stopColor={RED} stopOpacity={0.28} />

                  <stop offset="95%" stopColor={RED} stopOpacity={0.03} />

                </linearGradient>

                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">

                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.18} />

                  <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />

                </linearGradient>

                <linearGradient id="insGrad" x1="0" y1="0" x2="0" y2="1">

                  <stop offset="5%" stopColor={EMERALD} stopOpacity={0.22} />

                  <stop offset="95%" stopColor={EMERALD} stopOpacity={0.03} />

                </linearGradient>

                <linearGradient id="annuityGrad" x1="0" y1="0" x2="0" y2="1">

                  <stop offset="5%" stopColor="#fdc017" stopOpacity={0.35} />

                  <stop offset="95%" stopColor="#fdc017" stopOpacity={0.05} />

                </linearGradient>

                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">

                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />

                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />

                </linearGradient>

              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

              <XAxis dataKey="age" tick={{ fontSize: compactChart ? 9 : 10, fill: SLATE }} tickLine={false} axisLine={false}

                tickFormatter={(v) => `${v}세`} interval={compactChart ? 12 : 5} domain={[inputs.currentAge, 100]} minTickGap={compactChart ? 32 : 14} />

              <YAxis tick={{ fontSize: compactChart ? 9 : 10, fill: SLATE }} tickLine={false} axisLine={false}

                tickFormatter={formatAxis} width={compactChart ? 46 : 42} />

              <Tooltip content={<CustomTooltip />} />

              {!compactChart && <Legend {...CHART_LEGEND_PROPS} />}



              {/* 축적기 배경 강조 */}

              <ReferenceArea

                x1={inputs.currentAge} x2={retirementAge}

                fill="#f0fdf4" fillOpacity={0.6}

              />



              {/* 시나리오2: 절세계좌만 */}

              {!compactChart && (
                <Area type="monotone" dataKey="절세계좌만"
                  stroke={GOLD} strokeWidth={1.5} strokeDasharray="5 3"
                  fill="url(#grossGrad)" dot={false} name="절세계좌만 (보험 제외)" connectNulls />
              )}

              {!compactChart && (
                <Area type="monotone" dataKey="은행만"
                  stroke={EMERALD} strokeWidth={1.5} strokeDasharray="4 2"
                  fill="url(#insGrad)" dot={false} name="은행 예금만" connectNulls />
              )}



              {/* 현재 혼합 예상 자산 (명목) */}

              <Area type="monotone" dataKey="잔고"

                stroke={RED} strokeWidth={2.5}

                fill="url(#balanceGrad)" dot={false}

                activeDot={{ r: 4, fill: RED }} name="명목 자산 (현재 혼합)" connectNulls />



              {/* 실질 가치 (물가 할인 후 현재 구매력) */}
              <Area type="monotone" dataKey="실질가치"
                stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 2"
                fill="url(#realGrad)" dot={false} name="실질 가치 (현재 구매력)" connectNulls />

              {depletionAge && (
                <ReferenceLine x={depletionAge} stroke={RED} strokeDasharray="4 3" strokeWidth={2} />
              )}
              {features.taxScenarioCompare && !compactChart && depletionAgeGross && depletionAgeGross !== depletionAge && (
                <ReferenceLine x={depletionAgeGross} stroke={GOLD} strokeDasharray="3 2" strokeWidth={1.5} />
              )}
              {features.taxScenarioCompare && !compactChart && dignityEndAgeInsOnly && dignityEndAgeInsOnly !== depletionAge && (
                <ReferenceLine x={dignityEndAgeInsOnly} stroke={EMERALD} strokeDasharray="3 2" strokeWidth={1.5} />
              )}
              <ReferenceLine x={retirementAge} stroke={SLATE} strokeDasharray="3 3" strokeWidth={1} />
              {/* 자산 고갈 후 종신연금 유지 구간 라벨 */}
              {depletionAge && inputs.monthlyInsurance > 0 && (
                <ReferenceLine x={depletionAge + 1} stroke="#fdc017" strokeDasharray="3 2" strokeWidth={0} />
              )}
              {/* 80세 노후 간병기 리스크 구간 */}
              <ReferenceLine x={80} stroke="#dc2626" strokeDasharray="2 2" strokeWidth={1.5} />
              {/* 보험 납입 종료 시점 */}
              {!compactChart && insurancePaymentEndAge < retirementAge && inputs.monthlyInsurance > 0 && (
                <ReferenceLine x={insurancePaymentEndAge} stroke={GOLD} strokeDasharray="2 3" strokeWidth={1.5} />
              )}
            </AreaChart>
          </ResponsiveContainer>
          </div>
          </div>

          {compactChart && (
            <div className="mt-2 rounded-xl border border-navy-100 bg-navy-50/80 px-3 py-2.5 text-[10px] leading-snug text-navy-800 space-y-1">
              <p className="font-bold text-navy-900">그래프 세로선 안내</p>
              <ul className="list-none space-y-1">
                <li><span className="inline-block w-1.5 h-3 rounded-sm bg-slate-500 mr-1.5 align-middle" /> 회색 점선: {retirementAge}세 은퇴</li>
                {depletionAge != null && (
                  <li><span className="inline-block w-1.5 h-3 rounded-sm bg-red-500 mr-1.5 align-middle" /> 빨간 세로선: 약 {depletionAge}세 자산 고갈 시점</li>
                )}
                {inputs.monthlyInsurance > 0 && depletionAge != null && (
                  <li><span className="inline-block w-1.5 h-3 rounded-sm bg-amber-400 mr-1.5 align-middle" /> 금색 표시: 고갈 이후에도 종신연금 흐름 (위 노란 안내 카드 참고)</li>
                )}
              </ul>
            </div>
          )}

          {/* 범례 카드 */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center shadow-sm">
              <div className="mx-auto mb-1.5 h-1 w-6 rounded bg-red-500" />
              <p className="text-[12px] font-bold text-red-700">명목 자산</p>
              <p className="mt-0.5 text-[11px] font-medium text-red-600">원금+이자 합계</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100">
              <div className="w-5 h-0.5 bg-orange-400 mx-auto mb-1.5 rounded" style={{borderStyle:'dashed'}} />
              <p className="text-[12px] font-bold text-orange-700">실질 가치</p>
              <p className="text-[11px] text-orange-400 mt-0.5">현재 구매력 기준</p>
            </div>
            <div className="rounded-xl p-2.5 text-center border-2 border-gold-400" style={{background:'#fffbeb'}}>
              <div className="w-5 h-0.5 mx-auto mb-1.5 rounded" style={{background:'#fdc017'}} />
              <p className="text-[12px] font-bold" style={{color:'#a36203'}}>종신연금 수령액</p>
              <p className="text-[11px] mt-0.5" style={{color:'#b37a10'}}>자산 고갈 후에도 평생 유지</p>
            </div>
            {!compactChart && (
              <div className="bg-gold-50 rounded-xl p-2.5 text-center border border-gold-200">
                <div className="w-5 h-0.5 bg-gold-500 mx-auto mb-1.5 rounded" style={{borderStyle:'dashed'}} />
                <p className="text-[12px] font-bold text-gold-700">절세계좌만 (보험 제외)</p>
                <p className="text-[11px] text-gold-600 mt-0.5">ISA·IRP·증권만 활용 시</p>
              </div>
            )}
            {!compactChart && (
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                <div className="w-5 h-0.5 bg-emerald-500 mx-auto mb-1.5 rounded" style={{borderStyle:'dashed'}} />
                <p className="text-[12px] font-bold text-emerald-700">은행 예금만</p>
                <p className="text-[11px] text-emerald-500 mt-0.5">예·적금만 준비했을 때</p>
              </div>
            )}
          </div>

          {!features.taxScenarioCompare && (
            <div className="mt-3">
              <ProUpgradePrompt
                compact
                title="과세 vs 비과세 시나리오 비교는 Plus"
                description="전액 과세·전액 비과세 그래프로 세금·건보료 영향을 한눈에 보여주는 기능입니다."
              />
            </div>
          )}

          {/* 종신연금 강조 인사이트 */}
          {inputs.monthlyInsurance > 0 && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl p-3 border-2 border-gold-300" style={{background:'linear-gradient(135deg,#fffbeb,#fef3c7)'}}>
              <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{background:'#fdc017'}}>
                <span className="text-white text-[9px] font-extrabold">∞</span>
              </div>
              <div>
                <p className="text-[11px] font-bold mb-0.5" style={{color:'#92400e'}}>종신연금: 자산이 0이 되어도 끊기지 않습니다</p>
                <p className="text-[10px] leading-relaxed" style={{color:'#a36203'}}>
                  보험 주머니는 일반 금융자산과 달리 <strong>가입자 사망 시까지</strong> 연금이 지급됩니다.
                  위 금색 선이 바로 그 구간입니다. 은행·증권 자산이 고갈된 후에도{' '}
                  <strong>월 {Math.round(insAnnuityMonthly / 10000).toLocaleString()}만 원</strong> 수준의 수령이 계속됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 보험 납입 종료 후 복리 증식 인사이트 */}
          {insurancePaymentEndAge < retirementAge && inputs.monthlyInsurance > 0 && (
            <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="shrink-0 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center mt-0.5">
                <span className="text-white text-[9px] font-extrabold">★</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-800 mb-0.5">납입 종료 후 자동 복리 증식 구간</p>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  <strong>{insurancePaymentEndAge}세</strong>에 보험 납입이 끝난 후, 은퇴까지{' '}
                  <strong>{retirementAge - insurancePaymentEndAge}년간</strong> 추가 지출 없이{' '}
                  <strong>{inputs.insuranceRate?.toFixed(1) ?? '3.5'}%</strong>로 스스로 불어납니다.
                  현재의 집중 투자가 미래의 강력한 복리 효과를 만듭니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 월별 수입·지출 비교 차트 (은퇴 이후) ── */}
        <div className="bg-white rounded-2xl p-5 border border-navy-100 shadow-sm">
          <p className="text-[11px] text-navy-400 font-medium mb-1">은퇴 후 월별 수입·지출 비교</p>
          <p className="text-sm font-bold text-navy-900 mb-1">국민연금 · 보험연금 vs 생활비</p>
          <p className="text-[10px] text-teal-600 font-medium mb-4">
            {activeEndAge}세 이후 생활비 75% 하향{medicalCostEnabled ? ' · 80세+ 의료비 추가' : ''}
          </p>

          {/* 수령액 요약 카드 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-[9px] text-emerald-500 font-semibold mb-0.5">국민연금 (은퇴 시, 세후)</p>
              <p className="text-sm font-extrabold text-emerald-700">{formatKRW(pensionNetAtRetirement)}/월</p>
              <p className="text-[9px] text-emerald-400 mt-0.5">매년 3% 인상 적용</p>
            </div>
            {inputs.monthlyInsurance > 0 && (
              <div className="border-2 border-gold-300 rounded-xl p-3" style={{background:'#fffbeb'}}>
                <p className="text-[9px] font-semibold mb-0.5" style={{color:'#b45309'}}>보험 종신연금 (월 수령)</p>
                <p className="text-sm font-extrabold" style={{color:'#92400e'}}>{formatKRW(insAnnuityMonthly)}/월</p>
                <p className="text-[9px] mt-0.5" style={{color:'#d97706'}}>사망 시까지 평생 유지</p>
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto overscroll-x-contain touch-pan-x">
          <div style={compactChart ? { minWidth: 300 } : undefined}>
          <ResponsiveContainer width="100%" height={compactChart ? 280 : 240}>
            <AreaChart data={incomeExpenseData} margin={compactChart ? { top: 6, right: 4, left: 0, bottom: 4 } : { top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="livingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="penGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMERALD} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="divRealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="insAnnuityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fdc017" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#fdc017" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="age" tick={{ fontSize: compactChart ? 9 : 10, fill: SLATE }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${v}세`} interval={compactChart ? 10 : 4} minTickGap={compactChart ? 28 : 12} />
              <YAxis tick={{ fontSize: compactChart ? 9 : 10, fill: SLATE }} tickLine={false} axisLine={false}
                tickFormatter={formatAxis} width={compactChart ? 46 : 42} />
              <Tooltip content={<CustomTooltip />} />
              {!compactChart && <Legend {...CHART_LEGEND_PROPS} />}

              <ReferenceLine x={activeEndAge} stroke={SLATE} strokeDasharray="3 2" strokeWidth={1.5} />
              {medicalCostEnabled && (
                <ReferenceLine x={80} stroke={RED} strokeDasharray="3 2" strokeWidth={1.5} />
              )}

              {/* 지출 */}
              <Area type="monotone" dataKey="생활비" stroke={GOLD} strokeWidth={2}
                fill="url(#livingGrad)" dot={false} name="총 생활비 (물가반영)" />
              {/* 수입: 국민연금 */}
              <Area type="monotone" dataKey="국민연금" stroke={EMERALD} strokeWidth={2}
                fill="url(#penGrad)" dot={false} name="국민연금 (세후)" />
              {/* 수입: 배당 소득 명목 */}
              <Area type="monotone" dataKey="배당소득" stroke={BLUE} strokeWidth={2}
                fill="url(#divGrad)" dot={false} name="배당소득 (명목)" />
              {/* 수입: 배당 소득 실질 - 구매력 하락 시각화 */}
              {!compactChart && (
                <Area type="monotone" dataKey="배당실질" stroke="#f97316" strokeWidth={1.5}
                  strokeDasharray="4 2" fill="url(#divRealGrad)" dot={false} name="배당소득 (실질 구매력)" />
              )}
              {/* 수입: 보험 종신연금 - 하단 지지선 골드 강조 */}
              {inputs.monthlyInsurance > 0 && (
                <Area type="monotone" dataKey="보험연금" stroke="#fdc017" strokeWidth={3}
                  fill="url(#insAnnuityGrad)" dot={false} name="보험 종신연금 (평생)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
          </div>
          </div>

          {compactChart && (
            <div className="mt-2 rounded-xl border border-navy-100 bg-navy-50/80 px-3 py-2.5 text-[10px] leading-snug text-navy-800 space-y-1">
              <p className="font-bold text-navy-900">수입·지출 차트 세로선</p>
              <ul className="list-none space-y-1">
                <li><span className="inline-block w-1.5 h-3 rounded-sm bg-slate-500 mr-1.5 align-middle" /> 회색 점선: {activeEndAge}세 활동 종료 전후</li>
                {medicalCostEnabled && (
                  <li><span className="inline-block w-1.5 h-3 rounded-sm bg-red-500 mr-1.5 align-middle" /> 빨간 점선: 80세 의료비 반영 구간</li>
                )}
              </ul>
            </div>
          )}

          {/* 배당 인컴 모델 가정치 인사이트 */}
          <div className="mt-4 space-y-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-[11px] text-blue-800 leading-relaxed">
                <strong>배당 인컴 전략:</strong> 은퇴 후 증권 자산은 <strong>연 5%(배당 3% + 자본성장 2%)</strong>
                배당 자산으로 전환 운용됩니다. 매월 배당금을 우선 수령하고, 부족분만 원금 매도합니다.
                잉여 배당금은 자동 재투자됩니다.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>물가 리스크:</strong> 파란 실선(배당 명목)과 주황 점선(배당 실질)의 <strong>간격이 클수록</strong>
                배당금의 실제 구매력이 낮아집니다. 노후 후반부에는{' '}
                <strong className="text-amber-700">골드 라인(종신연금)</strong>이 수입의 하단을 지지합니다.
              </p>
            </div>
            {activeEndAge && (
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  <strong>{activeEndAge}세 이후</strong> 활동량 감소로 생활비가 줄지만, 의료비가 증가합니다.
                  소득 크기보다 <strong>'안정적 현금흐름'</strong>과 <strong>'비과세 혜택'</strong>이 중요합니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 연도별 상세 데이터 (Plus) ── */}
        {features.yearByYearTable ? (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Table2 size={16} className="text-navy-600" />
              <div>
                <p className="text-sm font-bold text-navy-900">연도별 상세 데이터</p>
                <p className="text-[11px] text-navy-400">은퇴~100세 · 생활비·의료비·연금·예상 자산</p>
              </div>
            </div>
            <span className={`text-navy-400 text-sm transition-transform ${showTable ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showTable && (
            <div className="overflow-x-auto border-t border-navy-100">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-navy-900">
                    <th className="px-3 py-2.5 text-left font-bold text-gold-400">나이</th>
                    <th className="px-3 py-2.5 text-right font-bold text-navy-200">생활비</th>
                    {medicalCostEnabled && (
                      <th className="px-3 py-2.5 text-right font-bold text-rose-300">의료비</th>
                    )}
                    <th className="px-3 py-2.5 text-right font-bold text-navy-200">세전 연금</th>
                    {healthInsuranceTriggered && (
                      <th className="px-3 py-2.5 text-right font-bold text-red-300">건보+세금</th>
                    )}
                    <th className="px-3 py-2.5 text-right font-bold text-gold-400">예상 자산</th>
                  </tr>
                </thead>
                <tbody>
                  {yearRows.filter((row) => row.age >= retirementAge).map((row) => {
                    const isDanger = row.balance <= 0 && row.age >= retirementAge;
                    const isWarn = !isDanger && row.balance < row.requiredExpense * 24 && row.age >= retirementAge;
                    const isCareRisk = row.age >= 80;
                    return (
                      <tr key={row.age} className={`border-t border-navy-50 ${isDanger ? 'bg-red-50' : isWarn ? 'bg-amber-50' : isCareRisk ? 'bg-orange-50/40' : ''}`}>
                        <td className={`px-3 py-2 font-semibold ${isDanger ? 'text-red-600' : isCareRisk ? 'text-orange-700' : 'text-navy-700'}`}>
                          {row.age}세{isDanger ? ' ⚠' : ''}
                        </td>
                        <td className="px-3 py-2 text-right text-navy-600">{formatKRW(row.livingExpense, true)}</td>
                        {medicalCostEnabled && (
                          <td className="px-3 py-2 text-right text-rose-500 font-medium">
                            {row.medicalExpense > 0 ? formatKRW(row.medicalExpense, true) : '-'}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">{formatKRW(row.pension, true)}</td>
                        {healthInsuranceTriggered && (
                          <td className="px-3 py-2 text-right text-red-500 font-medium">
                            -{formatKRW(row.healthInsurance + row.pensionTax, true)}
                          </td>
                        )}
                        <td className={`px-3 py-2 text-right font-bold ${isDanger ? 'text-red-500' : 'text-navy-900'}`}>
                          {isDanger ? '고갈' : formatKRW(row.balance, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        ) : (
          <ProUpgradePrompt
            title="연도별 상세 테이블은 Pro Plus"
            description="은퇴~100세 현금흐름을 연도별로 확인하고, 고객 상담·리포트에 활용하려면 Plus가 필요합니다."
          />
        )}

        {/* ── 부족액 콜아웃 ── */}
        {!isSafe && (
          <div className="flex gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <TrendingDown size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-800 leading-relaxed">
              현재 구조에서는 <strong>90세까지 품격을 지키기 위해{' '}
              <span className="text-red-600 underline decoration-dotted">{formatKRW(extraNeeded)}</span>이 더 필요합니다.</strong>
            </p>
          </div>
        )}

        {/* ── 해결책 박스 (Plus) ── */}
        {features.solutionInsightBox && (
        <div
          className="rounded-3xl text-white p-6 shadow-xl border border-gold-600/30"
          style={{ background: 'linear-gradient(135deg, #0f2057 0%, #162d6b 100%)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-gold-400" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold-400">해결책</span>
          </div>
          <p className="text-[15px] font-extrabold leading-snug mb-3 text-white">
            비과세 계좌를 활용해 세금과 건보료를 방어하고, 고갈 시점을 15년 연장하는 플랜을 받아보세요.
          </p>
          <div className="bg-white/10 rounded-xl p-4 space-y-2.5">
            {[
              '이자소득세 15.4% 완전 절세 (현행 세법 기준)',
              '종합소득세 합산 과세 회피',
              '지역가입자 건강보험료 폭탄 방어',
              '세후 실령액 최대 30% 증가 효과',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0 mt-1.5" />
                <span className="text-[12px] leading-relaxed" style={{ color: '#f1f5f9' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── 100세 목표 섹션 ── */}
        <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-navy-900 to-navy-700 px-6 pt-6 pb-5">
            <span className="inline-block text-[10px] font-bold tracking-[0.15em] text-gold-300 uppercase bg-navy-800/60 px-3 py-1 rounded-full mb-3">
              해결 방안
            </span>
            <h2 className="text-[18px] font-extrabold text-white leading-snug">
              100세까지 품격을 지키려면<br />
              <span className="text-gold-300">지금 무엇을 해야 할까요?</span>
            </h2>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="bg-navy-50 rounded-2xl p-4 border border-navy-100">
              <p className="text-[11px] text-navy-500 font-medium mb-2">단순 합산 기준 추가 저축 금액</p>
              {dignityEndAge !== null && dignityEndAge < 100 ? (
                <>
                  <p className="text-[13px] text-navy-700 leading-relaxed mb-1">
                    고객님의 노후를 <strong className="text-navy-900">100세까지 지키기 위해</strong>
                  </p>
                  {monthlySavingsNeededFor100 > 0 ? (
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl font-extrabold text-navy-800">
                        월 {Math.ceil(monthlySavingsNeededFor100 / 10000).toLocaleString()}만 원
                      </span>
                      <span className="text-sm text-navy-400">추가 저축 필요</span>
                    </div>
                  ) : (
                    <p className="text-[13px] text-navy-600 mt-1">추가 저축 금액을 계산 중입니다.</p>
                  )}
                  <p className="text-[10px] text-navy-400 mt-1.5">
                    현재 자산 배분 기준 · 은퇴 시점({inputs.retirementAge}세)까지 {Math.max(0, inputs.retirementAge - inputs.currentAge)}년 적립 기준
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 text-[10px] font-extrabold">✓</span>
                  </span>
                  <p className="text-sm font-bold text-emerald-600">
                    {dignityEndAge === null ? '100세까지 충분합니다' : '100세 이후까지 유지됩니다'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 bg-gold-50 border border-gold-200 rounded-2xl p-4">
              <Info size={15} className="text-gold-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gold-900 leading-relaxed">
                <strong>※ 주의:</strong> 위 금액은 단순 합산 기준입니다. 어떤 금융 상품(과세 vs 비과세)을 선택하느냐에 따라
                실제 필요 금액은 <strong>최대 30% 이상 줄어들 수 있습니다.</strong> 세금과 건보료를 고려한
                '최적의 포트폴리오'는 전문가와 상의하세요.
              </p>
            </div>

            {dignityEndAge !== null && dignityEndAge < 100 && (
              <button
                onClick={scrollToReportActions}
                className="w-full bg-gradient-to-r from-navy-800 to-navy-700 hover:from-navy-700 hover:to-navy-600 active:scale-[0.98] text-white font-bold text-[13px] rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-navy-900/30 border border-gold-600/30"
              >
                <span className="text-gold-400">▶</span>
                월 {Math.ceil(monthlySavingsNeededFor100 / 10000).toLocaleString()}만 원 추가 저축 —
                리포트 저장 · 고객 상담 자료로 활용
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── 리포트 저장 버튼 ── */}
        <div ref={reportActionsRef} className="pdf-exclude flex gap-2 scroll-mt-6">
          <button
            onClick={async () => {
              if (!features.unlimitedPrint && !canRunBasicPrint()) {
                window.alert('이번 달 Basic 리포트 저장 한도(5회)를 모두 사용했어요. Plus로 업그레이드하면 무제한입니다.');
                return;
              }
              if (!features.unlimitedPrint) recordBasicPrint();

              // 클릭과 같은 콜스택에서 미리 빈 탭을 열어둠 (모바일 브라우저의
              // "비동기 이후 액션은 사용자 제스처 아님" 차단을 우회하기 위함)
              const pendingWindow = window.open('', '_blank');

              const wasTableOpen = showTable;
              if (!wasTableOpen) setShowTable(true);
              // 표가 펼쳐지고 DOM에 반영될 시간을 확보
              await new Promise((r) => setTimeout(r, 350));

              setPdfDownloading(true);
              try {
                const { downloadResultPdf } = await import('../lib/generateResultPdf');
                const ok = await downloadResultPdf('pro-result-pdf-capture', '고객', pendingWindow);
                if (!ok) {
                  window.alert('PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                }
              } catch (err) {
                console.error('[PDF] 저장 중 오류:', err);
                pendingWindow?.close();
                window.alert('PDF 저장 중 문제가 발생했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.');
              } finally {
                setPdfDownloading(false);
                if (!wasTableOpen) setShowTable(false);
              }
            }}
            disabled={pdfDownloading}
            className="flex-1 bg-white border-2 border-navy-300 hover:border-navy-500 hover:bg-navy-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-navy-800 font-bold text-[13px] rounded-2xl py-4 flex items-center justify-center gap-2 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {pdfDownloading ? 'PDF 생성 중…' : 'PDF 저장'}
          </button>
        </div>

        {/* ── 치료비 리스크 분석 ── */}
        {result.medicalRisk && (
          <div className="rounded-2xl border border-navy-100 bg-white p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                <Shield size={16} className="text-rose-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">치료비 리스크</p>
                <p className="text-[14px] font-bold text-navy-900">평생 의료비 보장 분석</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">한국 60세 이후 발생확률</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '암 진단', pct: '37%', cost: '4,000만원', color: 'text-red-600' },
                  { label: '뇌혈관', pct: '19%', cost: '3,500만원', color: 'text-orange-600' },
                  { label: '심장질환', pct: '16%', cost: '3,000만원', color: 'text-amber-600' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-white p-2 text-center border border-slate-100">
                    <p className={`text-[13px] font-extrabold ${item.color}`}>{item.pct}</p>
                    <p className="text-[10px] font-semibold text-navy-700">{item.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{item.cost}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-[11px] font-semibold text-navy-700">80세 이후 월 의료비 추정</p>
                <p className="text-[10px] text-slate-400">건강보험공단 통계 기준</p>
              </div>
              <p className="text-[15px] font-extrabold text-rose-600">{formatKRW(result.medicalRisk.monthlyCostAfter80)}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-[11px] font-semibold text-navy-700">치매 요양비 (5년 기준)</p>
                <p className="text-[10px] text-slate-400">국민건강보험 2023</p>
              </div>
              <p className="text-[15px] font-extrabold text-rose-600">{formatKRW(result.medicalRisk.dementiaCost)}</p>
            </div>
            {(() => {
              const { coverageScore, uncoveredRisk, monthlyProtectionInsurance } = result.medicalRisk;
              const coverageColor = coverageScore >= 70 ? 'text-emerald-600' : coverageScore >= 40 ? 'text-amber-600' : 'text-red-600';
              const coverageBg = coverageScore >= 70 ? 'bg-emerald-50 border-emerald-200' : coverageScore >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
              return (
                <>
                  <div className={`rounded-xl border p-3 ${coverageBg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-bold text-navy-800">현재 보장 커버리지</p>
                      <p className={`text-[18px] font-extrabold ${coverageColor}`}>{coverageScore}점</p>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/80 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${coverageScore >= 70 ? 'bg-emerald-500' : coverageScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${coverageScore}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-[10px]">
                      <span className="text-slate-500">월 보장성 보험료: {formatKRW(monthlyProtectionInsurance)}</span>
                      <span className={`font-bold ${coverageColor}`}>{coverageScore >= 70 ? '양호' : coverageScore >= 40 ? '보완 필요' : '위험'}</span>
                    </div>
                  </div>
                  {uncoveredRisk > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12px] font-bold text-red-800">미보장 리스크 추정액</p>
                          <p className="text-[20px] font-extrabold text-red-600 mt-1">{formatKRW(uncoveredRisk)}</p>
                          <p className="text-[10px] text-red-500 mt-1">현재 보장 수준으로는 3대 질병 발생 시 이 금액이 본인 부담이 될 수 있습니다. 전문가 상담을 통해 보장 구조를 점검해 보세요.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ── 법적 면책 문구 (고정) ── */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-[10px] text-slate-300 leading-relaxed space-y-1">
            <span className="block"><strong className="text-gold-400">※ 운용 가정:</strong> 은퇴 후 증권 자산은 연 5%(배당 3% + 자본성장 2%) 수익률의 배당 자산으로 전환됨을 가정함. 배당 소득은 매월 우선 수령하며, 생활비 부족분만 원금을 매도하여 충당하고, 잉여분은 자동 재투자됨.</span>
            <span className="block mt-2"><strong className="text-slate-300">※ 면책:</strong> 본 시뮬레이션은 이해를 돕기 위한 예시이며, 실제 투자 결과 및 세법(비과세/건보료) 개정에 따라 수치는 달라질 수 있습니다. 반드시 전문가의 가입설계서를 확인하십시오.</span>
            <span className="block mt-2"><strong className="text-slate-300">※ 종신연금:</strong> 수령액은 선택하신 상품의 연금지급 형태(확정기간형·종신형·부부형 등)에 따라 달라질 수 있습니다. 본 시뮬레이션의 종신연금 수령액은 보험 적립금을 100세까지 균등 연금화한 참고값입니다.</span>
          </p>
        </div>

        {/* ── 전문가 푸터 ── */}
        <div className="bg-navy-900 rounded-2xl px-5 py-4 flex flex-col gap-1 border border-navy-700">

          <p className="text-[10px] text-navy-400 mt-0.5">본 시뮬레이터는 전문가용 상담 보조 도구입니다.</p>
        </div>

        {/* ── 제작자 서명 ── */}
        <div className="text-center py-2">
          <p className="text-[10px] text-slate-400 font-medium tracking-widest">Designed by 금융전문가 임재현</p>
        </div>

        </div>
        {/* ── /pro-result-pdf-capture ── */}

        <div className="h-8" />
      </div>
    </div>
  );
}
