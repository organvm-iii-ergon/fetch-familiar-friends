import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthCalendar from './MonthCalendar';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, onClick, disabled }) => (
      <button className={className} onClick={onClick} disabled={disabled} data-testid="calendar-day">
        {children}
      </button>
    )
  }
}));

describe('MonthCalendar', () => {
  const mockDate = new Date('2023-05-15');
  const onDateSelect = vi.fn();

  // Create dates for testing
  const journalDate = new Date('2023-05-20');
  const journalDateKey = journalDate.toDateString(); // "Sat May 20 2023"

  // Also create a date that uses the YYYY-MM-DD format key
  // const journalDateISO = new Date('2023-05-21'); // Unused
  const journalDateISOKey = '2023-05-21';

  const favoriteDate = new Date('2023-05-25');
  const favoriteTimestamp = favoriteDate.getTime();

  const journalEntries = {
    [journalDateKey]: 'Some entry',
    [journalDateISOKey]: 'ISO entry'
  };

  const favorites = [
    { id: '1', url: 'test.jpg', savedAt: favoriteTimestamp }
  ];

  it('renders calendar days', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={{}}
        favorites={[]}
        onDateSelect={onDateSelect}
      />
    );
    // 42 cells are rendered
    const days = screen.getAllByTestId('calendar-day');
    expect(days).toHaveLength(42);
  });

  it('shows journal indicator for correct dates', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={journalEntries}
        favorites={[]}
        onDateSelect={onDateSelect}
      />
    );

    const days = screen.getAllByTestId('calendar-day');

    // Find day 20 (legacy key)
    const day20 = days.find(day => day.textContent.includes('20') && !day.classList.contains('opacity-40'));
    // Depending on current implementation, this might or might not have the indicator
    // Current implementation checks toDateString, so day20 SHOULD have it.

    // Find day 21 (ISO key)
    const day21 = days.find(day => day.textContent.includes('21') && !day.classList.contains('opacity-40'));
    // Current implementation checks toDateString, so day21 should NOT have it (bug).

    // We expect at least one to show if the component works as currently written
    expect(day20.querySelector('[aria-label="Has journal entry"]')).toBeInTheDocument();

    // With optimization, we now support ISO keys too
    expect(day21.querySelector('[aria-label="Has journal entry"]')).toBeInTheDocument();
  });

  it('shows favorite indicator for correct dates', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={{}}
        favorites={favorites}
        onDateSelect={onDateSelect}
      />
    );

    const days = screen.getAllByTestId('calendar-day');
    const day25 = days.find(day => day.textContent.includes('25') && !day.classList.contains('opacity-40'));

    expect(day25.querySelector('[aria-label="Has favorite"]')).toBeInTheDocument();
  });
});
