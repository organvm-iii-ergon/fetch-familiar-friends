import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendsList from './FriendsList';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock socialData utilities
vi.mock('../../utils/socialData', () => ({
  friendshipLevels: {
    1: { name: 'New Friend', color: '#3498db', perks: 'See basic activities', daysRequired: 1 },
    2: { name: 'Good Friend', color: '#9b59b6', perks: 'Schedule playdates', daysRequired: 7 },
    3: { name: 'Close Friend', color: '#e67e22', perks: 'Share health data', daysRequired: 30 },
    4: { name: 'Best Friend', color: '#e74c3c', perks: 'Full profile access', daysRequired: 90 },
  },
  timeAgo: vi.fn((date) => '2 hours ago'),
}));

const mockFriends = [
  {
    id: 1,
    username: 'JohnDogLover',
    avatarColor: '#FF6B6B',
    location: 'San Francisco, CA',
    friendshipLevel: 2,
    daysUntilNextLevel: 15,
    lastInteraction: new Date(),
    playdateAvailable: true,
    pets: [{ name: 'Max', breed: 'Golden Retriever' }],
  },
  {
    id: 2,
    username: 'SarahPaws',
    avatarColor: '#4ECDC4',
    location: 'New York, NY',
    friendshipLevel: 4,
    daysUntilNextLevel: 0,
    lastInteraction: new Date(),
    playdateAvailable: false,
    pets: [{ name: 'Bella', breed: 'Labrador' }],
  },
  {
    id: 3,
    username: 'MikePetParent',
    avatarColor: '#45B7D1',
    location: 'Austin, TX',
    friendshipLevel: 1,
    daysUntilNextLevel: 25,
    lastInteraction: new Date(),
    playdateAvailable: true,
    pets: [],
  },
];

