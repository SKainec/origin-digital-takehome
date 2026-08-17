import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from './client';

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

export const eventKeys = { all: ['events'] as const };

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: ({ signal }) => listEvents(signal),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
}
