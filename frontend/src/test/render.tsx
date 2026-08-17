import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  type RenderHookResult,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

/**
 * A fresh QueryClient per test so cached results never leak between cases.
 * Retries are disabled so error states resolve immediately.
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { queryClient, Wrapper };
}

export function render(ui: ReactElement) {
  const { Wrapper } = createWrapper();
  return rtlRender(ui, { wrapper: Wrapper });
}

export function renderHook<Result>(hook: () => Result): RenderHookResult<Result, void> {
  const { Wrapper } = createWrapper();
  return rtlRenderHook(hook, { wrapper: Wrapper });
}
