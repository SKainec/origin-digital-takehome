import { useQuery } from '@tanstack/react-query';

import { fetchHealth } from '@/api/health';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function App() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
  });

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Marquee Events</h1>
        <p className="text-muted-foreground mt-1">Event management</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API status</CardTitle>
          <CardDescription>Connection to the event management API</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && <output className="text-muted-foreground text-sm">Checking API…</output>}
          {isError && (
            <p role="alert" className="text-destructive text-sm">
              Could not reach the API: {error.message}
            </p>
          )}
          {data && (
            <div className="flex items-center gap-2">
              <Badge>{data.status}</Badge>
              <span className="text-sm">{data.appName}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
