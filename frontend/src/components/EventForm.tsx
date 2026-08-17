import { useState } from 'react';

import type { EventInput } from '@/api/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EventFormProps {
  onSubmit: (input: EventInput) => void;
  submitLabel: string;
}

export function EventForm({ onSubmit, submitLabel }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('1');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      title,
      description,
      // Appending a time makes the date parse in the browser's local zone, not UTC —
      // a bare "YYYY-MM-DD" is defined to parse as UTC midnight, which can land on
      // the wrong calendar day once toEvent() re-displays it locally.
      startsAt: new Date(`${startsAt}T00:00:00`),
      maxCapacity: Number(maxCapacity),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-title">Title</Label>
        <Input id="event-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-description">Description</Label>
        <Input
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-starts-at">Date</Label>
        <Input
          id="event-starts-at"
          type="date"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-max-capacity">Capacity</Label>
        <Input
          id="event-max-capacity"
          type="number"
          min={1}
          required
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
        />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
