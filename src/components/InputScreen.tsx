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
  const dynamicMax = value > max ? value * 2 : max;
  const pct = Math.min(100, Math.max(0, ((value - min) / (dynamicMax - min)) * 100));
  const warning = warningFn ? warningFn(value) : null;

  function commitRaw(s: string) {
    const parsed = parse(s);
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
  const dynamicMax = value > max ? value * 2 : max;
  const pct = Math.min(100, Math.max(0, ((value - min) / (dynamicMax - min)) * 100));
  const warning = warningFn ? warningFn(value) : null;

  function commitRaw(s: string) {
    const parsed = parse(s);
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


// ── CollapsibleSection ──────────────────────────────────────────────────────
function CollapsibleSection({ icon, title, subtitle, children, defaultOpen = true }: {
  icon: string; title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="flex items-center justify-between px-1 pt-1 pb-1 w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-navy-800 flex items-center justify-center shrink-0">
            <span className="text-gold-400 text-xs">{icon}</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-extrabold text-navy-900">{title}</p>
            {subtitle && <p className="text-[10px] text-navy-400">{subtitle}</p>}
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full bg-navy-100 flex items-center justify-center transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <span className="text-navy-500 text-[10px]">▼</span>
        </div>
      </button>
      {open && <>{children}</>}
    </div>
  );
}

// ── AddLifeEventForm ─────────────────────────────────────────────────────────
function AddLifeEventForm({ minAge, maxAge, onAdd }: {
  minAge: number; maxAge: number;
  onAdd: (ev: { age: number; amount: number; label: string; source: 'auto' }) => void;
}) {
  const [age, setAge] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [label, setLabel] = useState('');
  const MAN = 10000;

  const presets = [
    { label: '결혼자금', amount: 5000 },
    { label: '주택마련', amount: 30000 },
    { label: '자녀교육', amount: 5000 },
    { label: '자녀결혼', amount: 5000 },
  ];

  return (
    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex flex-col gap-2.5">
      {/* 프리셋 버튼 - 이름/금액만 자동입력, 나이는 직접 */}
      <p className="text-[10px] font-bold text-amber-800">빠른 선택 (나이는 직접 입력)</p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button key={p.label}
            onClick={() => { setLabel(p.label); setAmount(p.amount); }}
            className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold border transition-colors
              ${label === p.label
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'}`}>
            {p.label}
          </button>
        ))}
      </div>
      {/* 입력 폼 */}
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 w-20 shrink-0">
          <p className="text-[9px] text-amber-600 font-medium">나이 (세)</p>
          <input type="number" min={minAge} max={maxAge}
            value={age}
            placeholder={String(minAge + 5)}
            onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full text-sm font-bold text-navy-900 border border-amber-200 rounded-lg px-2 py-1.5 bg-white text-center"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <p className="text-[9px] text-amber-600 font-medium">금액 (만원)</p>
          <input type="number" min={0}
            value={amount}
            placeholder="5000"
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full text-sm font-bold text-navy-900 border border-amber-200 rounded-lg px-2 py-1.5 bg-white"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[9px] text-amber-600 font-medium">이름</p>
        <input type="text" placeholder="결혼자금, 주택마련, 자녀교육..."
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="w-full text-sm text-navy-900 border border-amber-200 rounded-lg px-2 py-1.5 bg-white"
        />
      </div>
      <button
        onClick={() => {
          if (age && Number(age) > 0 && amount && Number(amount) > 0 && label.trim()) {
            onAdd({ age: Number(age), amount: Number(amount) * MAN, label: label.trim(), source: 'auto' });
            setAge('');
            setAmount('');
            setLabel('');
          }
        }}
        disabled={!age || !amount || !label.trim()}
        className="w-full bg-amber-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        + 추가하기
      </button>
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

            {/* 만기 환급금 재투자 전략 */}
            <div className="bg-white rounded-xl border border-navy-100 p-3">
              <p className="text-[10px] font-bold text-navy-800 mb-2">만기 환급금 활용 전략</p>
              <div className="flex gap-1.5">
                {([
                  { key: 'keep' as const, label: '종신연금 유지', desc: '평생 월 지급' },
                  { key: 'stock' as const, label: '증권 재투자', desc: `${rate.toFixed(1)}% 운용` },
                  { key: 'bank' as const, label: '은행 이체', desc: '2.5% 안전' },
                ]).map(opt => (
                  <button key={opt.key}
                    type="button"
                    onClick={() => setV(prev => ({ ...prev, insuranceMaturityReinvest: opt.key }))}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-bold transition-colors text-center
                      ${(v.insuranceMaturityReinvest ?? 'keep') === opt.key
                        ? 'bg-navy-800 text-white'
                        : 'bg-slate-50 text-navy-600 border border-slate-200'}`}>
                    <p>{opt.label}</p>
                    <p className="font-normal opacity-70 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
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
  monthlyPensionSavings: 0,
  pensionSavingsRate: 5.0,
  savingsPensionSavings: 0,
  usdInsuranceCurrentUSD: 0,
  usdInsuranceMonthlyUSD: 0,
  usdInsurancePaymentMonths: 120,
  usdInsuranceRate: 4.0,
  currentExchangeRate: 1350,
  usdInsuranceMaturityExchangeRate: 1400,
  usdInsuranceMaturityReinvest: 'stock' as const,
  lifeEvents: [] as Array<{ age: number; amount: number; label: string; source: 'bank' | 'stock' | 'insurance' | 'auto' }>,
  insuranceMaturityReinvest: 'keep' as const,
  annualSalary: MAN * 5000,
  monthlyExpense: MAN * 300,
  activeEndAge: 78,
  medicalCostEnabled: true,
  monthlyMedicalCost: MAN * 40,
  monthlyPension401k: 0,
  pension401kRate: 3.0,
  pension401kPaymentYears: 25,
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

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json')
      .then(r => r.json())
      .then(data => {
        const krw = Math.round(data.usd.krw);
        if (krw > 1000 && krw < 2500) {
          setV(prev => ({ ...prev, currentExchangeRate: krw,
            usdInsuranceMaturityExchangeRate: prev.usdInsuranceMaturityExchangeRate === 1400
              ? Math.round(krw * 1.05) : prev.usdInsuranceMaturityExchangeRate }));
        }
      }).catch(() => {});
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

      <div className="flex-1 px-4 pt-6 pb-28 flex flex-col gap-3 bg-slate-50">

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

        {isSelfEmployed && (
          <div className="animate-fade-in" style={{ animationDelay: '140ms', animationFillMode: 'both' }}>
            <DualInput
              label="국민연금 납부 기준 월 소득"
              icon={<CalendarDays size={16} />}
              value={pensionBaseIncome}
              min={MAN * 35} max={MAN * 617} step={MAN * 10} unit="만 원"
              display={val => Math.floor(val / MAN).toLocaleString()}
              parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-navy-500"
              onChange={set('pensionBaseIncome')}
              tooltip="실제 납부하고 계신 국민연금 고지서 기준 소득이에요."
            />
          </div>
        )}

        {features.pensionStartAgeSelect && (
          <div className="animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
            <DualInput
              label="국민연금 수급 개시 연령"
              icon={<CalendarDays size={16} />}
              value={pensionStartAge}
              min={60} max={70} step={1} unit="세"
              display={String} parse={parseInt}
              trackColor="bg-navy-500"
              onChange={set('pensionStartAge')}
              tooltip="60~64세 조기수령 시 1년마다 6% 감액, 66~70세 연기수령 시 1년마다 7.2% 증액됩니다."
              warningFn={(age) => {
                if (age < 63) return '조기수령 시 연금액이 많이 줄어요. 신중히 검토해 보세요.';
                if (age > 67) return '연기수령 시 월 수령액이 늘지만, 수령 시작이 늦어집니다.';
                return null;
              }}
            />
          </div>
        )}

        {/* 연봉 / 월 순수입 */}
        <div className="animate-fade-in" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
          <SalaryCard value={v.annualSalary} onChange={set('annualSalary')} employmentType={employmentType} />
        </div>

        {isSelfEmployed && (
          <div className="animate-fade-in" style={{ animationDelay: '210ms', animationFillMode: 'both' }}>
            <DualInput
              label="폐업/매각 시 예상 수령액 (권리금·보증금 등)"
              icon={<Briefcase size={16} />}
              value={v.businessAsset ?? 0}
              min={0} max={MAN * 20000} step={MAN * 500} unit="만 원"
              display={val => Math.floor(val / MAN).toLocaleString()}
              parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-navy-500"
              onChange={set('businessAsset')}
              tooltip="가게 권리금, 보증금 반환, 장비 매각 등 은퇴 시점에 받을 수 있는 사업 자산이에요."
            />
          </div>
        )}

        <CollapsibleSection icon="💰" title="현재 준비 현황" subtitle="지금 가지고 있는 돈">
        <div className="animate-fade-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <div className="mb-2 flex items-center gap-2">
            <PiggyBank size={16} className="text-navy-500" />
            <p className="text-xs font-bold text-navy-800">현재 준비 현황</p>
          </div>
          <div className="space-y-3">
            <DualInput
              label="은행·CMA 보유액" sublabel="예금·적금·파킹통장 합산"
              tooltip="모르시면 0으로 두셔도 됩니다. 대략적인 금액만 입력해도 충분해요."
              value={v.savingsBank ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-blue-400" onChange={set('savingsBank')}
            />
            <DualInput
              label="증권·ETF 보유액" sublabel="주식·펀드·ETF 평가액"
              tooltip="모르시면 0으로 두셔도 됩니다. 평가액 기준으로 입력해주세요."
              value={v.savingsStock ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-green-500" onChange={set('savingsStock')}
            />
            <DualInput
              label="보험 해지환급금" sublabel="현재 해지 시 받을 수 있는 금액"
              tooltip="현재 보험을 해지할 경우 받을 수 있는 금액입니다. 보험증권이나 앱에서 확인 가능해요."
              value={v.savingsInsurance ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-purple-400" onChange={set('savingsInsurance')}
            />
            <DualInput
              label="IRP·연금저축 적립금" sublabel="퇴직연금·개인연금 합산"
              tooltip="IRP·연금저축·퇴직연금 전체 합산 금액입니다."
              value={v.savingsPension401k ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-orange-400" onChange={set('savingsPension401k')}
            />
            <DualInput
              label="ISA 적립금" sublabel="개인종합자산관리계좌"
              tooltip="ISA 계좌 보유액입니다. 없으시면 0으로 두세요."
              value={v.savingsIsa ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-teal-400" onChange={set('savingsIsa')}
            />
            <DualInput
              label="연금저축펀드 적립금" sublabel="연금저축계좌 (펀드형)"
              tooltip="연금저축펀드 보유액입니다. IRP와 별도 운용 계좌예요."
              value={v.savingsPensionSavings ?? 0} min={0} max={MAN * 10000} step={MAN * 100} unit="만 원"
              display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
              trackColor="bg-yellow-400" onChange={set('savingsPensionSavings')}
            />
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-navy-800">💵 달러 종신보험 해지환급금</p>
                  <p className="text-[10px] text-blue-500">
                    오늘 환율 <span className="font-bold">{(v.currentExchangeRate ?? 1350).toLocaleString()}원</span>
                    {" "}기준 ≈ {Math.floor((v.usdInsuranceCurrentUSD ?? 0) * (v.currentExchangeRate ?? 1350) / MAN).toLocaleString()}만원
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
          </div>
        </div>

        </CollapsibleSection>

        <CollapsibleSection icon="📊" title="자산별 정밀 배분" subtitle="계좌별 수익률·납입기간 설정">
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

              {features.pension401kBucket && !isSelfEmployed && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <Landmark size={15} className="text-indigo-600" />
                    <p className="text-xs font-bold text-navy-800">퇴직연금 (IRP/DC)</p>
                  </div>
                  <DualInput
                    label="월 납입액"
                    value={v.monthlyPension401k ?? 0}
                    min={0} max={MAN * 200} step={MAN * 10} unit="만 원"
                    display={val => Math.floor(val / MAN).toLocaleString()}
                    parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                    trackColor="bg-indigo-500"
                    onChange={set('monthlyPension401k')}
                    tooltip="회사 부담금과 개인 추가납입 합산 금액이에요. DC형은 월 급여의 약 8.3%입니다."
                  />
                  <DualInput
                    label="운용 수익률"
                    value={v.pension401kRate ?? 3.0}
                    min={1.0} max={8.0} step={0.1} unit="%"
                    display={val => val.toFixed(1)}
                    parse={parseFloat}
                    trackColor="bg-indigo-500"
                    onChange={set('pension401kRate')}
                    decimalPlaces={1}
                    tooltip="DC형은 직접 운용 수익률, DB형은 회사 보장률(통상 1~3%)을 입력하세요."
                  />
                  <DualInput
                    label="납입 기간"
                    value={pension401kPaymentYears}
                    min={1} max={40} step={1} unit="년"
                    display={String} parse={parseInt}
                    trackColor="bg-indigo-500"
                    onChange={set('pension401kPaymentYears')}
                  />
                </div>
              )}

              {features.isaCalculation && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <TrendingUp size={15} className="text-emerald-600" />
                    <p className="text-xs font-bold text-navy-800">ISA 계좌 (비과세)</p>
                  </div>
                  <DualInput
                    label="월 납입액"
                    value={v.isaMonthly ?? 0}
                    min={0} max={MAN * 200} step={MAN * 10} unit="만 원"
                    display={val => Math.floor(val / MAN).toLocaleString()}
                    parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                    trackColor="bg-emerald-500"
                    onChange={set('isaMonthly')}
                    tooltip="연간 2,000만원 한도 내 이자·배당 200만원까지 비과세 혜택이 있어요."
                  />
                  <DualInput
                    label="운용 수익률"
                    value={isaRate}
                    min={1.0} max={10.0} step={0.1} unit="%"
                    display={val => val.toFixed(1)}
                    parse={parseFloat}
                    trackColor="bg-emerald-500"
                    onChange={set('isaRate')}
                    decimalPlaces={1}
                  />
                  <DualInput
                    label="납입 기간"
                    value={isaTermYears}
                    min={1} max={5} step={1} unit="년"
                    display={String} parse={parseInt}
                    trackColor="bg-emerald-500"
                    onChange={set('isaTermYears')}
                    tooltip="ISA는 최소 3년 이상 유지해야 비과세 혜택이 적용돼요."
                  />
                </div>
              )}

              {/* 연금저축펀드 월납입 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <p className="text-xs font-bold text-navy-800">📋 연금저축펀드</p>
                  <span className="text-[10px] text-navy-400">세액공제 연 600만원 한도</span>
                </div>
                <DualInput label="월 납입액"
                  value={v.monthlyPensionSavings ?? 0} min={0} max={MAN * 50} step={MAN * 5} unit="만 원"
                  display={val => Math.floor(val / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
                  trackColor="bg-yellow-400" onChange={set('monthlyPensionSavings')}
                  tooltip="연금저축펀드 월 납입액입니다. 연 600만원 한도로 세액공제 16.5% 적용."
                />
                <DualInput label="운용 수익률"
                  value={v.pensionSavingsRate ?? 5.0} min={1.0} max={15} step={0.5} unit="%"
                  display={val => val.toFixed(1)} parse={parseFloat}
                  trackColor="bg-yellow-400" decimalPlaces={1} onChange={set('pensionSavingsRate')}
                />
              </div>

              {/* 달러 종신보험 월납입 */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">💵</span>
                  <div>
                    <p className="text-xs font-bold text-navy-800">달러 종신보험</p>
                    <p className="text-[10px] text-navy-400">환율 헷지 + 비과세</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-navy-600 font-medium">월 납입액</p>
                    <span className="text-lg font-bold text-navy-900">${(v.usdInsuranceMonthlyUSD ?? 0).toLocaleString()} USD</span>
                  </div>
                  <p className="text-[10px] text-blue-500 mb-2">≈ {Math.floor((v.usdInsuranceMonthlyUSD ?? 0) * (v.currentExchangeRate ?? 1350) / MAN).toLocaleString()}만원/월</p>
                  <div className="relative h-1.5">
                    <div className="absolute inset-0 rounded-full bg-navy-100" />
                    <div className="absolute h-full rounded-full bg-blue-400 transition-all"
                      style={{ width: `${Math.min(100, ((v.usdInsuranceMonthlyUSD ?? 0) / 1000) * 100)}%` }} />
                    <input type="range" min={0} max={1000} step={10} value={v.usdInsuranceMonthlyUSD ?? 0}
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
                  value={v.usdInsurancePaymentMonths ?? 120} min={1} max={360} step={1} unit="개월"
                  display={val => `${val}개월 (${Math.floor(val/12)}년 ${val%12}개월)`}
                  parse={s => parseInt(s.replace(/[^0-9]/g, ''))}
                  trackColor="bg-blue-400"
                  onChange={val => setV(prev => ({ ...prev, usdInsurancePaymentMonths: val }))}
                />
                <DualInput label="공시이율"
                  value={v.usdInsuranceRate ?? 4.0} min={1.0} max={8.0} step={0.1} unit="%"
                  display={val => val.toFixed(1)} parse={parseFloat}
                  trackColor="bg-blue-400" decimalPlaces={1}
                  onChange={val => setV(prev => ({ ...prev, usdInsuranceRate: val }))}
                />
                <div className="bg-white rounded-xl p-3 border border-blue-100 flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-blue-800">환율 설정</p>
                  <DualInput label="현재 환율"
                    value={v.currentExchangeRate ?? 1350} min={1000} max={2000} step={10} unit="원/달러"
                    display={val => val.toLocaleString()} parse={s => parseFloat(s.replace(/,/g, ''))}
                    trackColor="bg-blue-400"
                    onChange={val => setV(prev => ({ ...prev, currentExchangeRate: val }))}
                  />
                  <DualInput label="만기 예상 환율"
                    value={v.usdInsuranceMaturityExchangeRate ?? 1400} min={1000} max={2500} step={10} unit="원/달러"
                    display={val => val.toLocaleString()} parse={s => parseFloat(s.replace(/,/g, ''))}
                    trackColor="bg-blue-600"
                    onChange={val => setV(prev => ({ ...prev, usdInsuranceMaturityExchangeRate: val }))}
                  />
                </div>
                <div className="bg-white rounded-xl border border-blue-100 p-3">
                  <p className="text-[10px] font-bold text-navy-800 mb-2">만기 환급금 활용</p>
                  <div className="flex gap-2">
                    {(['stock', 'bank', 'keep'] as const).map(opt => (
                      <button key={opt}
                        onClick={() => setV(prev => ({ ...prev, usdInsuranceMaturityReinvest: opt }))}
                        className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold transition-colors
                          ${(v.usdInsuranceMaturityReinvest ?? 'stock') === opt ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {opt === 'stock' ? '증권 재투자' : opt === 'bank' ? '은행 이체' : '보험 유지'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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

        {/* 월 보장성 보험료 */}
        <div className="animate-fade-in" style={{ animationDelay: '355ms', animationFillMode: 'both' }}>
          <DualInput
            label="월 보장성 보험료" sublabel="실손·암·종신 등 보장성 합계"
            tooltip="현재 내고 계신 보장성 보험료 전체 합산 금액입니다. 저축성 보험은 제외하고 순수 보장성만 입력해주세요."
            value={v.monthlyProtectionInsurance ?? 0} min={0} max={MAN * 200} step={MAN * 5} unit="만 원"
            display={v => Math.floor(v / MAN).toLocaleString()} parse={s => parseFloat(s.replace(/,/g, '')) * MAN}
            trackColor="bg-rose-500" onChange={set('monthlyProtectionInsurance')}
          />
          {(() => {
            const age = v.currentAge;
            const hints =
              age < 30 ? [{ label: '30대', avg: 18 }] :
              age < 40 ? [{ label: '30대', avg: 18 }, { label: '40대', avg: 26 }] :
              age < 50 ? [{ label: '40대', avg: 26 }, { label: '50대', avg: 35 }] :
              age < 60 ? [{ label: '50대', avg: 35 }, { label: '60대', avg: 42 }] :
              [{ label: '60대', avg: 42 }];
            return (
              <div className="mt-1.5 rounded-xl bg-slate-50 px-3 py-2 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">💡 나이대별 평균</span>
                  {hints.map((h) => (
                    <span key={h.label} className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {h.label} <span className="text-toss-blue font-bold">{h.avg}만원</span>
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">모르시면 0으로 두고 상담 시 확인해도 됩니다</p>
              </div>
            );
          })()}
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

        {/* ── 생애주기 설정 (Plus) ── */}
        </CollapsibleSection>

        <CollapsibleSection icon="🎯" title="목적자금 이벤트" subtitle="결혼·주택·교육비 등 목돈 지출">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100 flex flex-col gap-3">
            <p className="text-[10px] text-navy-400 leading-relaxed">
              은퇴 전 큰 지출이 예상되는 시점을 추가하면 더 현실적인 노후 시뮬레이션이 가능해요.
            </p>
            {(v.lifeEvents ?? []).map((ev, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-amber-800">{ev.age}세 · {ev.label}</p>
                  <p className="text-[10px] text-amber-600">-{Math.floor(ev.amount / MAN).toLocaleString()}만원 ({ev.source === 'bank' ? '은행' : ev.source === 'stock' ? '증권' : ev.source === 'insurance' ? '보험' : '자동'})</p>
                </div>
                <button onClick={() => setV(prev => ({ ...prev, lifeEvents: (prev.lifeEvents ?? []).filter((_, j) => j !== i) }))}
                  className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">✕</button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '결혼자금', age: 32, amount: 5000 * MAN },
                { label: '주택마련', age: 38, amount: 30000 * MAN },
                { label: '자녀교육', age: 45, amount: 5000 * MAN },
                { label: '자녀결혼', age: 55, amount: 5000 * MAN },
              ].map(preset => (
                <button key={preset.label}
                  onClick={() => setV(prev => ({ ...prev, lifeEvents: [...(prev.lifeEvents ?? []), { age: preset.age, amount: preset.amount, label: preset.label, source: 'auto' as const }].sort((a, b) => a.age - b.age) }))}
                  className="text-[10px] px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-200">
                  {preset.label} ({preset.age}세)
                </button>
              ))}
            </div>
            {/* 직접 추가 폼 */}
            <AddLifeEventForm
              minAge={v.currentAge}
              maxAge={90}
              onAdd={(ev) => setV(prev => ({
                ...prev,
                lifeEvents: [...(prev.lifeEvents ?? []), ev].sort((a, b) => a.age - b.age)
              }))}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon="🏠" title="생활비 설정" subtitle="은퇴 후 필요한 돈">
        {features.lifecycleSettings ? (
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
        ) : (
          <ProUpgradePrompt
            compact
            title="생애주기·의료비 세부 설정은 Plus"
            description="Basic은 표준 가정(활동종료 78세, 80세+ 의료비 반영)으로 계산합니다. 고객별로 조정하려면 Plus를 이용해 주세요."
          />
        )}

        {/* 가정 안내 */}
        </CollapsibleSection>

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

      <div className="sticky bottom-0 z-10 px-4 pb-10 pt-3 bg-white/95 backdrop-blur border-t border-navy-100">
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
