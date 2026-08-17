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
