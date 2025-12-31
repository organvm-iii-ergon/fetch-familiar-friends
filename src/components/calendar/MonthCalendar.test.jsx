import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthCalendar from './MonthCalendar';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, 'aria-label': ariaLabel, disabled, title }) => (
      <button onClick={onClick} className={className} aria-label={ariaLabel} disabled={disabled} title={title}>
        {children}
      </button>
    ),
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
}));

describe('MonthCalendar', () => {
  const mockDate = new Date(2023, 9, 15); // October 15, 2023

  it('renders correctly', () => {
    render(<MonthCalendar currentDate={mockDate} />);
    expect(screen.getByText('October 2023')).toBeInTheDocument();
  });

  it('highlights favorites', () => {
    // Create a date that should definitely be the 20th in local time
    const favDate = new Date(2023, 9, 20);
    const favorites = [{ savedAt: favDate.toISOString() }];

    render(<MonthCalendar currentDate={mockDate} favorites={favorites} />);

    const favIndicators = screen.getAllByLabelText('Has favorite');
    expect(favIndicators.length).toBeGreaterThan(0);
  });

  it('highlights journal entries', () => {
    const journalDate = new Date(2023, 9, 21);
    const dateKey = journalDate.toDateString();
    const journalEntries = { [dateKey]: 'Some entry' };

    render(<MonthCalendar currentDate={mockDate} journalEntries={journalEntries} />);

    const journalIndicators = screen.getAllByLabelText('Has journal entry');
    expect(journalIndicators.length).toBeGreaterThan(0);
  });
});
