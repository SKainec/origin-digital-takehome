import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, apiFetch } from './client';

export interface Event {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  maxCapacity: number;
}

/** The wire shapes, named after the pydantic schemas they mirror. */
interface EventResponse {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  max_capacity: number;
}

type EventRequest = Omit<EventResponse, 'id'>;

function toEvent(response: EventResponse): Event {
  return {
    id: response.id,
    title: response.title,
    description: response.description,
    startsAt: new Date(response.starts_at),
    maxCapacity: response.max_capacity,
  };
}

export type EventInput = Omit<Event, 'id'>;

function toRequest(input: EventInput): EventRequest {
  return {
    title: input.title,
    description: input.description,
    starts_at: input.startsAt.toISOString(),
    max_capacity: input.maxCapacity,
  };
}

export async function listEvents(signal?: AbortSignal): Promise<Event[]> {
  const payload = await apiFetch<EventResponse[]>('/api/events', { signal });
  return payload.map(toEvent);
}

export async function createEvent(input: EventInput): Promise<Event> {
  const payload = await apiFetch<EventResponse>('/api/events', {
    method: 'POST',
    body: toRequest(input),
  });
  return toEvent(payload);
}

export async function updateEvent(id: string, input: EventInput): Promise<Event> {
  const payload = await apiFetch<EventResponse>(`/api/events/${id}`, {
    method: 'PUT',
    body: toRequest(input),
  });
  return toEvent(payload);
}

const FORM_FIELD_BY_WIRE_FIELD: Record<keyof EventRequest, keyof EventInput> = {
  title: 'title',
  description: 'description',
  starts_at: 'startsAt',
  max_capacity: 'maxCapacity',
};

function isWireField(field: string): field is keyof EventRequest {
  return field in FORM_FIELD_BY_WIRE_FIELD;
}

export function eventFieldErrors(
  error: unknown,
): Partial<Record<keyof EventInput, string>> | undefined {
  if (!(error instanceof ApiError) || error.fieldErrors === undefined) return undefined;

  const fieldErrors: Partial<Record<keyof EventInput, string>> = {};
  for (const [wireField, message] of Object.entries(error.fieldErrors)) {
    if (isWireField(wireField)) fieldErrors[FORM_FIELD_BY_WIRE_FIELD[wireField]] = message;
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

/**
 * The message for a failure no single input can carry — a 500, a dropped
 * connection, or a validation error against the event as a whole.
 */
export function eventErrorMessage(error: unknown): string | undefined {
  if (error === null || error === undefined) return undefined;
  if (eventFieldErrors(error) !== undefined) return undefined;
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const eventKeys = { all: ['events'] as const };

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: ({ signal }) => listEvents(signal),
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput) => updateEvent(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
}
