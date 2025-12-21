import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthCalendar from './MonthCalendar';

// Mock currentDate to be consistent
const currentDate = new Date('2023-10-15');

describe('MonthCalendar Accessibility', () => {
  it('renders with correct aria-labels for days with journal entries and favorites', () => {
    const journalEntries = {
      [new Date('2023-10-10').toDateString()]: 'Some journal entry'
    };

    const favorites = [
      { savedAt: new Date('2023-10-12').getTime(), type: 'dog', url: 'test.jpg' }
    ];

    render(
      <MonthCalendar
        currentDate={currentDate}
        journalEntries={journalEntries}
        favorites={favorites}
      />
    );

    // Check normal day
    const normalDay = screen.getByLabelText(new Date('2023-10-11').toLocaleDateString());
    expect(normalDay).toBeInTheDocument();

    // Check day with journal
    // The aria-label should contain the date AND ", has journal entry"
    // We use a regex or partial match if possible, but exact match is safer if we know the format
    const journalDateStr = new Date('2023-10-10').toLocaleDateString();
    const journalDay = screen.getByLabelText(`${journalDateStr}, has journal entry`);
    expect(journalDay).toBeInTheDocument();

    // Check day with favorite
    const favDateStr = new Date('2023-10-12').toLocaleDateString();
    const favDay = screen.getByLabelText(`${favDateStr}, has favorite`);
    expect(favDay).toBeInTheDocument();
  });

  it('renders combined status in aria-label', () => {
    const dateStr = new Date('2023-10-20').toDateString();
    const journalEntries = {
      [dateStr]: 'Double entry'
    };

    const favorites = [
      { savedAt: new Date('2023-10-20').getTime(), type: 'cat', url: 'cat.jpg' }
    ];

    render(
      <MonthCalendar
        currentDate={currentDate}
        journalEntries={journalEntries}
        favorites={favorites}
      />
    );

    const targetDateStr = new Date('2023-10-20').toLocaleDateString();
    const combinedDay = screen.getByLabelText(`${targetDateStr}, has journal entry, has favorite`);
    expect(combinedDay).toBeInTheDocument();
  });
});
