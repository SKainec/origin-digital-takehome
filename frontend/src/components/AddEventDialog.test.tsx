import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { AddEventDialog } from './AddEventDialog';

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          id: '1',
          title: 'Barista convention',
          description: 'Make the best mochas.',
          starts_at: '2026-10-01T00:00:00Z',
          max_capacity: 25,
        }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AddEventDialog', () => {
  it('opens the form on trigger and closes it again once the event is created', async () => {
    stubFetch();
    const user = userEvent.setup();

    render(<AddEventDialog />);

    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add event/i }));
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/title/i), 'Barista convention');
    await user.type(screen.getByLabelText(/description/i), 'Make the best mochas.');
    await user.type(screen.getByLabelText(/date/i), '2026-10-01');
    await user.clear(screen.getByLabelText(/capacity/i));
    await user.type(screen.getByLabelText(/capacity/i), '25');
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => {
      expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    });
  });
});
