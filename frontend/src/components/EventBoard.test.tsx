import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { EventBoard } from './EventBoard';

function stubFetch(json: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status < 400,
      status,
      json: () => Promise.resolve(json),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EventBoard', () => {
  it('renders a row per event in the order the API returned them', async () => {
    stubFetch([
      {
        id: '1',
        title: 'Barista convention',
        description: 'Make the best mochas.',
        starts_at: '2026-09-01T19:00:00Z',
        max_capacity: 25,
      },
      {
        id: '2',
        title: 'Latte art championship',
        description: 'Pour the best rosettas.',
        starts_at: '2026-10-01T19:00:00Z',
        max_capacity: 10,
      },
    ]);

    render(<EventBoard />);

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(4); // header + 2 events + add-event footer
    });

    const rows = screen.getAllByRole('row').slice(1, -1);
    expect(rows[0]).toHaveTextContent('Barista convention');
    expect(rows[1]).toHaveTextContent('Latte art championship');
  });

  it('shows an explanatory row instead of a blank table when there are no events', async () => {
    stubFetch([]);

    render(<EventBoard />);

    await waitFor(() => {
      expect(screen.getByText(/no events/i)).toBeInTheDocument();
    });
  });

  it('shows the API detail message when the load fails', async () => {
    stubFetch({ detail: 'the event store is unavailable', code: 'unavailable' }, 503);

    render(<EventBoard />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('the event store is unavailable');
    });
  });

  it('shows skeleton rows while the events are loading', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

    render(<EventBoard />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
