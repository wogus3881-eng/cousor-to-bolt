import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationResult } from '../lib/calculator';
import { formatKRW } from '../lib/calculator';

interface Props {
  result: SimulationResult;
}

/** 만 원 단위로 반올림 (차트 툴팁용) */
function formatManWon(n: number) {
  const man = Math.round(n / 10000);
  if (man >= 10000) return `${(man / 10000).toFixed(1)}억 원`;
  return `${man.toLocaleString()}만 원`;
}

export default function LiteResultCharts({ result }: Props) {
  const { yearRows, inputs, inflationAdjustedMonthlyExpense, pensionAtRetirement, lifeExpectancy } = result;
  const start = inputs.currentAge;
  const end = lifeExpectancy;

  const raw = yearRows.filter((r) => r.age >= start && r.age <= end);
  const step = raw.length > 36 ? 2 : 1;
  const balanceSeries = raw
    .filter((_, i) => i % step === 0)
    .map((r) => ({
      age: r.age,
      억: Math.round((r.balance / 1e8) * 10) / 10,
      balance: r.balance,
    }));

  const compareData = [
    {
      name: '국민연금(세전)',
      월액: Math.round(pensionAtRetirement),
    },
    {
      name: '필요 생활비',
      월액: Math.round(inflationAdjustedMonthlyExpense),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
        <p className="text-[13px] font-bold text-toss-ink">나이별 예상 자산 (참고)</p>
        <p className="mt-1 text-[11px] leading-relaxed text-toss-sub">
          세전 잔고 기준이며, 단순화된 곡선입니다. 실제와 다를 수 있어요.
        </p>
        <div className="mt-3 h-[200px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="liteBalFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3182f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3182f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" vertical={false} />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 10, fill: '#6b7684' }}
                tickFormatter={(v) => `${v}세`}
                interval="preserveStartEnd"
              />
              <YAxis
                width={36}
                tick={{ fontSize: 10, fill: '#6b7684' }}
                tickFormatter={(v) => `${v}억`}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e5e8eb',
                  fontSize: 12,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
                formatter={(value: number, _name: string, item: { payload?: { balance?: number } }) => {
                  const bal = item?.payload?.balance;
                  const won = bal ?? Number(value) * 1e8;
                  return [formatKRW(won), '예상 자산'];
                }}
                labelFormatter={(age) => `${age}세`}
              />
              <Area
                type="monotone"
                dataKey="억"
                name="예상 자산(억)"
                stroke="#3182f6"
                strokeWidth={2}
                fill="url(#liteBalFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[20px] bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
        <p className="text-[13px] font-bold text-toss-ink">은퇴 직후 월 단위 비교 (참고)</p>
        <p className="mt-1 text-[11px] leading-relaxed text-toss-sub">
          국민연금은 세전 추정, 생활비는 물가 반영 추정이에요. 세후·실수령과 다를 수 있어요.
        </p>
        <div className="mt-3 h-[180px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6b7684' }}
                tickFormatter={(v) => formatManWon(v)}
              />
              <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11, fill: '#191f28' }} />
              <Tooltip
                formatter={(v: number) => formatKRW(v)}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e5e8eb',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="월액" radius={[0, 8, 8, 0]} maxBarSize={32}>
                {compareData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#3182f6' : '#8b95a1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
