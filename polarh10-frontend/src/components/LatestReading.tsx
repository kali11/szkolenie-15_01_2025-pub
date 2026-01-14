'use client';

import { format } from 'date-fns';
import { HeartRateReading } from '@/lib/api';

interface LatestReadingProps {
  reading: HeartRateReading | null;
  isConnected: boolean;
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function getBpmZone(bpm: number): { label: string; color: string } {
  if (bpm < 60) return { label: 'Resting', color: 'var(--success)' };
  if (bpm < 100) return { label: 'Normal', color: 'var(--success)' };
  if (bpm < 140) return { label: 'Moderate', color: 'var(--warning)' };
  if (bpm < 170) return { label: 'Vigorous', color: 'var(--accent-primary)' };
  return { label: 'Maximum', color: 'var(--danger)' };
}

export function LatestReading({ reading, isConnected }: LatestReadingProps) {
  const zone = reading ? getBpmZone(reading.bpm) : null;

  return (
    <div className="bg-[var(--background-card)] rounded-2xl p-6 border border-[var(--border)] relative overflow-hidden">
      {/* Background gradient effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: reading
            ? `radial-gradient(circle at 50% 0%, ${zone?.color} 0%, transparent 70%)`
            : 'none',
        }}
      />

      {/* Connection status */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
            }`}
          />
          <span className="text-sm text-[var(--foreground-muted)]">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
        {reading && (
          <span className="text-xs text-[var(--foreground-muted)]">
            {format(new Date(reading.created_at), 'HH:mm:ss')}
          </span>
        )}
      </div>

      {/* Main BPM display */}
      <div className="text-center relative">
        <div className="flex items-center justify-center gap-4 mb-2">
          <HeartIcon
            className={`w-12 h-12 text-[var(--accent-primary)] ${
              isConnected && reading ? 'animate-pulse-heart' : ''
            }`}
          />
        </div>

        {reading ? (
          <>
            <div className="flex items-baseline justify-center gap-2">
              <span
                className="text-7xl font-bold tracking-tight"
                style={{ color: zone?.color }}
              >
                {reading.bpm}
              </span>
              <span className="text-2xl text-[var(--foreground-muted)]">BPM</span>
            </div>

            <div
              className="mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${zone?.color}20`,
                color: zone?.color,
              }}
            >
              {zone?.label}
            </div>

            {/* RR Interval */}
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--foreground-muted)]">RR Interval</p>
                  <p className="text-lg font-semibold">
                    {reading.rr_interval} <span className="text-[var(--foreground-muted)] text-sm">ms</span>
                  </p>
                </div>
                <div>
                  <p className="text-[var(--foreground-muted)]">Heart Rate Variability</p>
                  <p className="text-lg font-semibold">
                    {(60000 / reading.rr_interval).toFixed(1)} <span className="text-[var(--foreground-muted)] text-sm">calc BPM</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8">
            <p className="text-[var(--foreground-muted)] text-lg">
              Waiting for data...
            </p>
            <p className="text-sm text-[var(--foreground-muted)] mt-2">
              Start the heart rate producer to see readings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

