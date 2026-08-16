/**
 * Empty in development, where Vite proxies `/api` to the backend. Set
 * `VITE_API_URL` for builds served from a different origin than the API.
 */
const BASE_URL = import.meta.env['VITE_API_URL'] ?? '';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with ${response.status}`, response.status);
  }

  const data: unknown = await response.json();
  // oxlint-disable-next-line no-unsafe-type-assertion -- generic JSON reader
  return data as T;
}
