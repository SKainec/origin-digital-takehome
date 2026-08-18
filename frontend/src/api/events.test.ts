import { waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/render';

import { ApiError } from './client';
import {
  createEvent,
  eventErrorMessage,
  eventFieldErrors,
  listEvents,
  updateEvent,
  useEvents,
} from './events';

const ID = '11111111-1111-4111-8111-111111111111';

const EVENT_RESPONSE = {
  id: ID,
  title: 'Barista convention',
  description: 'Make the best mochas.',
  starts_at: '2026-10-01T19:00:00Z',
  max_capacity: 25,
};

const EVENT_INPUT = {
  title: 'Barista convention',
  description: 'Make the best mochas.',
  startsAt: new Date('2026-10-01T19:00:00Z'),
  maxCapacity: 25,
};

type FetchMock = ReturnType<typeof stubFetch>;

function response(json: unknown, status: number) {
  return { ok: status < 400, status, json: () => Promise.resolve(json) };
}

function stubFetch(json: unknown, status = 200) {
  const fetchMock = vi.fn<(path: string, init: RequestInit) => Promise<unknown>>();
  fetchMock.mockResolvedValue(response(json, status));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The one request the mock received, with its JSON body already parsed. */
function requestOf(fetchMock: FetchMock) {
  const call = fetchMock.mock.calls[0];
  if (call === undefined) throw new Error('fetch was never called');
  const [path, init] = call;

  const { body } = init;
  if (body !== undefined && typeof body !== 'string') {
    throw new Error('expected a JSON string body');
  }

  return {
    path,
    method: init.method,
    body: body === undefined ? undefined : (JSON.parse(body) as unknown),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listEvents', () => {
  it('maps the wire shape to camelCase, with startsAt as a Date', async () => {
    stubFetch([EVENT_RESPONSE]);

    const events = await listEvents();

    expect(events).toEqual([
      {
        id: ID,
        title: 'Barista convention',
        description: 'Make the best mochas.',
        startsAt: new Date('2026-10-01T19:00:00Z'),
        maxCapacity: 25,
      },
    ]);
  });
});

describe('createEvent', () => {
  it('posts the event with snake_case keys and an ISO date', async () => {
    const fetchMock = stubFetch(EVENT_RESPONSE, 201);

    const created = await createEvent(EVENT_INPUT);

    expect(requestOf(fetchMock)).toEqual({
      path: '/api/events',
      method: 'POST',
      body: {
        title: 'Barista convention',
        description: 'Make the best mochas.',
        starts_at: '2026-10-01T19:00:00.000Z',
        max_capacity: 25,
      },
    });
    expect(created.startsAt).toEqual(new Date('2026-10-01T19:00:00Z'));
  });
});

describe('updateEvent', () => {
  it('puts the full event to the id path', async () => {
    const fetchMock = stubFetch({ ...EVENT_RESPONSE, title: 'Latte art championship' });

    const updated = await updateEvent(ID, { ...EVENT_INPUT, title: 'Latte art championship' });

    expect(requestOf(fetchMock)).toEqual({
      path: `/api/events/${ID}`,
      method: 'PUT',
      body: {
        title: 'Latte art championship',
        description: 'Make the best mochas.',
        starts_at: '2026-10-01T19:00:00.000Z',
        max_capacity: 25,
      },
    });
    expect(updated.title).toBe('Latte art championship');
  });
});

describe('eventFieldErrors', () => {
  it('maps the wire field names a validation failure reports to form fields', () => {
    const error = new ApiError('nope', 422, undefined, {
      title: 'String should have at least 1 character',
      starts_at: 'Input should have timezone info',
      max_capacity: 'Input should be greater than or equal to 1',
    });

    expect(eventFieldErrors(error)).toEqual({
      title: 'String should have at least 1 character',
      startsAt: 'Input should have timezone info',
      maxCapacity: 'Input should be greater than or equal to 1',
    });
  });

  it('has nothing to report for a failure that is not a validation error', () => {
    expect(eventFieldErrors(new ApiError('gone', 404))).toBeUndefined();
    expect(eventFieldErrors(new Error('offline'))).toBeUndefined();
    expect(eventFieldErrors(null)).toBeUndefined();
  });

  it('has nothing to report when the failure names no field this form owns', () => {
    const modelLevel = new ApiError('nope', 422, undefined, {
      body: 'Value error, the event must end after it starts',
    });

    expect(eventFieldErrors(modelLevel)).toBeUndefined();
  });
});

describe('eventErrorMessage', () => {
  it('gives the API its own wording for a failure no field owns', () => {
    expect(eventErrorMessage(new ApiError('the event store is unavailable', 503))).toBe(
      'the event store is unavailable',
    );
  });

  it('falls back to its own wording when the failure came from the network', () => {
    expect(eventErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('stays quiet when there is no failure, or the fields already explain it', () => {
    expect(eventErrorMessage(null)).toBeUndefined();
    expect(
      eventErrorMessage(new ApiError('nope', 422, undefined, { title: 'too short' })),
    ).toBeUndefined();
  });
});

describe('useEvents', () => {
  it('returns the mapped events once the query settles', async () => {
    stubFetch([EVENT_RESPONSE]);

    const { result } = renderHook(() => useEvents());

    await waitFor(() => {
      expect(result.current.data).toEqual([
        {
          id: ID,
          title: 'Barista convention',
          description: 'Make the best mochas.',
          startsAt: new Date('2026-10-01T19:00:00Z'),
          maxCapacity: 25,
        },
      ]);
    });
  });
});
