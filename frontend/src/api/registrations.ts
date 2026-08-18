import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, apiFetch } from './client';

/** A registration is only ever an email address, so there is no wire shape to map. */
interface RegistrationResponse {
  email: string;
}

function pathFor(eventId: string): string {
  return `/api/events/${eventId}/registrations`;
}

export async function listRegistrations(eventId: string, signal?: AbortSignal): Promise<string[]> {
  return apiFetch<string[]>(pathFor(eventId), { signal });
}

export async function registerForEvent(eventId: string, email: string): Promise<string> {
  const payload = await apiFetch<RegistrationResponse>(pathFor(eventId), {
    method: 'POST',
    body: { email },
  });
  // The server lowercases the address; echoing its answer back beats repeating that rule here.
  return payload.email;
}

export async function unregisterFromEvent(eventId: string, email: string): Promise<void> {
  await apiFetch<void>(`${pathFor(eventId)}/${encodeURIComponent(email)}`, { method: 'DELETE' });
}

const MESSAGE_BY_CODE: Record<string, string> = {
  event_full: 'This event is full.',
  already_registered: 'That email is already registered.',
  event_in_past: 'This event has already started.',
  registration_not_found: 'That registration was already cancelled.',
  event_not_found: 'That event no longer exists.',
};

export function registrationErrorMessage(error: unknown): string | undefined {
  if (error === null || error === undefined) return undefined;
  if (error instanceof ApiError) {
    return (error.code === undefined ? undefined : MESSAGE_BY_CODE[error.code]) ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

export const registrationKeys = {
  forEvent: (eventId: string) => ['registrations', eventId] as const,
};

/**
 * `enabled` because the board mounts one of these per row: without it, opening the page
 * fetches every event's attendees, and the list then goes stale before anyone opens it.
 */
export function useEventRegistrations(eventId: string, enabled = true) {
  return useQuery({
    queryKey: registrationKeys.forEvent(eventId),
    queryFn: ({ signal }) => listRegistrations(eventId, signal),
    enabled,
  });
}

export function useRegister(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => registerForEvent(eventId, email),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: registrationKeys.forEvent(eventId) }),
  });
}

export function useUnregister(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => unregisterFromEvent(eventId, email),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: registrationKeys.forEvent(eventId) }),
  });
}
