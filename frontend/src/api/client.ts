/**
 * Empty in development, where Vite proxies `/api` to the backend. Set
 * `VITE_API_URL` for builds served from a different origin than the API.
 */
const BASE_URL = import.meta.env['VITE_API_URL'] ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * The API answers every failure with `{detail, code}`, so one branch here gives
 * the whole app the server's own wording instead of a status number.
 */
async function toApiError(response: Response, path: string): Promise<ApiError> {
  const fallback = `Request to ${path} failed with ${response.status}`;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return new ApiError(fallback, response.status);
  }

  if (!isRecord(payload)) return new ApiError(fallback, response.status);

  const { detail, code } = payload;
  return new ApiError(
    typeof detail === 'string' ? detail : fallback,
    response.status,
    typeof code === 'string' ? code : undefined,
  );
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw await toApiError(response, path);
  }

  const data: unknown = await response.json();
  // oxlint-disable-next-line no-unsafe-type-assertion -- generic JSON reader
  return data as T;
}
