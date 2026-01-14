'use client';

import { useState } from 'react';
import { useHeartRate } from '@/hooks/useHeartRate';
import {
  HeartRateChart,
  StatsCard,
  LatestReading,
  ConnectionStatus,
  ReadingsTable,
} from '@/components';

// Icons as inline SVGs
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

const TIME_RANGES = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
];

export default function Dashboard() {
  const [historyMinutes, setHistoryMinutes] = useState(5);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const { latestReading, stats, history, isLoading, error, isConnected, refresh } =
    useHeartRate({
      refreshInterval: 1000,
      historyMinutes,
      enabled: isPollingEnabled,
    });

  return (
    <div className="min-h-screen grid-pattern">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Polar H10</h1>
                <p className="text-xs text-[var(--foreground-muted)]">Heart Rate Monitor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPollingEnabled(!isPollingEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isPollingEnabled
                    ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                }`}
              >
                {isPollingEnabled ? (
                  <>
                    <PauseIcon className="w-4 h-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    Disabled
                  </>
                )}
              </button>
              <ConnectionStatus
                isConnected={isConnected}
                isLoading={isLoading}
                error={error}
                onRefresh={refresh}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time range selector */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--foreground-muted)]">Time range:</span>
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setHistoryMinutes(range.value)}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    historyMinutes === range.value
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Average BPM"
            value={stats?.avg_bpm ?? null}
            unit="BPM"
            icon={<HeartIcon className="w-5 h-5" />}
            variant="primary"
          />
          <StatsCard
            title="Min BPM"
            value={stats?.min_bpm ?? null}
            unit="BPM"
            icon={<ChartIcon className="w-5 h-5" />}
            variant="success"
          />
          <StatsCard
            title="Max BPM"
            value={stats?.max_bpm ?? null}
            unit="BPM"
            icon={<ActivityIcon className="w-5 h-5" />}
            variant="warning"
          />
          <StatsCard
            title="Readings"
            value={stats?.count ?? 0}
            icon={<DatabaseIcon className="w-5 h-5" />}
            subtitle={`Last ${historyMinutes} min`}
          />
        </div>

        {/* Main grid: Chart + Latest reading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-[var(--background-card)] rounded-2xl p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ChartIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                Heart Rate History
              </h3>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <ClockIcon className="w-4 h-4" />
                Last {historyMinutes} minutes
              </div>
            </div>
            <div className="h-[300px]">
              <HeartRateChart data={history} avgBpm={stats?.avg_bpm} />
            </div>
          </div>

          {/* Latest reading */}
          <div className="lg:col-span-1">
            <LatestReading reading={latestReading} isConnected={isConnected} />
          </div>
        </div>

        {/* Recent readings table */}
        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              Recent Readings
            </h3>
          </div>
          <ReadingsTable readings={history} maxRows={10} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--foreground-muted)]">
            <p>Polar H10 Heart Rate Dashboard • Training Course Demo</p>
            <p>
              Backend:{' '}
              <code className="px-2 py-1 rounded bg-[var(--background-secondary)] font-mono text-xs">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
