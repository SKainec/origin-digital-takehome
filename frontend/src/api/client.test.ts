import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch } from './client';

function stubFetch(json: unknown, status: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn<() => Promise<unknown>>().mockResolvedValue({
      ok: status < 400,
      status,
      json: () => Promise.resolve(json),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('surfaces the API detail and code rather than a generic message', async () => {
    stubFetch({ detail: 'no event with id 7', code: 'event_not_found' }, 404);

    await expect(apiFetch('/api/events/7')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'no event with id 7',
      code: 'event_not_found',
    });
  });

  it('falls back to the status when the body carries no detail', async () => {
    stubFetch('<html>gateway</html>', 502);

    await expect(apiFetch('/api/events')).rejects.toThrow(ApiError);
  });
});
