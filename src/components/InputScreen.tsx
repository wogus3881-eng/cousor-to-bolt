import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  ChevronRight, ChevronDown, User, Briefcase, PiggyBank, TrendingUp,
  Coffee, BarChart2, CalendarDays, HeartPulse, Activity, HelpCircle,
  Landmark, Shield, AlertTriangle,
} from 'lucide-react';
import type { SimulatorInputs } from '../lib/calculator';
import { DEFAULT_BANK_RATE, DEFAULT_STOCK_RATE, DEFAULT_INS_RATE } from '../lib/calculator';

interface Props {
  onSimulate: (inputs: SimulatorInputs) => void;
  initialInputs?: SimulatorInputs;
}

const MAN = 10000;

// ── Tooltip ────────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button type="button"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onClick={() => setOpen(p => !p)}
        className="text-navy-300 hover:text-gold-400 transition-colors ml-1">
        <HelpCircle size={13} />
      </button>
      {open && (
        <span className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-navy-900 text-white text-[11px] leading-relaxed rounded-xl px-3 py-2.5 shadow-xl pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-900" />
        </span>
      )}
    </span>
  );
}

// ── DualInput: 슬라이더 + 숫자입력 양방향 연동 ────────────────────────────────
function DualInput({
  label, sublabel, icon, value, min, max, step, unit, display, parse,
  trackColor, onChange, decimalPlaces = 0,
  warningFn,
}: {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  display: (v: number) => string;
  parse: (s: string) => number;
  trackColor: string;
  onChange: (v: number) => void;
  decimalPlaces?: number;
  warningFn?: (v: number) => string | null;
}) {
  const [raw, setRaw] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const warning = warningFn ? warningFn(value) : null;

  function commitRaw(s: string) {
    const parsed = parse(s);
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className="flex items-center gap-2">
            <span className="text-navy-600">{icon}</span>
            <div>
              <p className="text-xs font-semibold text-navy-800">{label}</p>
              {sublabel && <p className="text-[10px] text-navy-400">{sublabel}</p>}
            </div>
          </div>
        )}
        {!icon && <p className="text-xs font-semibold text-navy-800">{label}</p>}

        {/* 숫자 입력 필드 */}
        <div className="flex items-baseline gap-1">
          {editing ? (
            <input
              ref={inputRef}
              autoFocus
              type="number"
              step={decimalPlaces > 0 ? Math.pow(0.1, decimalPlaces) : 1}
              className="text-right text-xl font-bold text-navy-900 w-28 border-b-2 border-gold-500 outline-none bg-transparent"
              value={raw}
              onChange={e => setRaw(e.target.value)}
              onBlur={e => commitRaw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
          ) : (
            <button
              className="text-right hover:text-gold-600 transition-colors"
              onClick={() => { setRaw(decimalPlaces > 0 ? value.toFixed(decimalPlaces) : display(value).replace(/[^0-9.]/g, '')); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
            >
              <span className="text-xl font-bold text-navy-900">{display(value)}</span>
            </button>
          )}
          <span className="text-sm text-navy-400 shrink-0">{unit}</span>
        </div>
      </div>

      {/* 슬라이더 */}
      <div className="relative h-1.5 mt-3">
        <div className="absolute inset-0 rounded-full bg-navy-100" />
        <div className={`absolute h-full rounded-full ${trackColor} transition-all`} style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" />
        <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${trackColor} border-2 border-white shadow-md pointer-events-none transition-all`}
          style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-navy-300">{display(min)}{unit}</span>
        <span className="text-[10px] text-navy-300">{display(max)}{unit}</span>
      </div>

      {/* 경고 */}
      {warning && (
        <div className="flex items-start gap-1.5 mt-2.5 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
          <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 leading-snug">{warning}</p>
        </div>
      )}
    </div>
  );
}

// ── InlineSlider with number input ────────────────────────────────────────────
function InlineField({
  label, value, min, max, step, display, parse, trackColor, thumbColor,
  onChange, decimalPlaces = 0, warningFn, tooltip,
}: {
  label: string; value: number; min: number; max: number; step: number;
  display: (v: number) => string; parse: (s: string) => number;
  trackColor: string; thumbColor: string; onChange: (v: number) => void;
  decimalPlaces?: number;
  warningFn?: (v: number) => string | null;
  tooltip?: string;
}) {
  const [raw, setRaw] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const warning = warningFn ? warningFn(value) : null;

  function commitRaw(s: string) {
    const parsed = parse(s);
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-navy-500 font-medium">{label}</span>
          {tooltip && <Tooltip text={tooltip} />}
        </div>
        <div className="flex items-baseline gap-1">
          {editing ? (
            <input
              ref={inputRef}
              autoFocus
              type="number"
              step={decimalPlaces > 0 ? Math.pow(0.1, decimalPlaces) : 1}
              className="text-right text-[12px] font-bold text-navy-900 w-20 border-b border-gold-500 outline-none bg-transparent"
              value={raw}
              onChange={e => setRaw(e.target.value)}
              onBlur={e => commitRaw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
          ) : (
            <button
              className="text-[12px] font-bold text-navy-800 hover:text-gold-600 transition-colors"
              onClick={() => {
                setRaw(decimalPlaces > 0 ? value.toFixed(decimalPlaces) : String(Math.round(value)));
                setEditing(true);
                setTimeout(() => inputRef.current?.select(), 0);
              }}
            >
              {display(value)}
            </button>
          )}
        </div>
      </div>
      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full bg-navy-100" />
        <div className={`absolute h-full rounded-full ${trackColor} transition-all`} style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" />
        <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${thumbColor} border-2 border-white shadow-md pointer-events-none`}
          style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-navy-300">{display(min)}</span>
        <span className="text-[9px] text-navy-300">{display(max)}</span>
      </div>
      {warning && (
        <div className="flex items-start gap-1.5 mt-2 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200">
          <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 leading-snug">{warning}</p>
        </div>
      )}
    </div>
  );
}

