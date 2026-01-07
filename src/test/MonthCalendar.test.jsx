import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MonthCalendar from '../components/calendar/MonthCalendar';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, className, onClick, ...props }) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('MonthCalendar', () => {
  const currentDate = new Date('2023-10-15'); // October 15, 2023
  const onDateSelect = vi.fn();

  const favorites = [
    { savedAt: new Date('2023-10-10').getTime(), url: 'url1', id: '1' },
    { savedAt: new Date('2023-10-20').getTime(), url: 'url2', id: '2' }
  ];

  it('renders correctly', () => {
    render(
      <MonthCalendar
        currentDate={currentDate}
        favorites={favorites}
        onDateSelect={onDateSelect}
      />
    );

    expect(screen.getByText('October 2023')).toBeDefined();

    // There are two '10's in the calendar (Sep 10 prev month, Oct 10 curr month)
    // We should be specific about testing the current month days
    const days = screen.getAllByText('10');
    expect(days.length).toBeGreaterThan(0);
  });

  it('identifies favorite days correctly', () => {
    render(
      <MonthCalendar
        currentDate={currentDate}
        favorites={favorites}
        onDateSelect={onDateSelect}
      />
    );

    // Use getAllByLabelText because aria-label might be duplicated if days are duplicated (prev/next month)
    // But Oct 10 2023 is unique in this view (Sep 30 is end of prev month)
    // Wait, let's check the date logic.
    // Oct 1st is Sunday. So Sep 24-30 are prev month days.
    // 10th of Oct is in current month.

    const day10Btn = screen.getByLabelText('10/10/2023');
    expect(day10Btn.title).toContain('(has favorites)');

    const day20Btn = screen.getByLabelText('10/20/2023');
    expect(day20Btn.title).toContain('(has favorites)');

    const day15Btn = screen.getByLabelText('10/15/2023');
    expect(day15Btn.title).not.toContain('(has favorites)');
  });

  it('calls onDateSelect when a day is clicked', () => {
    render(
      <MonthCalendar
        currentDate={currentDate}
        favorites={favorites}
        onDateSelect={onDateSelect}
      />
    );

    // Click on the 15th (selected day)
    const day15Btn = screen.getByLabelText('10/15/2023');
    fireEvent.click(day15Btn);

    expect(onDateSelect).toHaveBeenCalled();
  });
});
