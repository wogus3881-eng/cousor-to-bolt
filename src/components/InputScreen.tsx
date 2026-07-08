import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  ChevronRight, ChevronDown, User, Briefcase, PiggyBank, TrendingUp,
  Coffee, BarChart2, CalendarDays, HeartPulse, Activity, HelpCircle,
  Landmark, Shield, AlertTriangle,
} from 'lucide-react';
import type { SimulatorInputs } from '../lib/calculator';
import { DEFAULT_BANK_RATE, DEFAULT_STOCK_RATE, DEFAULT_INS_RATE } from '../lib/calculator';
import { proFeatures, type ProTier } from '../lib/proTier';
import ProUpgradePrompt from './ProUpgradePrompt';

interface Props {
  onSimulate: (inputs: SimulatorInputs) => void;
  initialInputs?: SimulatorInputs;
  tier?: ProTier;
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
  tooltip,
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
  tooltip?: string;
}) {
  const [raw, setRaw] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 동적 max: 입력값이 기본 max 초과 시 입력값의 2배로 자동 확장
  const dynamicMax = value > max ? value * 2 : max;
  const pct = Math.min(100, Math.max(0, ((value - min) / (dynamicMax - min)) * 100));
  const warning = warningFn ? warningFn(value) : null;

  function commitRaw(s: string) {
    const parsed = parse(s);
    // 직접 입력 시 max 제한 없음 (고액자산가 대응)
    if (!isNaN(parsed) && parsed >= min) onChange(parsed);
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-navy-100 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        {icon ? (
          <div className="flex items-center gap-2">
            <span className="text-navy-600">{icon}</span>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-navy-800">{label}</p>
                {tooltip && <Tooltip text={tooltip} />}
              </div>
              {sublabel && <p className="text-[10px] text-navy-400">{sublabel}</p>}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-navy-800">{label}</p>
              {tooltip && <Tooltip text={tooltip} />}
            </div>
            {sublabel && <p className="text-[10px] text-navy-400">{sublabel}</p>}
          </div>
        )}

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
        <input type="range" min={min} max={dynamicMax} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" />
        <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${trackColor} border-2 border-white shadow-md pointer-events-none transition-all`}
          style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-navy-300">{display(min)}{unit}</span>
        <span className="text-[10px] text-navy-300">{display(dynamicMax)}{unit}</span>
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

  // 동적 max: 입력값이 기본 max 초과 시 입력값의 2배로 자동 확장
  const dynamicMax = value > max ? value * 2 : max;
  const pct = Math.min(100, Math.max(0, ((value - min) / (dynamicMax - min)) * 100));
  const warning = warningFn ? warningFn(value) : null;

  function commitRaw(s: string) {
    const parsed = parse(s);
    // 직접 입력 시 max 제한 없음 (고액자산가 대응)
    if (!isNaN(parsed) && parsed >= min) onChange(parsed);
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
        <input type="range" min={min} max={dynamicMax} step={step} value={value}
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
function SalaryCard({
  value,
  onChange,
  employmentType,
}: {
  value: number;
  onChange: (v: number) => void;
  employmentType: 'employee' | 'self-employed';
}) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);
  const isSelfEmployed = employmentType === 'self-employed';
  const displayAmount = isSelfEmployed ? value / 12 : value;
  const display = (v: number) => Math.floor(v / MAN).toLocaleString();

  function commit(s: string) {
    const p = parseFloat(s.replace(/,/g, ''));
    if (!isNaN(p) && p >= 0) {
      const stored = isSelfEmployed ? p * MAN * 12 : p * MAN;
      onChange(stored);
      setRaw(display(isSelfEmployed ? stored / 12 : stored));
    } else {
      setRaw(display(displayAmount));
    }
  }

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${focused ? 'border-gold-400 ring-2 ring-gold-100 shadow-md' : 'border-navy-100 hover:shadow-md'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-navy-600"><TrendingUp size={16} /></span>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-navy-800">
                {isSelfEmployed ? '월 평균 순수입 (경비 제외)' : '현재 세전 연봉'}
              </p>
              {isSelfEmployed && (
                <Tooltip text="실제 손에 쥐는 금액 기준으로 입력해 주세요. 국민연금 신고 소득과 다를 수 있어요." />
              )}
            </div>
            <p className="text-[10px] text-navy-400">
              {isSelfEmployed ? '생활비·저축 계획 기준' : '국민연금 산정 기준'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mt-4">
        <input type="text" inputMode="numeric"
          className="flex-1 text-right text-2xl font-extrabold text-navy-900 outline-none bg-transparent min-w-0"
          placeholder={isSelfEmployed ? '예: 300' : '예: 5,000'}
          value={focused ? raw : display(displayAmount)}
          onChange={e => setRaw(e.target.value)}
          onFocus={() => { setFocused(true); setRaw(display(displayAmount)); }}
          onBlur={() => { setFocused(false); commit(raw); }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
        <span className="text-sm text-navy-400 shrink-0">만 원{isSelfEmployed ? '/월' : ''}</span>
      </div>
      <div className="h-px bg-gold-200 mt-2" />
    </div>
  );
}


// ── SectionHeader: 그룹 제목 ─────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-2 pb-1">
      <div className="w-8 h-8 rounded-xl bg-navy-800 flex items-center justify-center shrink-0">
        <span className="text-gold-400 text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-extrabold text-navy-900">{title}</p>
        {subtitle && <p className="text-[10px] text-navy-400">{subtitle}</p>}
      </div>
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
              min={1} max={360} step={1}
              display={v => `${v}개월 (${Math.floor(v/12)}년 ${v%12}개월)`}
              parse={v => parseInt(v.replace(/[^0-9]/g, ''))}
              trackColor={theme.trackAmount} thumbColor={theme.thumbAmount}
              onChange={onPaymentYearsChange}
              tooltip="총 납입 개월 수입니다. 예: 84개월(7년), 120개월(10년)"
            />
            <div className="flex items-start gap-2 bg-gold-50 rounded-xl px-3 py-2.5 border border-gold-200">
              <span className="text-gold-600 mt-0.5 shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.75 9H5.25V5.25h1.5V9zm0-5.25H5.25v-1.5h1.5v1.5z"/></svg>
              </span>
              <p className="text-[10px] text-gold-900 leading-relaxed">
                납입 종료 후 은퇴까지 <strong>{rate.toFixed(1)}% 수익률</strong>로 스스로 복리 증식됩니다.
                {paymentYears <= 120 && <><br /><span className="text-gold-700 font-semibold">집중 납입 → 장기 복리 전략</span>이 적용됩니다.</>}
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
  insurancePaymentYears: 120,
  annualSalary: MAN * 5000,
  monthlyExpense: MAN * 300,
  activeEndAge: 78,
  medicalCostEnabled: true,
  monthlyMedicalCost: MAN * 40,
  monthlyPension401k: 0,
  pension401kRate: 3.0,
  pension401kPaymentYears: 25,
  monthlyPensionSavings: 0,
  pensionSavingsRate: 5.0,
  savingsPensionSavings: 0,
  usdInsuranceCurrentUSD: 0,
  usdInsuranceMonthlyUSD: 0,
  usdInsurancePaymentYears: 10,
  usdInsuranceRate: 4.0,
  currentExchangeRate: 1350,
  usdInsuranceMaturityExchangeRate: 1400,
  usdInsuranceMaturityReinvest: 'stock' as const,
  pensionStartAge: 65,
  isaMonthly: 0,
  isaRate: DEFAULT_STOCK_RATE,
  isaTermYears: 5,
  employmentType: 'employee',
  pensionBaseIncome: MAN * 100,
  businessAsset: 0,
};

function calcDefaultPensionYears(currentAge: number) {
  return Math.min(40, Math.max(10, Math.max(0, 60 - currentAge)));
}

// ── InputScreen ────────────────────────────────────────────────────────────────
export default function InputScreen({ onSimulate, initialInputs, tier = 'plus' }: Props) {
  const features = proFeatures(tier);
  const [v, setV] = useState<SimulatorInputs>(() => initialInputs ?? DEFAULT_INPUTS);

  // 환율 자동 조회 (앱 열릴 때 1회)
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'
        );
        const data = await res.json();
        const krw = Math.round(data.usd.krw);
        if (krw > 1000 && krw < 2000) {
          setV(prev => ({
            ...prev,
            currentExchangeRate: krw,
            usdInsuranceMaturityExchangeRate: prev.usdInsuranceMaturityExchangeRate === 1400
              ? Math.round(krw * 1.05) // 만기 환율 기본값: 현재 +5%
              : prev.usdInsuranceMaturityExchangeRate,
          }));
        }
      } catch {
        // 실패 시 기본값 유지
      }
    };
    fetchRate();
  }, []);
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
  const pension401kPayYearsDefault = Math.max(1, Math.min(40, v.retirementAge - v.currentAge));
  const pension401kPaymentYears = v.pension401kPaymentYears ?? pension401kPayYearsDefault;
  const pensionStartAge = v.pensionStartAge ?? 65;
  const isaRate = v.isaRate ?? v.stockRate;
  const isaTermYears = v.isaTermYears ?? 5;
  const employmentType = v.employmentType ?? 'employee';
  const isSelfEmployed = employmentType === 'self-employed';
  const pensionBaseIncome = v.pensionBaseIncome ?? MAN * 100;

  function setEmploymentType(type: 'employee' | 'self-employed') {
    setV(prev => ({ ...prev, employmentType: type }));
  }

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

      <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-4 bg-slate-50">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 섹션 1: 기본 정보 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-3">
          <SectionHeader icon="👤" title="기본 정보" subtitle="나이·은퇴·국민연금" />

          {/* 직업 유형 */}
          <div className="animate-fade-in bg-white rounded-2xl p-1.5 shadow-sm border border-navy-100 flex gap-1.5">
            {([
              { id: 'employee' as const, label: '직장인' },
              { id: 'self-employed' as const, label: '자영업자/프리랜서' },
            ]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEmploymentType(id)}
                className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all ${
                  employmentType === id
                    ? 'bg-navy-800 text-white shadow-md'
                    : 'bg-transparent text-navy-500 hover:bg-navy-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 나이 / 은퇴 나이 */}
          <div className="animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <DualInput label="현재 나이" value={v.currentAge} min={25} max={55} step={1} unit="세"
              display={String} parse={parseInt} trackColor="bg-navy-500" onChange={set('currentAge')} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
            <DualInput label="은퇴 희망 나이" value={v.retirementAge} min={45} max={75} step={1} unit="세"
              display={String} parse={parseInt} trackColor="bg-navy-500" onChange={set('retirementAge')} />
          </div>

          {/* 국민연금 */}
          {features.pensionStartAgeSelect && (
            <div className="animate-fade-in bg-white rounded-2xl p-4 shadow-sm border border-navy-100" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold text-navy-800">국민연금</p>
              </div>
              <div className="flex flex-col gap-3">
                <DualInput
                  label="예상 가입 기간" sublabel="직장입력 기준"
                  value={v.pensionYears ?? Math.max(1, Math.min(40, v.retirementAge - v.currentAge))}
                  min={1} max={40} step={1} unit="년"
                  display={val => {
                    const yr = val;
                    return yr < 20 ? `${yr}년 (소득대체율 12%)` : yr < 30 ? `${yr}년 (소득대체율 18%)` : `${yr}년 (소득대체율 25%)`;
                  }}
                  parse={parseInt}
                  trackColor="bg-navy-500"
                  onChange={val => { setPensionAutoSet(false); setV(prev => ({ ...prev, pensionYears: val })); }}
                />
                <DualInput
                  label="수급 개시 연령"
                  value={v.pensionStartAge ?? 65}
                  min={60} max={70} step={1} unit="세"
                  display={val => {
                    const adj = (val - 65) * 7.2;
                    return adj > 0 ? `${val}세 (+${adj.toFixed(0)}%)` : adj < 0 ? `${val}세 (${adj.toFixed(0)}%)` : `${val}세 (기준)`;
                  }}
                  parse={parseInt}
                  trackColor="bg-navy-500"
                  onChange={set('pensionStartAge')}
                  tooltip="65세 기준 1년 늦출수록 7.2% 증가, 앞당길수록 감소합니다."
                />
                <DualInput
                  label="국민연금 산정 기준 소득"
                  sublabel="국민연금 신청 기준"
                  value={v.pensionBaseIncome ?? MAN * 100}
                  min={MAN * 35} max={MAN * 617} step={MAN * 10} unit="만 원"
                  display={val => Math.floor(val / MAN).toLocaleString()}
                  parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                  trackColor="bg-navy-500"
                  onChange={set('pensionBaseIncome')}
                  tooltip="국민연금 납부 기준 월 소득입니다. 실제 납부 내역서나 예상 연금 조회로 확인하세요."
                />
              </div>
            </div>
          )}

          {/* 연봉 */}
          <div className="animate-fade-in" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
            <SalaryCard value={v.annualSalary} onChange={set('annualSalary')} employmentType={employmentType} />
          </div>

          {isSelfEmployed && (
            <div className="animate-fade-in" style={{ animationDelay: '210ms', animationFillMode: 'both' }}>
              <DualInput
                label="폐업/매각 시 예상 수령액 (권리금·보증금 등)"
                icon={<Briefcase size={16} />}
                value={v.businessAsset ?? 0}
                min={0} max={MAN * 10000} step={MAN * 500} unit="만 원"
                display={val => Math.floor(val / MAN).toLocaleString()}
                parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                trackColor="bg-navy-500"
                onChange={set('businessAsset')}
                tooltip="가게 권리금, 보증금 반환, 장비 매각 등 은퇴 시점에 받을 수 있는 사업 자산이에요."
              />
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 섹션 2: 현재 자산 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-3">
          <SectionHeader icon="💰" title="현재 자산" subtitle="지금 가지고 있는 돈" />

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 flex flex-col gap-3">
            <DualInput
              label="은행 CMA 보유액" sublabel="예금·적금·통장잔고 합산"
              value={v.savingsBank ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-blue-400" onChange={set('savingsBank')}
              tooltip="은행 예금, 적금, CMA 등 현재 잔고 합산입니다."
            />
            <DualInput
              label="증권 ETF 보유액" sublabel="주식·펀드·ETF 평가액"
              value={v.savingsStock ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-green-400" onChange={set('savingsStock')}
              tooltip="주식, ETF, 펀드 등 현재 평가액입니다."
            />
            <DualInput
              label="보험 해지환급금" sublabel="현재 해지 시 받을 수 있는 금액"
              value={v.savingsInsurance ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-purple-400" onChange={set('savingsInsurance')}
              tooltip="현재 보험을 해지할 경우 받을 수 있는 금액입니다."
            />

            {/* 달러 종신보험 현재 해지환급금 */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-navy-800">💵 달러 종신보험 해지환급금</p>
                  <p className="text-[10px] text-blue-500">
                    오늘 환율 <span className="font-bold">{(v.currentExchangeRate ?? 1350).toLocaleString()}원</span>
                    {' '}기준 ≈ {Math.floor((v.usdInsuranceCurrentUSD ?? 0) * (v.currentExchangeRate ?? 1350) / MAN).toLocaleString()}만원
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-navy-900">${(v.usdInsuranceCurrentUSD ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-navy-400">USD</span>
                </div>
              </div>
              <div className="relative h-1.5 mt-1">
                <div className="absolute inset-0 rounded-full bg-navy-100" />
                <div className="absolute h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${Math.min(100, ((v.usdInsuranceCurrentUSD ?? 0) / 50000) * 100)}%` }} />
                <input type="range" min={0} max={50000} step={100}
                  value={v.usdInsuranceCurrentUSD ?? 0}
                  onChange={e => setV(prev => ({ ...prev, usdInsuranceCurrentUSD: Number(e.target.value) }))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-md pointer-events-none"
                  style={{ left: `calc(${Math.min(100, ((v.usdInsuranceCurrentUSD ?? 0) / 50000) * 100)}% - 8px)` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-navy-300">$0</span>
                <span className="text-[10px] text-navy-300">$50,000</span>
              </div>
            </div>

            {/* 절세계좌 접기/펼치기 */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer py-2 px-1 rounded-xl hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">📋</span>
                  <p className="text-xs font-bold text-navy-800">절세계좌</p>
                  <span className="text-[10px] text-navy-400">IRP · 연금저축 · ISA</span>
                </div>
                <span className="text-navy-400 group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>
              <div className="flex flex-col gap-3 mt-3">
                <DualInput
                  label="IRP 적립금" sublabel="퇴직연금·IRP 합산"
                  value={v.savingsPension401k ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
                  display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                  trackColor="bg-orange-400" onChange={set('savingsPension401k')}
                  tooltip="IRP·퇴직연금 합산 금액입니다."
                />
                <DualInput
                  label="연금저축펀드 적립금" sublabel="연금저축계좌 (펀드형)"
                  value={v.savingsPensionSavings ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
                  display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                  trackColor="bg-yellow-400" onChange={set('savingsPensionSavings')}
                  tooltip="연금저축펀드 보유액입니다."
                />
                {features.isaCalculation && (
                  <DualInput
                    label="ISA 적립금" sublabel="개인종합자산관리계좌"
                    value={v.savingsIsa ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
                    display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                    trackColor="bg-teal-400" onChange={set('savingsIsa')}
                    tooltip="ISA 계좌 보유액입니다."
                  />
                )}
              </div>
            </details>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 섹션 3: 매월 저축 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-3">
          <SectionHeader icon="📈" title="매월 저축" subtitle="앞으로 넣을 돈" />

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 flex flex-col gap-3">
            <BucketCard theme={BANK_THEME} amount={v.monthlyBank} rate={v.bankRate ?? DEFAULT_BANK_RATE * 100} onAmountChange={set('monthlyBank')} onRateChange={set('bankRate')} />
            <BucketCard theme={STOCK_THEME} amount={v.monthlyStock} rate={v.stockRate ?? DEFAULT_STOCK_RATE * 100} onAmountChange={set('monthlyStock')} onRateChange={set('stockRate')} />
            <BucketCard theme={INS_THEME} amount={v.monthlyInsurance} rate={v.insuranceRate ?? DEFAULT_INS_RATE * 100} onAmountChange={set('monthlyInsurance')} onRateChange={set('insuranceRate')} paymentYears={v.insurancePaymentYears ?? 120} onPaymentYearsChange={set('insurancePaymentYears')} />

            {/* 달러 종신보험 */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-base">💵</span>
                <div>
                  <p className="text-xs font-bold text-navy-800">달러 종신보험</p>
                  <p className="text-[10px] text-navy-400">달러 종신·변액보험 · 환율 헷지 + 비과세</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-navy-600 font-medium">월 납입액</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-navy-900">${(v.usdInsuranceMonthlyUSD ?? 0).toLocaleString()}</span>
                    <span className="text-xs text-navy-400">USD</span>
                  </div>
                </div>
                <p className="text-[10px] text-blue-500 mb-2">
                  ≈ {Math.floor((v.usdInsuranceMonthlyUSD ?? 0) * (v.currentExchangeRate ?? 1350) / MAN).toLocaleString()}만원/월
                </p>
                <div className="relative h-1.5">
                  <div className="absolute inset-0 rounded-full bg-navy-100" />
                  <div className="absolute h-full rounded-full bg-blue-400 transition-all"
                    style={{ width: `${Math.min(100, ((v.usdInsuranceMonthlyUSD ?? 0) / 1000) * 100)}%` }} />
                  <input type="range" min={0} max={1000} step={10}
                    value={v.usdInsuranceMonthlyUSD ?? 0}
                    onChange={e => setV(prev => ({ ...prev, usdInsuranceMonthlyUSD: Number(e.target.value) }))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-md pointer-events-none"
                    style={{ left: `calc(${Math.min(100, ((v.usdInsuranceMonthlyUSD ?? 0) / 1000) * 100)}% - 8px)` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-navy-300">$0</span>
                  <span className="text-[10px] text-navy-300">$1,000</span>
                </div>
              </div>
              <DualInput label="납입 기간"
                value={v.usdInsurancePaymentYears ?? 120}
                min={1} max={360} step={1} unit="개월"
                display={val => `${val}개월 (${Math.floor(val/12)}년 ${val%12}개월)`}
                parse={s => parseInt(s.replace(/[^0-9]/g, ''))}
                trackColor="bg-blue-400"
                onChange={val => setV(prev => ({ ...prev, usdInsurancePaymentYears: val }))}
                tooltip="총 납입 개월 수입니다. 예: 84개월(7년), 120개월(10년)"
              />
              <DualInput label="공시이율 (수익률)"
                value={v.usdInsuranceRate ?? 4.0}
                min={1.0} max={8.0} step={0.1} unit="%"
                display={val => val.toFixed(1)} parse={parseFloat}
                trackColor="bg-blue-400" decimalPlaces={1}
                onChange={val => setV(prev => ({ ...prev, usdInsuranceRate: val }))}
                tooltip="달러 종신보험 공시이율입니다. 통상 3.5~5% 수준이에요."
              />
              <div className="bg-white rounded-xl p-3 border border-blue-100 flex flex-col gap-2">
                <p className="text-[10px] font-bold text-blue-800">환율 설정</p>
                <DualInput label="현재 환율"
                  value={v.currentExchangeRate ?? 1350}
                  min={1000} max={2000} step={10} unit="원/달러"
                  display={val => val.toLocaleString()} parse={s => parseFloat(s.replace(/,/g, ''))}
                  trackColor="bg-blue-400"
                  onChange={val => setV(prev => ({ ...prev, currentExchangeRate: val }))}
                  tooltip="자동으로 오늘 환율을 가져옵니다. 직접 수정도 가능해요."
                />
                <DualInput label="만기 예상 환율"
                  value={v.usdInsuranceMaturityExchangeRate ?? 1400}
                  min={1000} max={2500} step={10} unit="원/달러"
                  display={val => val.toLocaleString()} parse={s => parseFloat(s.replace(/,/g, ''))}
                  trackColor="bg-blue-600"
                  onChange={val => setV(prev => ({ ...prev, usdInsuranceMaturityExchangeRate: val }))}
                  tooltip="만기 시점의 예상 환율입니다."
                />
              </div>
              <div className="bg-white rounded-xl border border-blue-100 p-3">
                <p className="text-[10px] font-bold text-navy-800 mb-2">만기 환급금 활용 전략</p>
                <div className="flex gap-2">
                  {(['stock', 'bank', 'keep'] as const).map(opt => (
                    <button key={opt}
                      onClick={() => setV(prev => ({ ...prev, usdInsuranceMaturityReinvest: opt }))}
                      className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold transition-colors
                        ${(v.usdInsuranceMaturityReinvest ?? 'stock') === opt
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {opt === 'stock' ? '증권 재투자' : opt === 'bank' ? '은행 이체' : '보험 유지'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 절세계좌 접기/펼치기 */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer py-2 px-1 rounded-xl hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">📋</span>
                  <p className="text-xs font-bold text-navy-800">절세계좌 납입</p>
                  <span className="text-[10px] text-navy-400">IRP · 연금저축 · ISA</span>
                </div>
                <span className="text-navy-400 group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>
              <div className="flex flex-col gap-3 mt-3">
                {features.pension401kBucket && !isSelfEmployed && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                      <p className="text-xs font-bold text-navy-700">IRP (퇴직연금)</p>
                    </div>
                    <DualInput label="월 납입액"
                      value={v.monthlyPension401k ?? 0}
                      min={0} max={MAN * 50} step={MAN * 5} unit="만 원"
                      display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                      trackColor="bg-orange-400" onChange={set('monthlyPension401k')}
                    />
                    <DualInput label="운용 수익률"
                      value={v.pension401kRate ?? 3.0}
                      min={1.0} max={15} step={0.5} unit="%"
                      display={val => val.toFixed(1)} parse={parseFloat}
                      trackColor="bg-orange-400" decimalPlaces={1} onChange={set('pension401kRate')}
                      tooltip="IRP 운용 수익률입니다. 직접 운용 시 기대 수익률을 입력하세요."
                    />
                    <DualInput label="납입 기간"
                      value={v.pension401kPaymentYears ?? pension401kPayYearsDefault}
                      min={1} max={40} step={1} unit="년"
                      display={String} parse={parseInt} trackColor="bg-orange-400" onChange={set('pension401kPaymentYears')}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <p className="text-xs font-bold text-navy-700">연금저축펀드</p>
                    <span className="text-[10px] text-navy-400">세액공제 연 600만원 한도</span>
                  </div>
                  <DualInput label="월 납입액"
                    value={v.monthlyPensionSavings ?? 0}
                    min={0} max={MAN * 50} step={MAN * 5} unit="만 원"
                    display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                    trackColor="bg-yellow-400" onChange={set('monthlyPensionSavings')}
                    tooltip="연금저축펀드 월 납입액입니다. 연 600만원 한도로 세액공제 16.5% 적용."
                  />
                  <DualInput label="운용 수익률"
                    value={v.pensionSavingsRate ?? 5.0}
                    min={1.0} max={15} step={0.5} unit="%"
                    display={val => val.toFixed(1)} parse={parseFloat}
                    trackColor="bg-yellow-400" decimalPlaces={1} onChange={set('pensionSavingsRate')}
                  />
                </div>

                {features.isaCalculation && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                      <p className="text-xs font-bold text-navy-700">ISA 계좌</p>
                      <span className="text-[10px] text-navy-400">비과세 · 연 2,000만원 한도</span>
                    </div>
                    <DualInput label="월 납입액"
                      value={v.isaMonthly ?? 0}
                      min={0} max={MAN * 50} step={MAN * 5} unit="만 원"
                      display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                      trackColor="bg-teal-500" onChange={set('isaMonthly')}
                      tooltip="연간 2,000만원 한도 내 이자·배당 200만원까지 비과세 혜택이 있어요."
                    />
                    <DualInput label="운용 수익률"
                      value={isaRate} min={1.0} max={15} step={0.5} unit="%"
                      display={val => val.toFixed(1)} parse={parseFloat}
                      trackColor="bg-teal-500" decimalPlaces={1} onChange={set('isaRate')}
                    />
                    <DualInput label="납입 기간"
                      value={isaTermYears} min={1} max={5} step={1} unit="년"
                      display={String} parse={parseInt} trackColor="bg-teal-500" onChange={set('isaTermYears')}
                      tooltip="ISA는 최소 3년 이상 유지해야 비과세 혜택이 적용돼요."
                    />
                  </div>
                )}
              </div>
            </details>

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
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 섹션 4: 생활비 설정 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col gap-3">
          <SectionHeader icon="🏠" title="생활비 설정" subtitle="은퇴 후 필요한 돈" />

          <div className="animate-fade-in" style={{ animationDelay: '355ms', animationFillMode: 'both' }}>
            <DualInput
              label="월 생활비 (품격 유지)" sublabel="현재 기준"
              icon={<Home size={16} />}
              value={v.monthlyExpense}
              min={MAN * 100} max={MAN * 1000} step={MAN * 10} unit="만 원"
              display={val => Math.floor(val / MAN).toLocaleString()}
              parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-navy-500"
              onChange={set('monthlyExpense')}
              tooltip="은퇴 후 매달 유지하고 싶은 생활 수준입니다. 현재 기준 금액으로 입력하세요."
            />
          </div>

          {features.lifecycleSettings ? (
            <div className="animate-fade-in" style={{ animationDelay: '360ms', animationFillMode: 'both' }}>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 flex flex-col gap-3">
                <DualInput
                  label="활동 종료 나이" sublabel="이후 75%로 생활비 감소"
                  value={v.activeEndAge ?? 78}
                  min={65} max={90} step={1} unit="세"
                  display={String} parse={parseInt}
                  trackColor="bg-navy-500"
                  onChange={set('activeEndAge')}
                  tooltip="이 나이 이후 생활비가 75% 수준으로 자동 감소합니다."
                />
                <DualInput
                  label="월 의료비 (80세 이후)" sublabel="현재 가치 기준"
                  icon={<Heart size={16} />}
                  value={v.monthlyMedicalCost ?? MAN * 40}
                  min={0} max={MAN * 200} step={MAN * 10} unit="만 원"
                  display={val => Math.floor(val / MAN).toLocaleString()}
                  parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                  trackColor="bg-red-400"
                  onChange={set('monthlyMedicalCost')}
                  tooltip="80세 이후 예상 월 의료비입니다. 현재 가치 기준으로 입력하면 자동으로 인플레이션이 반영됩니다."
                />
              </div>
            </div>
          ) : (
            <ProUpgradePrompt
              title="치료비 리스크 섹션은 Pro Plus"
              description="활동 종료 나이, 80세 이후 의료비 설정 기능입니다."
            />
          )}
        </div>

        {/* 안내 */}
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