describe('FriendsList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<FriendsList friends={mockFriends} />);
    expect(screen.getByText(/Friends \(3\)/)).toBeInTheDocument();
  });

  it('displays the add friend button', () => {
    render(<FriendsList friends={mockFriends} />);
    expect(screen.getByRole('button', { name: /Add Friend/i })).toBeInTheDocument();
  });

  describe('Friends display', () => {
    it('displays all friends with their usernames', () => {
      render(<FriendsList friends={mockFriends} />);

      expect(screen.getByText('JohnDogLover')).toBeInTheDocument();
      expect(screen.getByText('SarahPaws')).toBeInTheDocument();
      expect(screen.getByText('MikePetParent')).toBeInTheDocument();
    });

    it('displays friend locations', () => {
      render(<FriendsList friends={mockFriends} />);

      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('New York, NY')).toBeInTheDocument();
      expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    });

    it('displays pet information when available', () => {
      render(<FriendsList friends={mockFriends} />);

      expect(screen.getByText(/Max \(Golden Retriever\)/)).toBeInTheDocument();
      expect(screen.getByText(/Bella \(Labrador\)/)).toBeInTheDocument();
    });

    it('shows avatar initials correctly', () => {
      render(<FriendsList friends={mockFriends} />);

      // First letter of username should be shown
      expect(screen.getByText('J')).toBeInTheDocument(); // JohnDogLover
      expect(screen.getByText('S')).toBeInTheDocument(); // SarahPaws
      expect(screen.getByText('M')).toBeInTheDocument(); // MikePetParent
    });
  });

  describe('Friendship levels', () => {
    it('displays friendship level names', () => {
      render(<FriendsList friends={mockFriends} />);

      expect(screen.getByText('Good Friend')).toBeInTheDocument();
      expect(screen.getByText('Best Friend')).toBeInTheDocument();
      expect(screen.getByText('New Friend')).toBeInTheDocument();
    });

    it('displays days until next level', () => {
      render(<FriendsList friends={mockFriends} />);

      expect(screen.getByText('15 days to next level')).toBeInTheDocument();
      expect(screen.getByText('0 days to next level')).toBeInTheDocument();
      expect(screen.getByText('25 days to next level')).toBeInTheDocument();
    });

    it('displays last activity time', () => {
      render(<FriendsList friends={mockFriends} />);

      const lastActivityTexts = screen.getAllByText(/Last activity:/);
      expect(lastActivityTexts.length).toBe(3);
    });
  });

  describe('Action buttons', () => {
    it('displays View Profile button for all friends', () => {
      render(<FriendsList friends={mockFriends} />);

      const viewProfileButtons = screen.getAllByRole('button', { name: /View Profile/i });
      expect(viewProfileButtons).toHaveLength(3);
    });

    it('displays Playdate button only for friends with playdateAvailable', () => {
      render(<FriendsList friends={mockFriends} />);

      const playdateButtons = screen.getAllByRole('button', { name: /Playdate/i });
      // Only JohnDogLover and MikePetParent have playdateAvailable: true
      expect(playdateButtons).toHaveLength(2);
    });
  });

  describe('Empty state', () => {
    it('displays empty state when no friends', () => {
      render(<FriendsList friends={[]} />);

      expect(screen.getByText(/Friends \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/No friends yet/)).toBeInTheDocument();
      expect(screen.getByText(/Start connecting with other pet parents!/)).toBeInTheDocument();
    });

    it('displays empty emoji in empty state', () => {
      render(<FriendsList friends={[]} />);

      expect(screen.getByText('👥')).toBeInTheDocument();
    });
  });

  describe('Avatar styling', () => {
    it('applies correct avatar background colors', () => {
      render(<FriendsList friends={mockFriends} />);

      const avatars = document.querySelectorAll('.w-16.h-16.rounded-full');
      expect(avatars.length).toBe(3);

      // Check background colors are applied via inline styles
      expect(avatars[0]).toHaveStyle({ backgroundColor: '#FF6B6B' });
      expect(avatars[1]).toHaveStyle({ backgroundColor: '#4ECDC4' });
      expect(avatars[2]).toHaveStyle({ backgroundColor: '#45B7D1' });
    });
  });

  describe('Friendship level styling', () => {
    it('applies correct friendship level colors', () => {
      render(<FriendsList friends={mockFriends} />);

      const goodFriendLabel = screen.getByText('Good Friend');
      const bestFriendLabel = screen.getByText('Best Friend');
      const newFriendLabel = screen.getByText('New Friend');

      expect(goodFriendLabel).toHaveStyle({ color: '#9b59b6' });
      expect(bestFriendLabel).toHaveStyle({ color: '#e74c3c' });
      expect(newFriendLabel).toHaveStyle({ color: '#3498db' });
    });
  });

  describe('Progress bars', () => {
    it('displays friendship progress bars', () => {
      render(<FriendsList friends={mockFriends} />);

      const progressBars = document.querySelectorAll('.h-2.bg-gray-200');
      expect(progressBars.length).toBe(3);
    });

    it('shows correct progress bar width based on friendship level', () => {
      render(<FriendsList friends={mockFriends} />);

      // Level 2 should be 50% (2/4 * 100)
      // Level 4 should be 100% (4/4 * 100)
      // Level 1 should be 25% (1/4 * 100)
      const progressIndicators = document.querySelectorAll('.h-full.rounded-full.transition-all');

      expect(progressIndicators[0]).toHaveStyle({ width: '50%' }); // Level 2
      expect(progressIndicators[1]).toHaveStyle({ width: '100%' }); // Level 4
      expect(progressIndicators[2]).toHaveStyle({ width: '25%' }); // Level 1
    });
  });

  describe('Responsive layout', () => {
    it('uses grid layout for friends list', () => {
      render(<FriendsList friends={mockFriends} />);

      const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic button elements for actions', () => {
      render(<FriendsList friends={mockFriends} />);

      const buttons = screen.getAllByRole('button');
      // 1 Add Friend + 3 View Profile + 2 Playdate = 6 buttons
      expect(buttons).toHaveLength(6);
    });
  });
});
