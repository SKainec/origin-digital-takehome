import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { EventInput } from '@/api/events';

import { EventForm } from './EventForm';

async function fillAndSubmit(submitLabel: string) {
  const onSubmit = vi.fn<(input: EventInput) => void>();
  const user = userEvent.setup();

  render(<EventForm submitLabel={submitLabel} onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/title/i), 'Barista convention');
  await user.type(screen.getByLabelText(/description/i), 'Make the best mochas.');
  await user.type(screen.getByLabelText(/date/i), '2026-10-01');
  await user.clear(screen.getByLabelText(/capacity/i));
  await user.type(screen.getByLabelText(/capacity/i), '25');
  await user.click(screen.getByRole('button', { name: submitLabel }));

  return onSubmit;
}

describe('EventForm', () => {
  it('submits the entered fields, with the date at local midnight', async () => {
    const onSubmit = await fillAndSubmit('Create event');

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Barista convention',
      description: 'Make the best mochas.',
      startsAt: new Date(2026, 9, 1),
      maxCapacity: 25,
    });
  });

  it('pre-fills fields from the given initial value', () => {
    render(
      <EventForm
        submitLabel="Save changes"
        onSubmit={vi.fn<(input: EventInput) => void>()}
        initialValue={{
          title: 'Barista convention',
          description: 'Make the best mochas.',
          startsAt: new Date(2026, 9, 1),
          maxCapacity: 25,
        }}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('Barista convention');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Make the best mochas.');
    expect(screen.getByLabelText(/date/i)).toHaveValue('2026-10-01');
    expect(screen.getByLabelText(/capacity/i)).toHaveValue(25);
  });

  it('marks the offending inputs and shows the message for each field error', () => {
    render(
      <EventForm
        submitLabel="Create event"
        onSubmit={vi.fn<(input: EventInput) => void>()}
        fieldErrors={{
          title: 'String should have at least 1 character',
          maxCapacity: 'Input should be greater than or equal to 1',
        }}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveAccessibleDescription(
      'String should have at least 1 character',
    );
    expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-invalid', 'true');

    expect(screen.getByLabelText(/capacity/i)).toHaveAccessibleDescription(
      'Input should be greater than or equal to 1',
    );
    expect(screen.getByLabelText(/capacity/i)).toHaveAttribute('aria-invalid', 'true');

    expect(screen.getByLabelText(/description/i)).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText(/description/i)).toHaveAccessibleDescription('');
  });

  it('reports a failure that belongs to no single field', () => {
    render(
      <EventForm
        submitLabel="Create event"
        onSubmit={vi.fn<(input: EventInput) => void>()}
        errorMessage="the event store is unavailable"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('the event store is unavailable');
  });

  it('renders the given submit label', () => {
    render(
      <EventForm submitLabel="Save changes" onSubmit={vi.fn<(input: EventInput) => void>()} />,
    );

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('does not submit when the date is left blank', async () => {
    const onSubmit = vi.fn<(input: EventInput) => void>();
    const user = userEvent.setup();

    render(<EventForm submitLabel="Create event" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Barista convention');
    await user.type(screen.getByLabelText(/description/i), 'Make the best mochas.');
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when the title is left blank', async () => {
    const onSubmit = vi.fn<(input: EventInput) => void>();
    const user = userEvent.setup();

    render(<EventForm submitLabel="Create event" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/description/i), 'Make the best mochas.');
    await user.type(screen.getByLabelText(/date/i), '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit a capacity below one', async () => {
    const onSubmit = vi.fn<(input: EventInput) => void>();
    const user = userEvent.setup();

    render(<EventForm submitLabel="Create event" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Barista convention');
    await user.type(screen.getByLabelText(/date/i), '2026-10-01');
    await user.clear(screen.getByLabelText(/capacity/i));
    await user.type(screen.getByLabelText(/capacity/i), '0');
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when capacity is cleared to empty', async () => {
    const onSubmit = vi.fn<(input: EventInput) => void>();
    const user = userEvent.setup();

    render(<EventForm submitLabel="Create event" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Barista convention');
    await user.type(screen.getByLabelText(/description/i), 'Make the best mochas.');
    await user.type(screen.getByLabelText(/date/i), '2026-10-01');
    await user.clear(screen.getByLabelText(/capacity/i));
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
