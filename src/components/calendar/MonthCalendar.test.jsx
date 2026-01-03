import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthCalendar from './MonthCalendar';

describe('MonthCalendar Accessibility', () => {
  const mockDate = new Date('2024-05-15'); // Wednesday
  const mockJournalEntries = {
    'Thu May 16 2024': 'A great day!', // Has journal
  };
  const mockFavorites = [
    { savedAt: '2024-05-17T10:00:00.000Z' }, // Fri May 17 2024
  ];

  it('renders weekday headers with accessible labels', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={{}}
        favorites={[]}
      />
    );

    // Should have aria-label for full day name
    expect(screen.getByText('Sun')).toHaveAttribute('aria-label', 'Sunday');
    expect(screen.getByText('Mon')).toHaveAttribute('aria-label', 'Monday');
  });

  it('provides detailed status information in date button aria-labels', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={mockJournalEntries}
        favorites={mockFavorites}
      />
    );

    // 1. Check standard date
    const plainDate = screen.getByRole('button', { name: /5\/15\/2024/i });
    expect(plainDate).toBeInTheDocument();
    // Should NOT have status info
    expect(plainDate).not.toHaveAttribute('aria-label', expect.stringContaining('has journal'));

    // 2. Check date with journal entry
    // Should include "has journal entry" in the label
    const journalDateBtn = screen.getByRole('button', { name: /5\/16\/2024, has journal entry/i });
    expect(journalDateBtn).toBeInTheDocument();

    // 3. Check date with favorite
    // Should include "has favorites" in the label
    const favDateBtn = screen.getByRole('button', { name: /5\/17\/2024, has favorites/i });
    expect(favDateBtn).toBeInTheDocument();
  });
});
