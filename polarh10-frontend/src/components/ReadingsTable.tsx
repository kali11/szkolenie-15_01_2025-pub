'use client';

import { format } from 'date-fns';
import { HeartRateReading } from '@/lib/api';

interface ReadingsTableProps {
  readings: HeartRateReading[];
  maxRows?: number;
}

export function ReadingsTable({ readings, maxRows = 10 }: ReadingsTableProps) {
  const displayReadings = readings.slice(0, maxRows);

  if (displayReadings.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--foreground-muted)]">
        No readings to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              Time
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              BPM
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              RR Interval
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              ID
            </th>
          </tr>
        </thead>
        <tbody>
          {displayReadings.map((reading, index) => (
            <tr
              key={reading.id}
              className={`border-b border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors ${
                index === 0 ? 'bg-[var(--accent-primary)]/5' : ''
              }`}
            >
              <td className="py-3 px-4 text-sm">
                {format(new Date(reading.created_at), 'HH:mm:ss.SSS')}
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono">
                <span
                  className={`font-semibold ${
                    reading.bpm >= 140
                      ? 'text-[var(--danger)]'
                      : reading.bpm >= 100
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--success)]'
                  }`}
                >
                  {reading.bpm}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono text-[var(--foreground-muted)]">
                {reading.rr_interval} ms
              </td>
              <td className="py-3 px-4 text-sm text-right font-mono text-[var(--foreground-muted)]">
                #{reading.id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {readings.length > maxRows && (
        <div className="text-center py-3 text-sm text-[var(--foreground-muted)]">
          Showing {maxRows} of {readings.length} readings
        </div>
      )}
    </div>
  );
}

