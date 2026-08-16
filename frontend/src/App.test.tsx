import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { render } from './test/render';

function mockFetch(response: Pick<Response, 'ok' | 'status'> & Partial<Response>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows a loading state while the health check is in flight', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Checking API');
  });

  it('reports the app name once the API responds', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok', app_name: 'Event Management API' }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Event Management API')).toBeInTheDocument();
    });
  });

  it('surfaces an alert when the API returns an error status', async () => {
    mockFetch({ ok: false, status: 503 });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('503');
    });
  });

  it('surfaces an alert when the network request fails outright', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch');
    });
  });
});
