import { useState } from 'react';

import type { EventInput } from '@/api/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EventFormProps {
  onSubmit: (input: EventInput) => void;
  submitLabel: string;
  initialValue?: EventInput;
  fieldErrors?: Partial<Record<keyof EventInput, string>>;
  errorMessage?: string;
  isSubmitting?: boolean;
}

const NO_FIELD_ERRORS: Partial<Record<keyof EventInput, string>> = {};

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (message === undefined) return null;
  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  );
}

function errorProps(id: string, message: string | undefined) {
  return message === undefined ? {} : { 'aria-invalid': true, 'aria-describedby': id };
}

/** Local calendar date, matching how the date input's own value is formatted. */
function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function EventForm({
  onSubmit,
  submitLabel,
  initialValue,
  fieldErrors = NO_FIELD_ERRORS,
  errorMessage,
  isSubmitting = false,
}: EventFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const [startsAt, setStartsAt] = useState(
    initialValue ? toDateInputValue(initialValue.startsAt) : '',
  );
  const [maxCapacity, setMaxCapacity] = useState(String(initialValue?.maxCapacity ?? 1));

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
      {errorMessage !== undefined && (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-title">Title</Label>
        <Input
          id="event-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          {...errorProps('event-title-error', fieldErrors.title)}
        />
        <FieldError id="event-title-error" message={fieldErrors.title} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-description">Description</Label>
        <Input
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          {...errorProps('event-description-error', fieldErrors.description)}
        />
        <FieldError id="event-description-error" message={fieldErrors.description} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-starts-at">Date</Label>
        <Input
          id="event-starts-at"
          type="date"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          {...errorProps('event-starts-at-error', fieldErrors.startsAt)}
        />
        <FieldError id="event-starts-at-error" message={fieldErrors.startsAt} />
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
          {...errorProps('event-max-capacity-error', fieldErrors.maxCapacity)}
        />
        <FieldError id="event-max-capacity-error" message={fieldErrors.maxCapacity} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
