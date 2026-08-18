import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { eventErrorMessage, eventFieldErrors, useCreateEvent } from '@/api/events';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const createEvent = useCreateEvent();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // The dialog outlives its form, so a rejected field would otherwise
        // still be marked invalid the next time it opens.
        if (!next) createEvent.reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed">
          <PlusIcon />
          Add event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
        </DialogHeader>
        <EventForm
          submitLabel="Create event"
          fieldErrors={eventFieldErrors(createEvent.error)}
          errorMessage={eventErrorMessage(createEvent.error)}
          isSubmitting={createEvent.isPending}
          onSubmit={(input) => createEvent.mutate(input, { onSuccess: () => setOpen(false) })}
        />
      </DialogContent>
    </Dialog>
  );
}
