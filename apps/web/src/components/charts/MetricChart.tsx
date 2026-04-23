'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface MetricChartPoint {
  time: string;
  value: number;
}

interface MetricChartProps {
  data: MetricChartPoint[];
  color: string;
  label: string;
  description?: string;
  currentValue: number | null;
  unit?: string;
  yMin?: number;
  yMax?: number;
  formatTooltip?: (value: number) => string;
}

function ChartTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: { value: number; payload: MetricChartPoint }[];
  format: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as MetricChartPoint;
  const v = Number(payload[0].value);
  return (
    <div className="rounded-lg border border-outline-variant/25 bg-surface-container-highest/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="font-mono text-on-surface-variant">{row.time}</p>
      <p className="mt-1 font-headline font-bold text-on-surface">{format(v)}</p>
    </div>
  );
}

export default function MetricChart({
  data,
  color,
  label,
  description,
  currentValue,
  unit = '%',
  yMin = 0,
  yMax = 100,
  formatTooltip = (v) => `${v.toFixed(1)}${unit}`,
}: MetricChartProps) {
  const hasData = data.length > 0;
  const gradId = `fill-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/80 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full opacity-25 blur-3xl"
        style={{ background: color }}
      />
      <div className="relative flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
            {label}
          </p>
          <p className="font-headline text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
            {currentValue !== null ? `${currentValue.toFixed(1)}${unit}` : '—'}
          </p>
          {description ? (
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-on-surface-variant">{description}</p>
          ) : null}
        </div>
        {hasData && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
            Last {data.length} samples
          </span>
        )}
      </div>

      <div className="relative mt-6 h-44 sm:h-52">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#9e96a9', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={32}
              />
              <YAxis
                domain={[yMin, yMax]}
                width={36}
                tick={{ fill: '#9e96a9', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<ChartTooltip format={formatTooltip} />} cursor={{ stroke: `${color}55` }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                isAnimationActive={data.length < 40}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/40">
            <div className="mb-3 flex gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all"
                  style={{
                    height: `${18 + (i % 5) * 6}%`,
                    background: `linear-gradient(to top, ${color}22, ${color}66)`,
                  }}
                />
              ))}
            </div>
            <p className="text-center text-xs text-on-surface-variant">No history yet — charts fill as the agent reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}
