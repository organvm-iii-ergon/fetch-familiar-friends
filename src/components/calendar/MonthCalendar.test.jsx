import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthCalendar from './MonthCalendar';

describe('MonthCalendar', () => {
  const mockDate = new Date('2023-10-15T12:00:00');
  const onDateSelect = vi.fn();

  const journalEntries = {
    'Mon Oct 02 2023': 'Some entry',
    'Tue Oct 10 2023': 'Another entry'
  };

  const favorites = [
    { savedAt: '2023-10-05T10:00:00.000Z' }, // Thu Oct 05 2023
    { savedAt: '2023-10-20T14:30:00.000Z' }  // Fri Oct 20 2023
  ];

  it('renders without crashing', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        onDateSelect={onDateSelect}
      />
    );
    expect(screen.getByText('October 2023')).toBeInTheDocument();
  });

  it('renders all days of the month plus padding', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
      />
    );
    // 42 cells total
    const dayButtons = screen.getAllByRole('button', { name: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    expect(dayButtons).toHaveLength(42);
  });

  it('correctly marks days with journal entries', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={journalEntries}
      />
    );

    // Oct 2nd should have journal entry indicator
    // Note: The aria-label logic in component: title includes "(has journal)"
    const dayButton = screen.getByTitle(/10\/2\/2023.*has journal/);
    expect(dayButton).toBeInTheDocument();
    expect(dayButton).toContainHTML('bg-green-500');
  });

  it('correctly marks days with favorites', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        favorites={favorites}
      />
    );

    // Oct 5th should have favorite indicator
    const dayButton = screen.getByTitle(/10\/5\/2023.*has favorites/);
    expect(dayButton).toBeInTheDocument();
    expect(dayButton).toContainHTML('bg-yellow-500');
  });

  it('calls onDateSelect when a valid date is clicked', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        onDateSelect={onDateSelect}
      />
    );

    // Click on Oct 15th
    const dayButton = screen.getByRole('button', { name: '10/15/2023' });
    fireEvent.click(dayButton);

    expect(onDateSelect).toHaveBeenCalled();
    // Verify argument is a date object for Oct 15
    const callArg = onDateSelect.mock.calls[0][0];
    expect(callArg.getDate()).toBe(15);
    expect(callArg.getMonth()).toBe(9); // Oct is 9
  });
});
