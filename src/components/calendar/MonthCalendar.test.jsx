import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MonthCalendar from './MonthCalendar';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, ...props }) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('MonthCalendar', () => {
  it('renders correctly', () => {
    const date = new Date(2023, 10, 15); // Nov 15 2023
    render(<MonthCalendar currentDate={date} />);
    expect(screen.getByText('November 2023')).toBeInTheDocument();
  });

  it('renders favorites correctly', () => {
    const date = new Date(2023, 10, 15); // Nov 15 2023
    // Favorites expected to have savedAt as ISO string
    const favorites = [
      { savedAt: new Date(2023, 10, 15).toISOString() }, // Favorite on current date
      { savedAt: new Date(2023, 10, 20).toISOString() }  // Favorite on another date
    ];

    render(<MonthCalendar currentDate={date} favorites={favorites} />);

    // Find the button for the 15th
    // Since there are multiple days with numbers, we need to be careful.
    // However, the aria-label contains extra info.

    // The current date (15th) should have the favorite indicator
    // aria-label format: "11/15/2023, marked as favorite" (date format depends on locale, but checking partial match is safer)

    // Let's find by role button and check content
    const dayButtons = screen.getAllByRole('button');
    const favButton = dayButtons.find(btn => btn.textContent === '15' && !btn.className.includes('text-gray-300'));

    expect(favButton).toBeInTheDocument();
    expect(favButton.getAttribute('aria-label')).toContain('favorite');
  });
});
