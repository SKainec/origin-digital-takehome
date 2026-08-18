import { ApiError } from '@/api/client';
import { useEvents } from '@/api/events';
import { AddEventDialog } from '@/components/AddEventDialog';
import { EditEventDialog } from '@/components/EditEventDialog';
import { RegistrationsDialog } from '@/components/RegistrationsDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SKELETON_ROWS = 3;

export function EventBoard() {
  const { data, isPending, isError, error } = useEvents();

  if (isError) {
    return (
      <p role="alert">{error instanceof ApiError ? error.message : 'Could not load events.'}</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-heading text-xs tracking-wide uppercase">When</TableHead>
          <TableHead className="font-heading text-xs tracking-wide uppercase">Event</TableHead>
          <TableHead className="font-heading text-xs tracking-wide uppercase">Capacity</TableHead>
          <TableHead className="font-heading text-xs tracking-wide uppercase">Status</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending &&
          Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <TableRow key={index} aria-hidden={index > 0}>
              <TableCell colSpan={5} role={index === 0 ? 'status' : undefined}>
                {index === 0 ? 'Loading events…' : <>&nbsp;</>}
              </TableCell>
            </TableRow>
          ))}
        {data?.length === 0 && (
          <TableRow>
            <TableCell colSpan={5}>No events yet.</TableCell>
          </TableRow>
        )}
        {data?.map((event) => (
          <TableRow key={event.id}>
            <TableCell className="font-mono tabular-nums">
              {event.startsAt.toLocaleDateString()}
            </TableCell>
            <TableCell>{event.title}</TableCell>
            <TableCell className="font-mono tabular-nums">{event.maxCapacity}</TableCell>
            <TableCell>—</TableCell>
            <TableCell className="text-right">
              <RegistrationsDialog event={event} />
              <EditEventDialog event={event} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} className="bg-transparent">
            <AddEventDialog />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
