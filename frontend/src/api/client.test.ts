import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from './client';

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

  it('reads a validation failure into per-field messages', async () => {
    stubFetch(
      {
        detail: [
          {
            type: 'string_too_short',
            loc: ['body', 'title'],
            msg: 'String should have at least 1 character',
          },
          {
            type: 'greater_than_equal',
            loc: ['body', 'max_capacity'],
            msg: 'Input should be greater than or equal to 1',
          },
        ],
      },
      422,
    );

    await expect(apiFetch('/api/events')).rejects.toMatchObject({
      status: 422,
      message: 'String should have at least 1 character',
      fieldErrors: {
        title: 'String should have at least 1 character',
        max_capacity: 'Input should be greater than or equal to 1',
      },
    });
  });

  it('falls back to the path and status when the body carries no detail', async () => {
    stubFetch('<html>gateway</html>', 502);

    await expect(apiFetch('/api/events')).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      message: 'Request to /api/events failed with 502',
      code: undefined,
    });
  });

  it('falls back the same way when the body is not JSON at all', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<() => Promise<unknown>>().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
      }),
    );

    await expect(apiFetch('/api/events')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Request to /api/events failed with 500',
    });
  });
});

describe('apiFetch with no response body', () => {
  it('resolves a 204 delete instead of failing to parse an empty body', async () => {
    const fetchMock = vi.fn<(path: string, init: RequestInit) => Promise<unknown>>();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiFetch<void>('/api/events/7/registrations/a%40b.com', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
