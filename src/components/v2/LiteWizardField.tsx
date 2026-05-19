interface Props {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  suffix: string;
  min: number;
  max: number;
  step?: number;
}

export default function LiteWizardField({
  label,
  hint,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
}: Props) {
  const clamped = Math.min(max, Math.max(min, value || 0));

  return (
    <div>
      <p className="text-[13px] font-semibold text-toss-ink">{label}</p>
      {hint ? <p className="mt-1 text-[12px] leading-relaxed text-toss-sub">{hint}</p> : null}
      <div className="mt-4 flex items-baseline justify-end gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1 border-0 border-b-2 border-toss-line bg-transparent py-1 text-right text-[28px] font-bold leading-none tracking-tight text-toss-ink outline-none transition-colors focus:border-toss-blue"
          autoFocus
        />
        <span className="shrink-0 pb-0.5 text-[14px] font-medium text-toss-sub">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-5 h-2 w-full rounded-full bg-toss-line accent-[#3182f6]"
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-toss-sub">
        <span>{min.toLocaleString()}{suffix === '세' ? '세' : ''}</span>
        <span>{max.toLocaleString()}{suffix === '세' ? '세' : suffix === '만 원' ? '만' : ''}</span>
      </div>
    </div>
  );
}
