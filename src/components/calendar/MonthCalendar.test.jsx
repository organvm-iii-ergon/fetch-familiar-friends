import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MonthCalendar from './MonthCalendar';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line no-unused-vars
    button: ({ children, whileHover, whileTap, ...props }) => <button {...props}>{children}</button>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

describe('MonthCalendar', () => {
  const mockDate = new Date('2024-04-15T12:00:00');
  const mockOnDateSelect = vi.fn();

  const defaultProps = {
    currentDate: mockDate,
    journalEntries: {},
    favorites: [],
    onDateSelect: mockOnDateSelect
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the correct month and year', () => {
    render(<MonthCalendar {...defaultProps} />);
    expect(screen.getByText('April 2024')).toBeInTheDocument();
  });

  it('renders the correct number of days', () => {
    render(<MonthCalendar {...defaultProps} />);
    // 42 days in the grid
    const days = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('aspect-square')
    );
    expect(days).toHaveLength(42);
  });

  it('highlights the current date', () => {
    render(<MonthCalendar {...defaultProps} />);
    const currentDayButton = screen.getByText('15').closest('button');
    expect(currentDayButton).toHaveClass('bg-blue-500');
  });

  it('calls onDateSelect when a valid date is clicked', () => {
    render(<MonthCalendar {...defaultProps} />);
    // Click on the 10th (past/valid date)
    // We select the button with specific aria-label to ensure we get the April 10th, not May 10th
    const dayButton = screen.getByRole('button', { name: /4\/10\/2024/i });
    fireEvent.click(dayButton);
    expect(mockOnDateSelect).toHaveBeenCalled();
  });

  it('does not call onDateSelect when a future date is clicked', () => {
    // Let's use fake timers to set "today" to a fixed date.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15'));

    render(<MonthCalendar {...defaultProps} />);

    // 20th of April 2024 is in the future relative to 15th
    // We select specifically April 20th
    const futureDayButton = screen.getByRole('button', { name: /4\/20\/2024/i });
    fireEvent.click(futureDayButton);
    expect(mockOnDateSelect).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('displays indicators for journal entries', () => {
    const journalEntries = {
      [mockDate.toDateString()]: 'Some entry'
    };
    render(<MonthCalendar {...defaultProps} journalEntries={journalEntries} />);

    const dayButton = screen.getByText('15').closest('button');
    // Check for journal indicator (green dot)
    // The dot has class 'bg-white' if selected, or 'bg-green-500' if not.
    // Since 15th is selected (currentDate), it should have bg-white indicator?
    // Let's check aria-label
    expect(dayButton).toHaveAttribute('aria-label', expect.stringContaining('has journal entry'));
  });

  it('displays indicators for favorites', () => {
    const favorites = [
      { savedAt: mockDate.toISOString() } // Matches 15th
    ];
    render(<MonthCalendar {...defaultProps} favorites={favorites} />);

    const dayButton = screen.getByText('15').closest('button');
    expect(dayButton).toHaveAttribute('aria-label', expect.stringContaining('marked as favorite'));
  });
});
