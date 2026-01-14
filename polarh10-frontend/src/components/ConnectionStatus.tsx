'use client';

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ConnectionStatus({
  isConnected,
  isLoading,
  error,
  onRefresh,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isLoading
              ? 'bg-[var(--warning)] animate-pulse'
              : isConnected
              ? 'bg-[var(--success)]'
              : 'bg-[var(--danger)]'
          }`}
        />
        <span className="text-sm text-[var(--foreground-muted)]">
          {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Error message */}
      {error && !isLoading && (
        <span className="text-sm text-[var(--danger)]">{error}</span>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="ml-auto px-3 py-1.5 text-sm rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground-muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Refreshing
          </span>
        ) : (
          'Refresh'
        )}
      </button>
    </div>
  );
}

