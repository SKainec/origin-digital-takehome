import { useState } from 'react';

import { type Event, eventErrorMessage, eventFieldErrors, useUpdateEvent } from '@/api/events';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EditEventDialogProps {
  event: Event;
}

export function EditEventDialog({ event }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const updateEvent = useUpdateEvent(event.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // The dialog outlives its form, so a rejected field would otherwise
        // still be marked invalid the next time it opens.
        if (!next) updateEvent.reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Edit ${event.title}`}>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>
        <EventForm
          submitLabel="Save changes"
          fieldErrors={eventFieldErrors(updateEvent.error)}
          errorMessage={eventErrorMessage(updateEvent.error)}
          isSubmitting={updateEvent.isPending}
          initialValue={{
            title: event.title,
            description: event.description,
            startsAt: event.startsAt,
            maxCapacity: event.maxCapacity,
          }}
          onSubmit={(input) => {
            updateEvent.mutate(input, { onSuccess: () => setOpen(false) });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
