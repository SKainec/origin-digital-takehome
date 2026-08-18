import { useState } from 'react';

import type { Event } from '@/api/events';
import {
  registrationErrorMessage,
  useEventRegistrations,
  useRegister,
  useUnregister,
} from '@/api/registrations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegistrationsDialogProps {
  event: Event;
}

export function RegistrationsDialog({ event }: RegistrationsDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const registrations = useEventRegistrations(event.id, open);
  const register = useRegister(event.id);
  const unregister = useUnregister(event.id);

  // Only a rejected registration belongs to the email field; the other two failures are
  // about the list as a whole.
  const registerErrorMessage = registrationErrorMessage(register.error);
  const errorMessage =
    registerErrorMessage ??
    registrationErrorMessage(unregister.error) ??
    registrationErrorMessage(registrations.error);

  function handleSubmit(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    register.mutate(email, { onSuccess: () => setEmail('') });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // The dialog outlives its form, so a rejected attempt would otherwise still be
        // reported the next time it opens.
        if (!next) {
          register.reset();
          unregister.reset();
          setEmail('');
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Registrations for ${event.title}`}>
          Registrations
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrations</DialogTitle>
          <DialogDescription>{event.title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="registration-email">Email</Label>
            <Input
              id="registration-email"
              type="email"
              required
              value={email}
              onChange={(changeEvent) => setEmail(changeEvent.target.value)}
              {...(registerErrorMessage === undefined
                ? {}
                : { 'aria-invalid': true, 'aria-describedby': 'registration-error' })}
            />
          </div>
          <Button type="submit" disabled={register.isPending}>
            Register
          </Button>
        </form>

        {errorMessage !== undefined && (
          <p id="registration-error" role="alert" className="text-destructive text-sm">
            {errorMessage}
          </p>
        )}

        {registrations.isPending && <output>Loading registrations…</output>}
        {registrations.data?.length === 0 && !registrations.isError && (
          <p className="text-muted-foreground text-sm">No one has registered yet.</p>
        )}
        {registrations.data !== undefined && registrations.data.length > 0 && (
          <ul className="divide-border divide-y">
            {registrations.data.map((registered) => (
              <li key={registered} className="flex items-center justify-between py-2">
                <span>{registered}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Unregister ${registered}`}
                  disabled={unregister.isPending}
                  onClick={() => {
                    unregister.mutate(registered);
                  }}
                >
                  Unregister
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
