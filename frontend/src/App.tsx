import { EventBoard } from '@/components/EventBoard';

export default function App() {
  return (
    <main className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Marquee Events</h1>
        <p className="text-muted-foreground mt-1">Event management</p>
      </div>
      <EventBoard />
    </main>
  );
}
