import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthCalendar from './MonthCalendar';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

describe('MonthCalendar', () => {
  const mockDate = new Date('2023-05-15T12:00:00'); // May 15, 2023
  const mockOnDateSelect = vi.fn();

  it('renders correctly', () => {
    render(
      <MonthCalendar
        currentDate={mockDate}
        onDateSelect={mockOnDateSelect}
      />
    );
    expect(screen.getByText('May 2023')).toBeInTheDocument();
  });

  it('shows favorite indicator', () => {
    // May 15 2023
    const favDate = new Date('2023-05-15T12:00:00');
    const favorites = [
      { savedAt: favDate.toISOString(), id: '1', url: 'test.jpg' }
    ];

    render(
      <MonthCalendar
        currentDate={mockDate}
        favorites={favorites}
        onDateSelect={mockOnDateSelect}
      />
    );

    // Find the day button for 15
    // Note: buttons have aria-label which includes date
    const dayButton = screen.getByLabelText(/5\/15\/2023/);
    expect(dayButton).toBeInTheDocument();

    // Check for favorite indicator
    // The indicator has aria-label "Has favorite"
    const indicator = screen.getByLabelText('Has favorite');
    expect(indicator).toBeInTheDocument();
  });

  it('shows journal indicator (if keys match toDateString)', () => {
    // This tests the logic inside MonthCalendar, assuming keys match what it expects
    const dateKey = mockDate.toDateString();
    const journalEntries = {
      [dateKey]: 'Dear diary...'
    };

    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={journalEntries}
        onDateSelect={mockOnDateSelect}
      />
    );

    const indicator = screen.getByLabelText('Has journal entry');
    expect(indicator).toBeInTheDocument();
  });

  it('does NOT show journal indicator if keys do not match (verifying current bug/behavior)', () => {
    // Current behavior: App passes YYYY-MM-DD, Component expects toDateString()
    const yyyyMmDd = '2023-05-15';
    const journalEntries = {
      [yyyyMmDd]: 'Dear diary...'
    };

    render(
      <MonthCalendar
        currentDate={mockDate}
        journalEntries={journalEntries}
        onDateSelect={mockOnDateSelect}
      />
    );

    const indicator = screen.queryByLabelText('Has journal entry');
    expect(indicator).not.toBeInTheDocument();
  });
});
