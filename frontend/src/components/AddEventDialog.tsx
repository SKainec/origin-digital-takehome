import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { useCreateEvent } from '@/api/events';
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
    <Dialog open={open} onOpenChange={setOpen}>
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
          onSubmit={(input) => createEvent.mutate(input, { onSuccess: () => setOpen(false) })}
        />
      </DialogContent>
    </Dialog>
  );
}
