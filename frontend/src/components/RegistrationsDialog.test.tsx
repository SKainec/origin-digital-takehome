import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { RegistrationsDialog } from './RegistrationsDialog';

const EVENT = {
  id: '1',
  title: 'Barista convention',
  description: 'Make the best mochas.',
  startsAt: new Date(2026, 9, 1),
  maxCapacity: 25,
};

/** An in-memory stand-in for the registrations endpoints of one event. */
function stubRegistrations(initial: string[]) {
  let emails = [...initial];

  vi.stubGlobal(
    'fetch',
    vi.fn((path: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET';

      if (method === 'POST') {
        const body = typeof init.body === 'string' ? init.body : '{}';
        const { email } = JSON.parse(body) as { email: string };
        emails = [...emails, email.toLowerCase()].toSorted();
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ email }) });
      }
      if (method === 'DELETE') {
        const email = decodeURIComponent(path.split('/').pop() ?? '');
        emails = emails.filter((registered) => registered !== email);
        return Promise.resolve({ ok: true, status: 204, json: () => Promise.reject(new Error()) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(emails) });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function open() {
  const user = userEvent.setup();
  render(<RegistrationsDialog event={EVENT} />);
  await user.click(screen.getByRole('button', { name: /registrations for barista convention/i }));
  return user;
}

describe('RegistrationsDialog', () => {
  it('lists who is registered for the event', async () => {
    stubRegistrations(['alex@example.com', 'sarah@example.com']);

    await open();

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByText('sarah@example.com')).toBeInTheDocument();
    });
    expect(within(dialog).getByText('alex@example.com')).toBeInTheDocument();
  });

  it('says so when nobody has registered yet', async () => {
    stubRegistrations([]);

    await open();

    expect(await screen.findByText(/no one has registered yet/i)).toBeInTheDocument();
  });

  it('adds a registrant entered in the form', async () => {
    stubRegistrations([]);

    const user = await open();
    await user.type(await screen.findByLabelText(/email/i), 'Sarah@Example.com');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('sarah@example.com')).toBeInTheDocument();
  });

  it('removes a registrant when their registration is cancelled', async () => {
    stubRegistrations(['sarah@example.com']);

    const user = await open();
    await user.click(await screen.findByRole('button', { name: /unregister sarah@example.com/i }));

    await waitFor(() => {
      expect(screen.queryByText('sarah@example.com')).not.toBeInTheDocument();
    });
  });

  it('waits for the dialog to open before asking who is registered', async () => {
    stubRegistrations(['sarah@example.com']);
    const user = userEvent.setup();

    render(<RegistrationsDialog event={EVENT} />);
    expect(fetch).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /registrations for barista/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('reports a failure to load the list rather than looking empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ detail: 'the event store is unavailable' }),
      }),
    );

    await open();

    expect(await screen.findByRole('alert')).toHaveTextContent('the event store is unavailable');
    expect(screen.queryByText(/no one has registered yet/i)).not.toBeInTheDocument();
  });

  it('does not blame the email field for a failed unregister', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_path: string, init: RequestInit = {}) =>
        (init.method ?? 'GET') === 'DELETE'
          ? Promise.resolve({
              ok: false,
              status: 404,
              json: () =>
                Promise.resolve({
                  detail: 'sarah@example.com is not registered for event 1',
                  code: 'registration_not_found',
                }),
            })
          : Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve(['sarah@example.com']),
            }),
      ),
    );

    const user = await open();
    await user.click(await screen.findByRole('button', { name: /unregister sarah@example.com/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That registration was already cancelled.',
    );
    expect(screen.getByLabelText(/email/i)).not.toHaveAttribute('aria-invalid');
  });

  it('explains a business rule the API rejected the registration on', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_path: string, init: RequestInit = {}) =>
        (init.method ?? 'GET') === 'POST'
          ? Promise.resolve({
              ok: false,
              status: 409,
              json: () =>
                Promise.resolve({
                  detail: 'event 1 is at its capacity of 25',
                  code: 'event_full',
                }),
            })
          : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }),
      ),
    );

    const user = await open();
    await user.type(await screen.findByLabelText(/email/i), 'sarah@example.com');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This event is full.');
  });
});
