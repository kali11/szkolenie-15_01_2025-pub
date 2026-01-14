/**
 * API service for communicating with the Polar H10 Backend
 */

// Default API URL (fallback)
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Runtime config cache
let runtimeApiUrl: string | null = null;
let configPromise: Promise<string> | null = null;

/**
 * Get API base URL, fetching runtime config if needed
 * This allows the API URL to be set at container runtime via API_URL env var
 */
async function getApiBaseUrl(): Promise<string> {
  // If already cached, return immediately
  if (runtimeApiUrl) {
    return runtimeApiUrl;
  }

  // If config is being fetched, wait for it
  if (configPromise) {
    return configPromise;
  }

  // Only fetch runtime config in browser
  if (typeof window === 'undefined') {
    return DEFAULT_API_URL;
  }

  // Fetch runtime config from server
  configPromise = fetch('/api/config')
    .then((res) => {
      if (!res.ok) throw new Error('Config fetch failed');
      return res.json();
    })
    .then((config) => {
      const url = config.apiUrl || DEFAULT_API_URL;
      runtimeApiUrl = url;
      return url;
    })
    .catch(() => {
      // Fall back to default if config endpoint fails
      runtimeApiUrl = DEFAULT_API_URL;
      return DEFAULT_API_URL;
    });

  return configPromise;
}

// For synchronous access (will use default until config loads)
let API_BASE_URL = DEFAULT_API_URL;

// Pre-fetch config in browser
if (typeof window !== 'undefined') {
  getApiBaseUrl().then((url) => {
    API_BASE_URL = url;
  });
}

export interface HeartRateReading {
  id: number;
  sensor_timestamp: number;
  bpm: number;
  rr_interval: number;
  energy: number | null;
  created_at: string;
}

export interface HeartRateStats {
  count: number;
  avg_bpm: number | null;
  min_bpm: number | null;
  max_bpm: number | null;
  avg_rr_interval: number | null;
  time_range_start: string | null;
  time_range_end: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Get API URL (will use runtime config if available)
  const apiUrl = await getApiBaseUrl();
  const url = `${apiUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get paginated list of heart rate readings
 */
export async function getHeartRateReadings(
  minutes?: number,
  page?: number
): Promise<PaginatedResponse<HeartRateReading>> {
  const params = new URLSearchParams();
  if (minutes) params.append('minutes', minutes.toString());
  if (page) params.append('page', page.toString());
  
  const queryString = params.toString();
  const endpoint = `/api/heartrate/${queryString ? `?${queryString}` : ''}`;
  
  return fetchApi<PaginatedResponse<HeartRateReading>>(endpoint);
}

/**
 * Get the latest heart rate reading
 */
export async function getLatestReading(): Promise<HeartRateReading> {
  return fetchApi<HeartRateReading>('/api/heartrate/latest/');
}

/**
 * Get heart rate statistics
 */
export async function getHeartRateStats(minutes?: number): Promise<HeartRateStats> {
  const params = new URLSearchParams();
  if (minutes) params.append('minutes', minutes.toString());
  
  const queryString = params.toString();
  const endpoint = `/api/heartrate/stats/${queryString ? `?${queryString}` : ''}`;
  
  return fetchApi<HeartRateStats>(endpoint);
}

/**
 * Get a single heart rate reading by ID
 */
export async function getHeartRateReading(id: number): Promise<HeartRateReading> {
  return fetchApi<HeartRateReading>(`/api/heartrate/${id}/`);
}

