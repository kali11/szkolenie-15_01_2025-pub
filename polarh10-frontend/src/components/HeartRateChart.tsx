'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { HeartRateReading } from '@/lib/api';

interface HeartRateChartProps {
  data: HeartRateReading[];
  avgBpm?: number | null;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  bpm: number;
  rr_interval: number;
}

export function HeartRateChart({ data, avgBpm }: HeartRateChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return [...data]
      .reverse()
      .map((reading) => ({
        time: format(new Date(reading.created_at), 'HH:mm:ss'),
        timestamp: new Date(reading.created_at).getTime(),
        bpm: reading.bpm,
        rr_interval: reading.rr_interval,
      }));
  }, [data]);

  const { minBpm, maxBpm } = useMemo(() => {
    if (chartData.length === 0) return { minBpm: 60, maxBpm: 120 };
    const bpms = chartData.map((d) => d.bpm);
    const min = Math.min(...bpms);
    const max = Math.max(...bpms);
    const padding = Math.max(10, (max - min) * 0.2);
    return {
      minBpm: Math.max(0, Math.floor(min - padding)),
      maxBpm: Math.ceil(max + padding),
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-[var(--foreground-muted)]">
            No heart rate data available
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-2">
            Start the producer to see real-time data
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff3366" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#ff3366" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#ff3366" stopOpacity={0} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          stroke="var(--foreground-muted)"
          tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
          tickLine={{ stroke: 'var(--border)' }}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          domain={[minBpm, maxBpm]}
          stroke="var(--foreground-muted)"
          tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
          tickLine={{ stroke: 'var(--border)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--background-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
          labelStyle={{ color: 'var(--foreground-muted)' }}
          itemStyle={{ color: 'var(--accent-primary)' }}
          formatter={(value, name) => {
            if (name === 'bpm') return [`${value} BPM`, 'Heart Rate'];
            return [String(value), name];
          }}
        />
        {avgBpm && (
          <ReferenceLine
            y={avgBpm}
            stroke="var(--foreground-muted)"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
            label={{
              value: `Avg: ${avgBpm}`,
              position: 'right',
              fill: 'var(--foreground-muted)',
              fontSize: 12,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="bpm"
          stroke="#ff3366"
          strokeWidth={2}
          fill="url(#bpmGradient)"
          filter="url(#glow)"
          dot={false}
          isAnimationActive={false}
          activeDot={{
            r: 6,
            fill: '#ff3366',
            stroke: '#fff',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

