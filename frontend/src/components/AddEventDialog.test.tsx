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

function stubValidationFailure() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          detail: [
            {
              type: 'string_too_short',
              loc: ['body', 'title'],
              msg: 'String should have at least 1 character',
            },
          ],
        }),
    }),
  );
}

async function openAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /add event/i }));
  await user.type(screen.getByLabelText(/title/i), 'Barista convention');
  await user.type(screen.getByLabelText(/date/i), '2026-10-01');
  await user.click(screen.getByRole('button', { name: 'Create event' }));
}

describe('AddEventDialog', () => {
  it('reports a failure that names no field, rather than appearing to do nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ detail: 'the event store is unavailable' }),
      }),
    );
    const user = userEvent.setup();

    render(<AddEventDialog />);
    await openAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('the event store is unavailable');
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not carry a rejected field into the next time it is opened', async () => {
    stubValidationFailure();
    const user = userEvent.setup();

    render(<AddEventDialog />);
    await openAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');
    });

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /add event/i }));

    expect(screen.getByLabelText(/title/i)).not.toHaveAttribute('aria-invalid');
  });

  it('does not create the event twice when the button is clicked twice', async () => {
    const fetchMock = vi.fn<() => Promise<unknown>>().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<AddEventDialog />);
    await openAndSubmit(user);
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and marks the field the API rejected', async () => {
    stubValidationFailure();
    const user = userEvent.setup();

    render(<AddEventDialog />);

    await user.click(screen.getByRole('button', { name: /add event/i }));
    await user.type(screen.getByLabelText(/title/i), '   ');
    await user.type(screen.getByLabelText(/date/i), '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveAccessibleDescription(
        'String should have at least 1 character',
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

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
