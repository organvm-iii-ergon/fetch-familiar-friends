import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Leaderboards from './Leaderboards';

// Mock dependencies
vi.mock('../../hooks/useLeaderboards', () => ({
  useLeaderboards: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import { useLeaderboards } from '../../hooks/useLeaderboards';
import { useAuth } from '../../contexts/AuthContext';

const mockGlobalLeaderboard = [
  {
    id: '1',
    username: 'TopDog',
    display_name: 'Top Dog',
    avatar_url: null,
    xp: 15000,
    level: 25,
    streak_days: 30,
    rank: 1,
    isCurrentUser: false,
  },
  {
    id: '2',
    username: 'PawMaster',
    display_name: 'Paw Master',
    avatar_url: 'https://example.com/avatar.jpg',
    xp: 12500,
    level: 22,
    streak_days: 15,
    rank: 2,
    isCurrentUser: false,
  },
  {
    id: '3',
    username: 'PetChamp',
    display_name: 'Pet Champ',
    avatar_url: null,
    xp: 10000,
    level: 20,
    streak_days: 10,
    rank: 3,
    isCurrentUser: true,
  },
  {
    id: '4',
    username: 'DoggyDays',
    display_name: null,
    avatar_url: null,
    xp: 8000,
    level: 18,
    streak_days: 0,
    rank: 4,
    isCurrentUser: false,
  },
];

const mockFriendsLeaderboard = [
  {
    id: '3',
    username: 'PetChamp',
    display_name: 'Pet Champ',
    avatar_url: null,
    xp: 10000,
    level: 20,
    streak_days: 10,
    rank: 1,
    isCurrentUser: true,
  },
  {
    id: '5',
    username: 'FriendlyPup',
    display_name: 'Friendly Pup',
    avatar_url: null,
    xp: 5000,
    level: 12,
    streak_days: 5,
    rank: 2,
    isCurrentUser: false,
  },
];

const mockWeeklyLeaderboard = [
  {
    id: '6',
    username: 'ActiveWalker',
    display_name: 'Active Walker',
    avatar_url: null,
    level: 15,
    activityCount: 45,
    rank: 1,
    isCurrentUser: false,
  },
  {
    id: '3',
    username: 'PetChamp',
    display_name: 'Pet Champ',
    avatar_url: null,
    level: 20,
    activityCount: 32,
    rank: 2,
    isCurrentUser: true,
  },
];

describe('Leaderboards Component', () => {
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    useLeaderboards.mockReturnValue({
      globalLeaderboard: mockGlobalLeaderboard,
      friendsLeaderboard: mockFriendsLeaderboard,
      weeklyLeaderboard: mockWeeklyLeaderboard,
      userRank: 3,
      loading: false,
      error: null,
      refresh: mockRefresh,
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<Leaderboards />);
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
    expect(screen.getByText('See how you stack up!')).toBeInTheDocument();
  });

  describe('Refresh functionality', () => {
    it('displays refresh button', () => {
      render(<Leaderboards />);
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });

    it('calls refresh when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Leaderboards />);

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      await user.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('shows loading state on refresh button', () => {
      useLeaderboards.mockReturnValue({
        globalLeaderboard: [],
        friendsLeaderboard: [],
        weeklyLeaderboard: [],
        userRank: null,
        loading: true,
        error: null,
        refresh: mockRefresh,
      });

      render(<Leaderboards />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('disables refresh button while loading', () => {
      useLeaderboards.mockReturnValue({
        globalLeaderboard: [],
        friendsLeaderboard: [],
        weeklyLeaderboard: [],
        userRank: null,
        loading: true,
        error: null,
        refresh: mockRefresh,
      });

      render(<Leaderboards />);
      const refreshButton = screen.getByRole('button', { name: /Loading/i });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Tab navigation', () => {
    it('displays all tab buttons', () => {
      render(<Leaderboards />);

      expect(screen.getByRole('button', { name: /Global/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Friends/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /This Week/i })).toBeInTheDocument();
    });

    it('switches to Friends tab when clicked', async () => {
      const user = userEvent.setup();
      render(<Leaderboards />);

      const friendsTab = screen.getByRole('button', { name: /Friends/i });
      await user.click(friendsTab);

      // Friends leaderboard should be visible
      expect(screen.getByText('Friendly Pup')).toBeInTheDocument();
    });

    it('switches to Weekly tab when clicked', async () => {
      const user = userEvent.setup();
      render(<Leaderboards />);

      const weeklyTab = screen.getByRole('button', { name: /This Week/i });
      await user.click(weeklyTab);

      // Weekly leaderboard should be visible
      expect(screen.getByText('Active Walker')).toBeInTheDocument();
      expect(screen.getByText('activities')).toBeInTheDocument();
    });

    it('shows active tab styling', async () => {
      const user = userEvent.setup();
      render(<Leaderboards />);

      const globalTab = screen.getByRole('button', { name: /Global/i });
      const friendsTab = screen.getByRole('button', { name: /Friends/i });

      // Initially global tab should be active
      expect(globalTab).toHaveClass('bg-purple-500');

      await user.click(friendsTab);

      // Now friends tab should be active
      expect(friendsTab).toHaveClass('bg-purple-500');
    });
  });

  describe('User rank card', () => {
    it('displays user rank card when authenticated', () => {
      render(<Leaderboards />);

      expect(screen.getByText('Your Global Rank')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('shows trophy emoji', () => {
      render(<Leaderboards />);
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('does not show user rank card when not authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      useLeaderboards.mockReturnValue({
        globalLeaderboard: mockGlobalLeaderboard,
        friendsLeaderboard: [],
        weeklyLeaderboard: [],
        userRank: null,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<Leaderboards />);
      expect(screen.queryByText('Your Global Rank')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('displays loading spinner when loading with no data', () => {
      useLeaderboards.mockReturnValue({
        globalLeaderboard: [],
        friendsLeaderboard: [],
        weeklyLeaderboard: [],
        userRank: null,
        loading: true,
        error: null,
        refresh: mockRefresh,
      });

      render(<Leaderboards />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('displays error message when there is an error', () => {
      useLeaderboards.mockReturnValue({
        globalLeaderboard: [],
        friendsLeaderboard: [],
        weeklyLeaderboard: [],
        userRank: null,
        loading: false,
        error: 'Network error',
        refresh: mockRefresh,
      });

      render(<Leaderboards />);
      expect(screen.getByText(/Failed to load leaderboard: Network error/)).toBeInTheDocument();
    });
  });

  describe('Leaderboard entries', () => {
    it('displays all leaderboard entries', () => {
      render(<Leaderboards />);

      expect(screen.getByText('Top Dog')).toBeInTheDocument();
      expect(screen.getByText('Paw Master')).toBeInTheDocument();
      expect(screen.getByText('Pet Champ')).toBeInTheDocument();
    });

    it('displays rank badges for top 3', () => {
      render(<Leaderboards />);

      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
      expect(screen.getByText('🥉')).toBeInTheDocument();
    });

    it('displays numeric rank for positions after 3', () => {
      render(<Leaderboards />);

      // DoggyDays is rank 4
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('displays user levels', () => {
      render(<Leaderboards />);

      expect(screen.getByText('Level 25')).toBeInTheDocument();
      expect(screen.getByText('Level 22')).toBeInTheDocument();
      expect(screen.getByText('Level 20')).toBeInTheDocument();
    });

    it('displays streak days for users with streaks', () => {
      render(<Leaderboards />);

      expect(screen.getByText(/30d streak/)).toBeInTheDocument();
      expect(screen.getByText(/15d streak/)).toBeInTheDocument();
      expect(screen.getByText(/10d streak/)).toBeInTheDocument();
    });

    it('displays XP scores', () => {
      render(<Leaderboards />);

      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('12,500')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    it('highlights current user entry', () => {
      render(<Leaderboards />);

      // PetChamp is marked as current user
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    it('uses display_name when available, falls back to username', () => {
      render(<Leaderboards />);

      // Has display_name
      expect(screen.getByText('Top Dog')).toBeInTheDocument();

      // DoggyDays has no display_name, should show username
      expect(screen.getByText('DoggyDays')).toBeInTheDocument();
    });

    it('displays avatar image when available', () => {
      render(<Leaderboards />);

      const avatarImage = screen.getByAltText('Paw Master');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('displays initial when no avatar', () => {
      render(<Leaderboards />);

      // Top Dog has no avatar, should show 'T' initial
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Weekly leaderboard specific behavior', () => {
    it('shows activity count instead of XP on weekly tab', async () => {
      const user = userEvent.setup();
      render(<Leaderboards />);

      const weeklyTab = screen.getByRole('button', { name: /This Week/i });
      await user.click(weeklyTab);

      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('32')).toBeInTheDocument();
      expect(screen.getAllByText('activities').length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('displays empty state for global tab', () => {
      useLeaderboards.mockReturnValue({
        globalLeaderboard: [],
        friendsLeaderboard: [],
        weeklyLeaderboard: [],
        userRank: null,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<Leaderboards />);

      expect(screen.getByText('🌍')).toBeInTheDocument();
      expect(screen.getByText('No data yet')).toBeInTheDocument();
      expect(screen.getByText('Start earning XP to climb the ranks!')).toBeInTheDocument();
    });

    it('displays empty state for friends tab', async () => {
      const user = userEvent.setup();

      useLeaderboards.mockReturnValue({
        globalLeaderboard: mockGlobalLeaderboard,
        friendsLeaderboard: [],
        weeklyLeaderboard: [],
        userRank: 3,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<Leaderboards />);

      const friendsTab = screen.getByRole('button', { name: /Friends/i });
      await user.click(friendsTab);

      expect(screen.getByText('👥')).toBeInTheDocument();
      expect(screen.getByText('No friends yet')).toBeInTheDocument();
      expect(screen.getByText('Add friends to see how you compare!')).toBeInTheDocument();
    });

    it('displays empty state for weekly tab', async () => {
      const user = userEvent.setup();

      useLeaderboards.mockReturnValue({
        globalLeaderboard: mockGlobalLeaderboard,
        friendsLeaderboard: mockFriendsLeaderboard,
        weeklyLeaderboard: [],
        userRank: 3,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<Leaderboards />);

      const weeklyTab = screen.getByRole('button', { name: /This Week/i });
      await user.click(weeklyTab);

      expect(screen.getByText('📅')).toBeInTheDocument();
      expect(screen.getByText('No activity this week')).toBeInTheDocument();
      expect(screen.getByText('Start completing activities to appear here!')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated state', () => {
    it('shows sign in prompt when not authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      render(<Leaderboards />);

      expect(screen.getByText(/Sign in to track your rank and compete with friends!/)).toBeInTheDocument();
    });
  });

  describe('Rank badge styling', () => {
    it('applies gold styling to 1st place', () => {
      render(<Leaderboards />);

      const goldBadge = document.querySelector('.bg-yellow-400');
      expect(goldBadge).toBeInTheDocument();
    });

    it('applies silver styling to 2nd place', () => {
      render(<Leaderboards />);

      const silverBadge = document.querySelector('.bg-gray-300');
      expect(silverBadge).toBeInTheDocument();
    });

    it('applies bronze styling to 3rd place', () => {
      render(<Leaderboards />);

      const bronzeBadge = document.querySelector('.bg-orange-400');
      expect(bronzeBadge).toBeInTheDocument();
    });
  });

  describe('Current user highlighting', () => {
    it('applies special styling to current user row', () => {
      render(<Leaderboards />);

      const currentUserRow = document.querySelector('.border-purple-500');
      expect(currentUserRow).toBeInTheDocument();
    });
  });

  describe('Tab icons', () => {
    it('displays tab icons', () => {
      render(<Leaderboards />);

      expect(screen.getByText('🌍')).toBeInTheDocument(); // Global
      expect(screen.getAllByText('👥').length).toBeGreaterThanOrEqual(1); // Friends
      expect(screen.getByText('📅')).toBeInTheDocument(); // Weekly
    });
  });
});
