import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { EditEventDialog } from './EditEventDialog';

const EVENT = {
  id: '1',
  title: 'Barista convention',
  description: 'Make the best mochas.',
  startsAt: new Date(2026, 9, 1),
  maxCapacity: 25,
};

function stubFetch() {
  const fetchMock = vi.fn<(path: string, init: RequestInit) => Promise<unknown>>();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EditEventDialog', () => {
  it('returns focus to the row that opened it, so keyboard users keep their place', async () => {
    stubFetch();
    const user = userEvent.setup();

    render(<EditEventDialog event={EVENT} />);

    const trigger = screen.getByRole('button', { name: /edit/i });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('keeps the dialog open and marks the field the API rejected', async () => {
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
    const user = userEvent.setup();

    render(<EditEventDialog event={EVENT} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), '   ');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveAccessibleDescription(
        'String should have at least 1 character',
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not carry a rejected field into the next time it is opened', async () => {
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
    const user = userEvent.setup();

    render(<EditEventDialog event={EVENT} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), '   ');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveAccessibleDescription(
        'String should have at least 1 character',
      );
    });

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByLabelText(/title/i)).toHaveValue('Barista convention');
    expect(screen.getByLabelText(/title/i)).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('String should have at least 1 character')).not.toBeInTheDocument();
  });

  it('puts the edited event to its own id, then closes', async () => {
    const fetchMock = stubFetch();
    const user = userEvent.setup();

    render(<EditEventDialog event={EVENT} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), 'Latte art championship');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const call = fetchMock.mock.calls[0];
    if (call === undefined) throw new Error('fetch was never called');
    const [path, init] = call;
    const { body } = init;
    if (typeof body !== 'string') throw new Error('expected a JSON string body');

    expect(path).toBe('/api/events/1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(body)).toEqual({
      title: 'Latte art championship',
      description: 'Make the best mochas.',
      starts_at: new Date(2026, 9, 1).toISOString(),
      max_capacity: 25,
    });
  });
});
