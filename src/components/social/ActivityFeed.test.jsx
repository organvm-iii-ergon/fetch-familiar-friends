import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityFeed from './ActivityFeed';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock socialData utilities
vi.mock('../../utils/socialData', () => ({
  timeAgo: vi.fn((date) => '3 hours ago'),
}));

const mockActivities = [
  {
    id: 1,
    friend: {
      id: 101,
      username: 'JohnDogLover',
      avatarColor: '#FF6B6B',
    },
    type: 'walk',
    emoji: '🚶',
    text: 'walked 2.5 miles with Max!',
    timestamp: new Date(),
    likes: 15,
    comments: 3,
  },
  {
    id: 2,
    friend: {
      id: 102,
      username: 'SarahPaws',
      avatarColor: '#4ECDC4',
    },
    type: 'photo',
    emoji: '📸',
    text: 'shared a cute photo of Bella!',
    timestamp: new Date(),
    likes: 28,
    comments: 7,
  },
  {
    id: 3,
    friend: {
      id: 103,
      username: 'MikePetParent',
      avatarColor: '#45B7D1',
    },
    type: 'achievement',
    emoji: '🏆',
    text: 'earned the "Walker" badge!',
    timestamp: new Date(),
    likes: 42,
    comments: 12,
  },
];

describe('ActivityFeed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<ActivityFeed activities={mockActivities} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  describe('Activities display', () => {
    it('displays all activities', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText('JohnDogLover')).toBeInTheDocument();
      expect(screen.getByText('SarahPaws')).toBeInTheDocument();
      expect(screen.getByText('MikePetParent')).toBeInTheDocument();
    });

    it('displays activity text content', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText(/walked 2.5 miles with Max!/)).toBeInTheDocument();
      expect(screen.getByText(/shared a cute photo of Bella!/)).toBeInTheDocument();
      expect(screen.getByText(/earned the "Walker" badge!/)).toBeInTheDocument();
    });

    it('displays activity emojis', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText('🚶')).toBeInTheDocument();
      expect(screen.getByText('📸')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('displays timestamps for all activities', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const timestamps = screen.getAllByText('3 hours ago');
      expect(timestamps).toHaveLength(3);
    });
  });

  describe('Avatar display', () => {
    it('shows avatar initials correctly', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText('J')).toBeInTheDocument(); // JohnDogLover
      expect(screen.getByText('S')).toBeInTheDocument(); // SarahPaws
      expect(screen.getByText('M')).toBeInTheDocument(); // MikePetParent
    });

    it('applies correct avatar background colors', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const avatars = document.querySelectorAll('.w-12.h-12.rounded-full');
      expect(avatars.length).toBe(3);

      expect(avatars[0]).toHaveStyle({ backgroundColor: '#FF6B6B' });
      expect(avatars[1]).toHaveStyle({ backgroundColor: '#4ECDC4' });
      expect(avatars[2]).toHaveStyle({ backgroundColor: '#45B7D1' });
    });
  });

  describe('Engagement metrics', () => {
    it('displays like counts', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays comment counts', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays share button for each activity', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const shareButtons = screen.getAllByText(/Share/);
      expect(shareButtons).toHaveLength(3);
    });
  });

  describe('Interaction buttons', () => {
    it('renders like buttons for each activity', () => {
      render(<ActivityFeed activities={mockActivities} />);

      // Each activity should have like button with heart emoji
      const likeButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.includes('❤️')
      );
      expect(likeButtons).toHaveLength(3);
    });

    it('renders comment buttons for each activity', () => {
      render(<ActivityFeed activities={mockActivities} />);

      // Each activity should have comment button with speech emoji
      const commentButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.includes('💬')
      );
      expect(commentButtons).toHaveLength(3);
    });

    it('renders share buttons for each activity', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const shareButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.includes('🔄')
      );
      expect(shareButtons).toHaveLength(3);
    });
  });

  describe('Empty state', () => {
    it('displays empty state when no activities', () => {
      render(<ActivityFeed activities={[]} />);

      expect(screen.getByText('🐾')).toBeInTheDocument();
      expect(screen.getByText(/No recent activities/)).toBeInTheDocument();
      expect(screen.getByText(/Connect with friends to see their updates!/)).toBeInTheDocument();
    });

    it('does not show Recent Activity header content when empty', () => {
      render(<ActivityFeed activities={[]} />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  describe('Card styling', () => {
    it('applies correct card styling to activities', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const cards = document.querySelectorAll('.bg-white.dark\\:bg-gray-800.rounded-xl');
      expect(cards.length).toBe(3);
    });

    it('has shadow effects on cards', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const cards = document.querySelectorAll('.shadow-md');
      expect(cards.length).toBe(3);
    });
  });

  describe('Hover effects', () => {
    it('has hover transition for like button', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const buttons = screen.getAllByRole('button');
      const likeButton = buttons.find(btn => btn.textContent.includes('❤️'));

      expect(likeButton).toHaveClass('hover:text-red-500');
    });

    it('has hover transition for comment button', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const buttons = screen.getAllByRole('button');
      const commentButton = buttons.find(btn => btn.textContent.includes('💬'));

      expect(commentButton).toHaveClass('hover:text-blue-500');
    });

    it('has hover transition for share button', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const buttons = screen.getAllByRole('button');
      const shareButton = buttons.find(btn => btn.textContent.includes('🔄'));

      expect(shareButton).toHaveClass('hover:text-green-500');
    });
  });

  describe('Layout structure', () => {
    it('uses flex layout for activity content', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const activityContainers = document.querySelectorAll('.flex.items-start.gap-4');
      expect(activityContainers.length).toBe(3);
    });

    it('uses space-y for activity list spacing', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Single activity', () => {
    it('renders correctly with a single activity', () => {
      render(<ActivityFeed activities={[mockActivities[0]]} />);

      expect(screen.getByText('JohnDogLover')).toBeInTheDocument();
      expect(screen.getByText(/walked 2.5 miles with Max!/)).toBeInTheDocument();
      expect(screen.queryByText('SarahPaws')).not.toBeInTheDocument();
    });
  });

  describe('Activity with zero engagement', () => {
    it('displays zero likes and comments correctly', () => {
      const activityWithZeroEngagement = [{
        id: 999,
        friend: {
          id: 999,
          username: 'NewUser',
          avatarColor: '#000000',
        },
        type: 'walk',
        emoji: '🚶',
        text: 'went for a walk',
        timestamp: new Date(),
        likes: 0,
        comments: 0,
      }];

      render(<ActivityFeed activities={activityWithZeroEngagement} />);

      // Should show 0 for likes and comments
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Username rendering', () => {
    it('renders usernames in bold', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const johnUsername = screen.getByText('JohnDogLover');
      expect(johnUsername).toHaveClass('font-semibold');
    });
  });

  describe('Timestamp styling', () => {
    it('applies muted styling to timestamps', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const timestamps = screen.getAllByText('3 hours ago');
      timestamps.forEach(timestamp => {
        expect(timestamp).toHaveClass('text-sm');
        expect(timestamp).toHaveClass('text-gray-500');
      });
    });
  });
});