// ── PensionYearsCard ───────────────────────────────────────────────────────────
function PensionYearsCard({ value, onChange, isAutoSet }: { value: number; onChange: (v: number) => void; isAutoSet: boolean }) {
  const [raw, setRaw] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = ((value - 10) / (40 - 10)) * 100;
  const tier = value < 20
    ? { label: '소득대체율 12%', color: 'bg-red-100 text-red-600', track: 'bg-red-400' }
    : value < 30
    ? { label: '소득대체율 18%', color: 'bg-amber-100 text-amber-700', track: 'bg-amber-400' }
    : { label: '소득대체율 25%', color: 'bg-emerald-100 text-emerald-700', track: 'bg-emerald-500' };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-navy-600"><CalendarDays size={16} /></span>
          <div>
            <p className="text-xs font-semibold text-navy-800">국민연금 총 예상 가입 기간</p>
            <p className="text-[10px] text-navy-400">{isAutoSet ? '현재 나이~만 60세 자동 계산 · 직접 조정 가능' : '직접 입력'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-1">
            {editing ? (
              <input ref={inputRef} autoFocus type="number" min={10} max={40}
                className="text-right text-xl font-bold text-navy-900 w-16 border-b-2 border-gold-500 outline-none bg-transparent"
                value={raw}
                onChange={e => setRaw(e.target.value)}
                onBlur={e => { const p = parseInt(e.target.value); if (!isNaN(p)) onChange(Math.min(40, Math.max(10, p))); setEditing(false); }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              />
            ) : (
              <button className="text-xl font-bold text-navy-900 hover:text-gold-600 transition-colors"
                onClick={() => { setRaw(String(value)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}>
                {value}
              </button>
            )}
            <span className="text-sm text-navy-400">년</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.color}`}>{tier.label}</span>
        </div>
      </div>
      <div className="relative h-1.5 mt-3">
        <div className="absolute inset-0 rounded-full bg-navy-100" />
        <div className={`absolute h-full rounded-full ${tier.track} transition-all`} style={{ width: `${pct}%` }} />
        <input type="range" min={10} max={40} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" />
        <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${tier.track} border-2 border-white shadow-md pointer-events-none transition-all`}
          style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-navy-300">10년</span>
        <span className="text-[10px] text-navy-300">40년</span>
      </div>
      <div className="flex gap-1.5 mt-3">
        {[
          { range: '10~19년', label: '12%', color: 'border-red-300 text-red-500', active: value < 20 },
          { range: '20~29년', label: '18%', color: 'border-amber-300 text-amber-600', active: value >= 20 && value < 30 },
          { range: '30년+', label: '25%', color: 'border-emerald-300 text-emerald-600', active: value >= 30 },
        ].map(t => (
          <div key={t.range} className={`flex-1 rounded-xl border py-2 text-center transition-all ${t.active ? t.color + ' font-bold border-2' : 'border-navy-100 text-navy-200'}`}>
            <p className="text-[9px] font-medium">{t.range}</p>
            <p className={`text-[11px] font-extrabold ${t.active ? '' : 'text-navy-200'}`}>{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SalaryCard ─────────────────────────────────────────────────────────────────
function SalaryCard({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);
  const display = (v: number) => Math.floor(v / MAN).toLocaleString();

  function commit(s: string) {
    const p = parseFloat(s.replace(/,/g, ''));
    if (!isNaN(p) && p >= 0) { onChange(p * MAN); setRaw(display(p * MAN)); }
    else setRaw(display(value));
  }

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${focused ? 'border-gold-400 ring-2 ring-gold-100 shadow-md' : 'border-navy-100 hover:shadow-md'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-navy-600"><TrendingUp size={16} /></span>
          <div>
            <p className="text-xs font-semibold text-navy-800">현재 세전 연봉</p>
            <p className="text-[10px] text-navy-400">국민연금 산정 기준</p>
          </div>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mt-4">
        <input type="text" inputMode="numeric"
          className="flex-1 text-right text-2xl font-extrabold text-navy-900 outline-none bg-transparent min-w-0"
          placeholder="예: 5,000"
          value={focused ? raw : display(value)}
          onChange={e => setRaw(e.target.value)}
          onFocus={() => { setFocused(true); setRaw(display(value)); }}
          onBlur={() => { setFocused(false); commit(raw); }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
        <span className="text-sm text-navy-400 shrink-0">만 원</span>
      </div>
      <div className="h-px bg-gold-200 mt-2" />
    </div>
  );
}

// ── BucketCard ─────────────────────────────────────────────────────────────────
interface BucketTheme {
  label: string; sublabel: string; taxLabel: string; tooltip: string;
  icon: React.ReactNode;
  headerBg: string; headerText: string;
  trackAmount: string; thumbAmount: string;
  trackRate: string; thumbRate: string;
  badge: string; badgeColor: string;
}

const BANK_THEME: BucketTheme = {
  label: '은행 적립', sublabel: '예금·적금 등 원금 보장',
  taxLabel: '이자소득세 15.4% 과세 · 건보료 산정 포함',
  tooltip: '예금·적금 등 원금 보장 상품입니다. 이자 수익에 이자소득세(15.4%)가 부과됩니다. 금융소득 연 2,000만 원 초과 시 건보료 급등 및 피부양자 자격 박탈 위험이 있습니다.',
  icon: <Landmark size={16} />,
  headerBg: 'bg-navy-700', headerText: 'text-white',
  trackAmount: 'bg-navy-500', thumbAmount: 'bg-navy-700',
  trackRate: 'bg-navy-400', thumbRate: 'bg-navy-600',
  badge: '과세', badgeColor: 'bg-navy-200 text-navy-700',
};

const STOCK_THEME: BucketTheme = {
  label: '증권 투자', sublabel: '주식·ETF·펀드',
  taxLabel: '이자소득세 15.4% + 건보료 과세',
  tooltip: '주식·ETF·펀드 등 투자 상품입니다. 수익률이 높을수록 세금과 건보료 부담도 커집니다. 현행 세법 기준 이자소득세(15.4%)가 수익에 부과됩니다.',
  icon: <TrendingUp size={16} />,
  headerBg: 'bg-red-700', headerText: 'text-white',
  trackAmount: 'bg-red-500', thumbAmount: 'bg-red-700',
  trackRate: 'bg-red-400', thumbRate: 'bg-red-600',
  badge: '과세', badgeColor: 'bg-red-100 text-red-700',
};

const INS_THEME: BucketTheme = {
  label: '보험·비과세 연금', sublabel: '저축성 보험·연금저축',
  taxLabel: '현행 세법 기준 비과세 · 건보료 산정 제외',
  tooltip: '현행 세법 기준, 10년 이상 유지 저축성 보험은 수익이 비과세됩니다. 보험 수령액은 건강보험료 산정 소득에서도 제외되어 실질 수익률이 가장 높습니다.',
  icon: <Shield size={16} />,
  headerBg: 'bg-gold-600', headerText: 'text-white',
  trackAmount: 'bg-gold-500', thumbAmount: 'bg-gold-600',
  trackRate: 'bg-gold-400', thumbRate: 'bg-gold-500',
  badge: '비과세', badgeColor: 'bg-gold-100 text-gold-700',
};

function BucketCard({ theme, amount, rate, onAmountChange, onRateChange, paymentYears, onPaymentYearsChange }: {
  theme: BucketTheme; amount: number; rate: number;
  onAmountChange: (v: number) => void; onRateChange: (v: number) => void;
  paymentYears?: number; onPaymentYearsChange?: (v: number) => void;
}) {
  const showPaymentYears = paymentYears !== undefined && onPaymentYearsChange !== undefined;
  const isBank = theme === BANK_THEME;
  const DEPOSIT_PROTECTION_LIMIT = MAN * 10000; // 1억

  return (
    <div className="rounded-2xl overflow-hidden border border-navy-100 shadow-sm">
      <div className={`${theme.headerBg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={theme.headerText}>{theme.icon}</span>
          <div>
            <div className="flex items-center gap-1">
              <p className={`text-xs font-bold ${theme.headerText}`}>{theme.label}</p>
              <Tooltip text={theme.tooltip} />
            </div>
            <p className={`text-[10px] ${theme.headerText} opacity-75`}>{theme.sublabel}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badgeColor}`}>{theme.badge}</span>
      </div>

      <div className="bg-white px-4 py-4 flex flex-col gap-5">
        <InlineField
          label="매월 적립액"
          value={amount}
          min={0} max={MAN * 300} step={MAN * 10}
          display={v => `${Math.floor(v / MAN).toLocaleString()}만 원`}
          parse={s => parseFloat(s) * MAN}
          trackColor={theme.trackAmount} thumbColor={theme.thumbAmount}
          onChange={onAmountChange}
        />

        <InlineField
          label="예상 수익률 (연)"
          value={rate}
          min={0.5} max={15} step={0.1}
          display={v => `${v.toFixed(1)}%`}
          parse={parseFloat}
          trackColor={theme.trackRate} thumbColor={theme.thumbRate}
          onChange={onRateChange}
          decimalPlaces={1}
          warningFn={v => v > 0 ? '예상 수익률은 미래의 성과를 보장하지 않습니다.' : null}
        />

        {showPaymentYears && (
          <>
            <InlineField
              label="납입 기간"
              value={paymentYears}
              min={5} max={20} step={1}
              display={v => `${v}년`}
              parse={v => parseInt(v)}
              trackColor={theme.trackAmount} thumbColor={theme.thumbAmount}
              onChange={onPaymentYearsChange}
            />
            <div className="flex items-start gap-2 bg-gold-50 rounded-xl px-3 py-2.5 border border-gold-200">
              <span className="text-gold-600 mt-0.5 shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.75 9H5.25V5.25h1.5V9zm0-5.25H5.25v-1.5h1.5v1.5z"/></svg>
              </span>
              <p className="text-[10px] text-gold-900 leading-relaxed">
                납입 종료 후 은퇴까지 <strong>{rate.toFixed(1)}% 수익률</strong>로 스스로 복리 증식됩니다.
                {paymentYears <= 10 && <><br /><span className="text-gold-700 font-semibold">집중 납입 → 장기 복리 전략</span>이 적용됩니다.</>}
              </p>
            </div>
          </>
        )}

        {/* 예금자보호 경고 (은행 전용) */}
        {isBank && amount * 12 > 0 && (
          (() => {
            // 적립 기간 추정 불가이므로 1억 기준 경고는 월 적립액 기준으로 표시
            const annualAmount = amount * 12;
            if (annualAmount > 0) {
              return (
                <div className="flex items-start gap-1.5 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                  <Shield size={11} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-snug">
                    예금자보호법에 따라 1인당 <strong>1억 원까지</strong> 보호됩니다.
                    {amount * 120 > DEPOSIT_PROTECTION_LIMIT && (
                      <span className="text-red-600 font-semibold"> 10년 납입 예상액이 보호 한도(1억)를 초과합니다. 분산 예치를 권장합니다.</span>
                    )}
                  </p>
                </div>
              );
            }
            return null;
          })()
        )}

        <div className="flex items-center justify-between pt-1 border-t border-navy-50">
          <span className="text-[10px] text-navy-400">{theme.taxLabel}</span>
          <span className="text-[10px] font-semibold text-navy-500">
            연 예상 수익 {Math.floor(Math.round(amount * 12 * (rate / 100)) / MAN).toLocaleString()}만 원
          </span>
        </div>
      </div>
    </div>
  );
}

// ── DEFAULT ────────────────────────────────────────────────────────────────────
const DEFAULT_INPUTS: SimulatorInputs = {
  currentAge: 35,
  retirementAge: 60,
  pensionYears: 25,
  currentSavings: MAN * 5000,
  monthlyBank: MAN * 30,
  bankRate: DEFAULT_BANK_RATE,
  monthlyStock: MAN * 50,
  stockRate: DEFAULT_STOCK_RATE,
  monthlyInsurance: MAN * 20,
  insuranceRate: DEFAULT_INS_RATE,
  insurancePaymentYears: 10,
  annualSalary: MAN * 5000,
  monthlyExpense: MAN * 300,
  activeEndAge: 78,
  medicalCostEnabled: true,
  monthlyMedicalCost: MAN * 40,
};

function calcDefaultPensionYears(currentAge: number) {
  return Math.min(40, Math.max(10, Math.max(0, 60 - currentAge)));
}

// ── InputScreen ────────────────────────────────────────────────────────────────
export default function InputScreen({ onSimulate, initialInputs }: Props) {
  const [v, setV] = useState<SimulatorInputs>(() => initialInputs ?? DEFAULT_INPUTS);
  const [pensionAutoSet, setPensionAutoSet] = useState(!initialInputs);
  const [bucketOpen, setBucketOpen] = useState(false);

  useLayoutEffect(() => {
    if (initialInputs === undefined) return;
    setV(initialInputs);
    setPensionAutoSet(false);
  }, [initialInputs]);

  useEffect(() => {
    if (pensionAutoSet) {
      setV(prev => ({ ...prev, pensionYears: calcDefaultPensionYears(prev.currentAge) }));
    }
  }, [v.currentAge, pensionAutoSet]);

  function set<K extends keyof SimulatorInputs>(key: K) {
    return (val: number) => setV(prev => ({ ...prev, [key]: val }));
  }

  const totalMonthly = v.monthlyBank + v.monthlyStock + v.monthlyInsurance;

  return (
    <div className="flex flex-col min-h-screen bg-navy-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-navy-900 to-navy-800 px-5 pt-14 pb-8 border-b border-navy-700">
        <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-gold-400 uppercase bg-navy-800 border border-gold-700/40 px-3 py-1 rounded-full mb-4">
          보험 전문가용 노후 시뮬레이터
        </span>
        <h1 className="text-[26px] font-extrabold text-white leading-tight tracking-tight">
          내 품격 있는 노후는<br />
          <span className="text-gold-400">몇 살에 끝날까요?</span>
        </h1>
        <p className="text-sm text-navy-300 mt-2 leading-relaxed">
          정보를 입력하면 은퇴 자산이 정확히 언제 고갈되는지 진단해드립니다.
        </p>
        <div className="mt-4 flex items-center gap-2 bg-navy-800/60 rounded-xl px-3 py-2 border border-navy-600/50">
          <AlertTriangle size={12} className="text-gold-400 shrink-0" />
          <p className="text-[10px] text-navy-300 leading-snug">
            본 시뮬레이션은 참고용이며, 실제 수익률·세금·건보료는 개인별 상황과 법령 개정에 따라 달라질 수 있습니다.
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-3 bg-slate-50">

        {/* 나이 */}
        <div className="animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <DualInput
            label="현재 나이" sublabel="만 나이 기준" icon={<User size={16} />}
            value={v.currentAge} min={25} max={55} step={1} unit="세"
            display={String} parse={parseInt}
            trackColor="bg-navy-500" onChange={set('currentAge')}
          />
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
          <DualInput
            label="은퇴 희망 나이" sublabel="경제활동 종료 시점" icon={<Briefcase size={16} />}
            value={v.retirementAge} min={45} max={75} step={1} unit="세"
            display={String} parse={parseInt}
            trackColor="bg-navy-500" onChange={set('retirementAge')}
          />
        </div>

        {/* 국민연금 */}
        <div className="animate-fade-in" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
          <PensionYearsCard
            value={v.pensionYears}
            onChange={val => { setPensionAutoSet(false); setV(prev => ({ ...prev, pensionYears: val })); }}
            isAutoSet={pensionAutoSet}
          />
        </div>

        {/* 연봉 */}
        <div className="animate-fade-in" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
          <SalaryCard value={v.annualSalary} onChange={set('annualSalary')} />
        </div>

        {/* 현재 보유 자금 */}
        <div className="animate-fade-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <DualInput
            label="현재 보유 자금" sublabel="투자·예금 포함 총 자산" icon={<PiggyBank size={16} />}
            value={v.currentSavings} min={0} max={MAN * 100000} step={MAN * 500} unit="만 원"
            display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
            trackColor="bg-navy-500" onChange={set('currentSavings')}
          />
        </div>

        {/* ── 자산별 정밀 배분 ── */}
        <div className="animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <button type="button" onClick={() => setBucketOpen(p => !p)}
            className="w-full bg-white rounded-2xl px-5 py-4 shadow-sm border border-navy-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <BarChart2 size={15} className="text-navy-600" />
              <div className="text-left">
                <p className="text-xs font-bold text-navy-800">자산별 정밀 배분</p>
                <p className="text-[10px] text-navy-400">
                  합계 <span className="font-bold text-navy-700">{Math.floor(totalMonthly / MAN).toLocaleString()}만 원/월</span>
                  {' '}· 은행/증권/보험 각각 수익률 설정
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!bucketOpen && <span className="text-[10px] text-gold-600 font-bold bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full">세부 설정</span>}
              <ChevronDown size={16} className={`text-navy-400 transition-transform ${bucketOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {bucketOpen && (
            <div className="flex flex-col gap-3 mt-3">
              {totalMonthly > 0 && (
                <div className="bg-white rounded-2xl px-4 py-3 border border-navy-100 shadow-sm">
                  <p className="text-[10px] text-navy-400 mb-2">현재 적립 비중</p>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-navy-600 transition-all" style={{ width: `${(v.monthlyBank / totalMonthly) * 100}%` }} />
                    <div className="bg-red-600 transition-all" style={{ width: `${(v.monthlyStock / totalMonthly) * 100}%` }} />
                    <div className="bg-gold-500 transition-all" style={{ width: `${(v.monthlyInsurance / totalMonthly) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px]">
                    <span className="text-navy-600 font-semibold"><span className="inline-block w-2 h-2 rounded-full bg-navy-600 mr-1" />은행 {Math.round((v.monthlyBank / totalMonthly) * 100)}%</span>
                    <span className="text-red-600 font-semibold"><span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1" />증권 {Math.round((v.monthlyStock / totalMonthly) * 100)}%</span>
                    <span className="text-gold-600 font-semibold"><span className="inline-block w-2 h-2 rounded-full bg-gold-500 mr-1" />보험 {Math.round((v.monthlyInsurance / totalMonthly) * 100)}%</span>
                  </div>
                </div>
              )}

              <BucketCard theme={BANK_THEME} amount={v.monthlyBank} rate={v.bankRate} onAmountChange={set('monthlyBank')} onRateChange={set('bankRate')} />
              <BucketCard theme={STOCK_THEME} amount={v.monthlyStock} rate={v.stockRate} onAmountChange={set('monthlyStock')} onRateChange={set('stockRate')} />
              <BucketCard theme={INS_THEME} amount={v.monthlyInsurance} rate={v.insuranceRate} onAmountChange={set('monthlyInsurance')} onRateChange={set('insuranceRate')} paymentYears={v.insurancePaymentYears ?? 10} onPaymentYearsChange={set('insurancePaymentYears')} />

              <div className="rounded-2xl bg-gold-50 border border-gold-200 p-4 flex gap-2.5">
                <div className="shrink-0 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center mt-0.5">
                  <span className="text-white text-[9px] font-extrabold">!</span>
                </div>
                <p className="text-[11px] text-gold-900 leading-relaxed">
                  보험(비과세) 비중을 높이면 현행 세법 기준 세금이 절약되어 <strong>자산 고갈 시점이 수 년 더 늦춰집니다.</strong>
                  결과 화면에서 세 가지 시나리오를 비교 확인하세요.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 품격 유지 월 생활비 */}
        <div className="animate-fade-in" style={{ animationDelay: '360ms', animationFillMode: 'both' }}>
          <DualInput
            label="품격 유지 월 생활비" sublabel="은퇴 후 희망 생활비 (현재 가치)" icon={<Coffee size={16} />}
            value={v.monthlyExpense} min={MAN * 100} max={MAN * 1000} step={MAN * 10} unit="만 원"
            display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
            trackColor="bg-navy-500" onChange={set('monthlyExpense')}
          />
        </div>

        {/* ── 생애주기 설정 ── */}
        <div className="animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-teal-600" />
              <p className="text-xs font-bold text-navy-800">생애 주기별 지출 설정</p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[11px] font-semibold text-navy-700">활동 종료 나이</p>
                  <p className="text-[10px] text-navy-400">이후 생활비 75% 수준으로 자동 하향</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-navy-900">{v.activeEndAge}</span>
                  <span className="text-sm text-navy-400 ml-0.5">세</span>
                </div>
              </div>
              {(() => {
                const pct = ((v.activeEndAge - 65) / (90 - 65)) * 100;
                return (
                  <div className="relative h-1.5">
                    <div className="absolute inset-0 rounded-full bg-navy-100" />
                    <div className="absolute h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
                    <input type="range" min={65} max={90} step={1} value={v.activeEndAge}
                      onChange={e => setV(prev => ({ ...prev, activeEndAge: Number(e.target.value) }))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-md pointer-events-none transition-all"
                      style={{ left: `calc(${pct}% - 8px)` }} />
                  </div>
                );
              })()}
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-navy-300">65세</span>
                <span className="text-[10px] text-navy-300">90세</span>
              </div>
            </div>

            <div className="border-t border-navy-50 pt-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <HeartPulse size={14} className="text-rose-500" />
                  <div>
                    <p className="text-[11px] font-semibold text-navy-700">80세+ 의료비·간병비 추가</p>
                    <p className="text-[10px] text-navy-400">물가상승률 반영하여 매년 증가</p>
                  </div>
                </div>
                <button onClick={() => setV(prev => ({ ...prev, medicalCostEnabled: !prev.medicalCostEnabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${v.medicalCostEnabled ? 'bg-rose-500' : 'bg-navy-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${v.medicalCostEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {v.medicalCostEnabled && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-navy-500">월 의료비 예비금</span>
                    <span className="text-sm font-bold text-navy-900">{Math.floor(v.monthlyMedicalCost / MAN)}만 원</span>
                  </div>
                  {(() => {
                    const min = MAN * 10, max = MAN * 100;
                    const pct = ((v.monthlyMedicalCost - min) / (max - min)) * 100;
                    return (
                      <div className="relative h-1.5">
                        <div className="absolute inset-0 rounded-full bg-navy-100" />
                        <div className="absolute h-full rounded-full bg-rose-400 transition-all" style={{ width: `${pct}%` }} />
                        <input type="range" min={min} max={max} step={MAN * 5} value={v.monthlyMedicalCost}
                          onChange={e => setV(prev => ({ ...prev, monthlyMedicalCost: Number(e.target.value) }))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-md pointer-events-none transition-all"
                          style={{ left: `calc(${pct}% - 8px)` }} />
                      </div>
                    );
                  })()}
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-navy-300">10만 원</span>
                    <span className="text-[10px] text-navy-300">100만 원</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 가정 안내 */}
        <div className="rounded-2xl bg-navy-50 border border-navy-100 p-4 flex gap-2.5 mt-1 animate-fade-in" style={{ animationDelay: '440ms', animationFillMode: 'both' }}>
          <div className="shrink-0 w-4 h-4 rounded-full bg-navy-600 flex items-center justify-center mt-0.5">
            <span className="text-white text-[9px] font-extrabold">i</span>
          </div>
          <p className="text-[11px] text-navy-700 leading-relaxed">
            물가상승 <strong>연 3.0%</strong> · 기대수명 <strong>100세</strong> · 활동기/비활동기 생활비 자동 구분
            · 은행·증권 <strong>이자소득세 15.4%</strong> 과세, 보험 <strong>비과세</strong> 자동 적용 (현행 세법 기준)
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 px-4 pb-10 pt-3 bg-white/95 backdrop-blur border-t border-navy-100">
        <button onClick={() => onSimulate(v)}
          className="w-full bg-gradient-to-r from-navy-800 to-navy-700 hover:from-navy-700 hover:to-navy-600 active:scale-[0.98] text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-xl shadow-navy-900/30 border border-gold-600/30">
          <span className="text-gold-400">▶</span>
          내 품격 유지 한계선 진단하기
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
