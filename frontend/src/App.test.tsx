import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { render } from './test/render';

function stubFetch() {
  const events: unknown[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn((_path: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const { body } = init;
        if (typeof body !== 'string') throw new Error('expected a JSON string body');

        const created = { id: '1', ...(JSON.parse(body) as Record<string, unknown>) };
        events.push(created);
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(created),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(events),
      });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('creates an event and shows it on the board', async () => {
    stubFetch();
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no events/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add event/i }));

    await user.type(screen.getByLabelText(/title/i), 'Barista convention');
    await user.type(screen.getByLabelText(/description/i), 'Make the best mochas.');
    await user.type(screen.getByLabelText(/date/i), '2026-10-01');
    await user.clear(screen.getByLabelText(/capacity/i));
    await user.type(screen.getByLabelText(/capacity/i), '25');
    await user.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(screen.getByText('Barista convention')).toBeInTheDocument();
    });
  });
});
