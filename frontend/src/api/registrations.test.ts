import { afterEach, describe, expect, it, vi } from 'vitest';

import { waitFor } from '@testing-library/react';

import { renderHook } from '@/test/render';

import { ApiError } from './client';
import {
  listRegistrations,
  registerForEvent,
  registrationErrorMessage,
  unregisterFromEvent,
  useEventRegistrations,
} from './registrations';

const ID = '11111111-1111-4111-8111-111111111111';

function stubFetch(json: unknown, status = 200) {
  const fetchMock = vi.fn<(path: string, init: RequestInit) => Promise<unknown>>();
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(json) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listRegistrations', () => {
  it('reads the emails registered for one event', async () => {
    const fetchMock = stubFetch(['alex@example.com', 'sarah@example.com']);

    await expect(listRegistrations(ID)).resolves.toEqual(['alex@example.com', 'sarah@example.com']);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/events/${ID}/registrations`);
  });
});

describe('registerForEvent', () => {
  it('posts the email and returns the address the server normalized', async () => {
    const fetchMock = stubFetch({ email: 'sarah@example.com' }, 201);

    await expect(registerForEvent(ID, 'Sarah@Example.COM')).resolves.toBe('sarah@example.com');

    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe(`/api/events/${ID}/registrations`);
    expect(init?.method).toBe('POST');
    const body = typeof init?.body === 'string' ? init.body : '';
    expect(JSON.parse(body)).toEqual({ email: 'Sarah@Example.COM' });
  });
});

describe('unregisterFromEvent', () => {
  it('encodes the email into the path so an @ or + survives', async () => {
    const fetchMock = stubFetch(undefined, 204);

    await unregisterFromEvent(ID, 'sarah+events@example.com');

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `/api/events/${ID}/registrations/sarah%2Bevents%40example.com`,
    );
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });
});

describe('useEventRegistrations', () => {
  it('exposes the registrations once the query settles', async () => {
    stubFetch(['sarah@example.com']);

    const { result } = renderHook(() => useEventRegistrations(ID));

    await waitFor(() => {
      expect(result.current.data).toEqual(['sarah@example.com']);
    });
  });
});

describe('registrationErrorMessage', () => {
  it('turns each business rule into wording a registrant can act on', () => {
    expect(
      registrationErrorMessage(new ApiError('event x is at its capacity of 1', 409, 'event_full')),
    ).toBe('This event is full.');
    expect(
      registrationErrorMessage(new ApiError('a@b.com is already', 409, 'already_registered')),
    ).toBe('That email is already registered.');
    expect(
      registrationErrorMessage(new ApiError('event x started at y', 409, 'event_in_past')),
    ).toBe('This event has already started.');
  });

  it('falls back to the server wording, then a generic message, then nothing', () => {
    expect(
      registrationErrorMessage(new ApiError('the event store is unavailable', 503, 'unavailable')),
    ).toBe('the event store is unavailable');
    expect(registrationErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Something went wrong. Please try again.',
    );
    expect(registrationErrorMessage(null)).toBeUndefined();
  });
});
