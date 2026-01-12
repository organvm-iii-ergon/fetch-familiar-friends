import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthCalendar from './MonthCalendar';

// Mock framer-motion since it's used in the component
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

describe('MonthCalendar', () => {
  const currentDate = new Date(2023, 5, 15); // June 15, 2023

  it('renders correctly', () => {
    render(<MonthCalendar currentDate={currentDate} />);
    expect(screen.getByText('June 2023')).toBeInTheDocument();
  });

  it('renders correct days', () => {
    render(<MonthCalendar currentDate={currentDate} />);
    // June 2023 has 30 days.
    // Check for existence of days, robust to duplicates from prev/next months
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('15').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
  });

  it('handles favorites and journal entries correctly', () => {
    const favorites = [
      { savedAt: new Date(2023, 5, 15).toISOString() }
    ];
    const journalEntries = {
      [new Date(2023, 5, 15).toDateString()]: 'Some entry'
    };

    render(
      <MonthCalendar
        currentDate={currentDate}
        favorites={favorites}
        journalEntries={journalEntries}
      />
    );

    // Check if the day button has correct aria-label parts indicating status
    // 15th is likely unique in this view (mid-month), but let's be safe
    // Since duplicates have different aria-labels (prev/next month usually don't have the status unless data matches them too)
    // But data matches by date string, so if prev month 15th was visible it would also match.
    // However, June 15 is unique in June view (May 15 and July 15 are not visible in June view typically)

    // We can use the button's aria-label to find it specifically
    const dayButton = screen.getByLabelText(/marked as favorite/);
    expect(dayButton).toBeInTheDocument();
    expect(dayButton).toHaveAttribute('aria-label', expect.stringContaining('has journal entry'));
  });

  it('calls onDateSelect when a date is clicked', () => {
    const onDateSelect = vi.fn();
    render(<MonthCalendar currentDate={currentDate} onDateSelect={onDateSelect} />);

    const dayButtons = screen.getAllByText('15');
    // Click the first one (should be valid)
    fireEvent.click(dayButtons[0]);

    expect(onDateSelect).toHaveBeenCalled();
  });
});
