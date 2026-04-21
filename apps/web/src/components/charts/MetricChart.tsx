'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  time: string;
  value: number;
}

interface MetricChartProps {
  data: DataPoint[];
  color: string;
  label: string;
  currentValue: number | null;
  unit?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-xs font-mono">
      <span className="text-on-surface">{payload[0].value.toFixed(1)}%</span>
    </div>
  );
}

export default function MetricChart({ data, color, label, currentValue, unit = '%' }: MetricChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest font-headline" style={{ color }}>
            {label}
          </p>
          <p className="text-2xl font-black text-on-surface font-headline tracking-tighter">
            {currentValue !== null ? `${currentValue.toFixed(1)}${unit}` : '—'}
          </p>
        </div>
      </div>

      <div className="h-24">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-end gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: '40%',
                  backgroundColor: `${color}20`,
                  borderTop: `1px solid ${color}40`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {!hasData && (
        <p className="text-xs text-outline mt-3 text-center">Connect agent for live data</p>
      )}
    </div>
  );
}
