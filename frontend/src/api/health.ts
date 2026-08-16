import { apiFetch } from './client';

export interface Health {
  status: 'ok';
  appName: string;
}

interface HealthPayload {
  status: 'ok';
  app_name: string;
}

export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  const payload = await apiFetch<HealthPayload>('/api/health', signal);
  return { status: payload.status, appName: payload.app_name };
}
