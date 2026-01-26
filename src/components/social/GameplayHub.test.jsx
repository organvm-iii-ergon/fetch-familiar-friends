import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameplayHub from './GameplayHub';

// Mock dependencies
vi.mock('../../hooks/useQuests', () => ({
  useQuests: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import { useQuests } from '../../hooks/useQuests';
import { useAuth } from '../../contexts/AuthContext';

const mockDailyQuests = [
  { id: 1, quest_key: 'daily_walk', title: 'Morning Walk', xp: 50, progress: 1, target: 1, icon: '🚶', percentComplete: 100, isComplete: true, rewards_claimed: false },
  { id: 2, quest_key: 'daily_photo', title: 'Photo of the Day', xp: 30, progress: 0, target: 1, icon: '📸', percentComplete: 0, isComplete: false },
  { id: 3, quest_key: 'daily_trick', title: 'Train a Trick', xp: 75, progress: 0, target: 1, icon: '🎓', percentComplete: 0, isComplete: false },
];

const mockWeeklyQuests = [
  { id: 6, quest_key: 'weekly_explore', title: 'Visit 3 New Locations', xp: 200, progress: 1, target: 3, icon: '🗺️', percentComplete: 33, isComplete: false },
  { id: 7, quest_key: 'weekly_gym', title: 'Complete 5 Gym Challenges', xp: 300, progress: 5, target: 5, icon: '🏆', percentComplete: 100, isComplete: true, rewards_claimed: false },
];

describe('GameplayHub Component', () => {
  const mockClaimRewards = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    useQuests.mockReturnValue({
      dailyQuests: [],
      weeklyQuests: [],
      loading: false,
      error: null,
      completedDailyCount: 0,
      completedWeeklyCount: 0,
      totalDailyXp: 0,
      claimRewards: mockClaimRewards,
    });

    useAuth.mockReturnValue({
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<GameplayHub />);
    expect(screen.getByText('Gameplay Hub')).toBeInTheDocument();
  });

  it('renders the season pass progress section', () => {
    render(<GameplayHub />);
    expect(screen.getByText('Spring 2024')).toBeInTheDocument();
    expect(screen.getByText(/Level 12 \/ 50/)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade Pass - \$9.99/)).toBeInTheDocument();
  });

  it('renders all tab buttons', () => {
    render(<GameplayHub />);
    expect(screen.getByRole('button', { name: /Quests/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gym Battles/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Team Battles/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Collections/i })).toBeInTheDocument();
  });

  describe('Loading state', () => {
    it('displays loading spinner when quests are loading', () => {
      useQuests.mockReturnValue({
        dailyQuests: [],
        weeklyQuests: [],
        loading: true,
        error: null,
        completedDailyCount: 0,
        completedWeeklyCount: 0,
        totalDailyXp: 0,
        claimRewards: mockClaimRewards,
      });

      render(<GameplayHub />);
      expect(screen.getByRole('button', { name: /Quests/i })).toBeInTheDocument();
      // Loading spinner should be visible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('displays error message when quests fail to load', () => {
      useQuests.mockReturnValue({
        dailyQuests: [],
        weeklyQuests: [],
        loading: false,
        error: 'Failed to connect to server',
        completedDailyCount: 0,
        completedWeeklyCount: 0,
        totalDailyXp: 0,
        claimRewards: mockClaimRewards,
      });

      render(<GameplayHub />);
      expect(screen.getByText(/Failed to load quests: Failed to connect to server/)).toBeInTheDocument();
    });
  });

  describe('Quest display', () => {
    it('displays mock daily quests when unauthenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      render(<GameplayHub />);

      // Mock data fallback should show
      expect(screen.getByText('Morning Walk')).toBeInTheDocument();
      expect(screen.getByText('Photo of the Day')).toBeInTheDocument();
    });

    it('displays real quests when authenticated with data', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
      });

      useQuests.mockReturnValue({
        dailyQuests: mockDailyQuests,
        weeklyQuests: mockWeeklyQuests,
        loading: false,
        error: null,
        completedDailyCount: 1,
        completedWeeklyCount: 1,
        totalDailyXp: 50,
        claimRewards: mockClaimRewards,
      });

      render(<GameplayHub />);

      expect(screen.getByText('Morning Walk')).toBeInTheDocument();
      expect(screen.getByText('Photo of the Day')).toBeInTheDocument();
      expect(screen.getByText('Train a Trick')).toBeInTheDocument();
    });

    it('displays weekly quests', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
      });

      useQuests.mockReturnValue({
        dailyQuests: mockDailyQuests,
        weeklyQuests: mockWeeklyQuests,
        loading: false,
        error: null,
        completedDailyCount: 1,
        completedWeeklyCount: 1,
        totalDailyXp: 50,
        claimRewards: mockClaimRewards,
      });

      render(<GameplayHub />);

      expect(screen.getByText('Visit 3 New Locations')).toBeInTheDocument();
      expect(screen.getByText('Complete 5 Gym Challenges')).toBeInTheDocument();
    });

    it('shows progress summary when authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
      });

      useQuests.mockReturnValue({
        dailyQuests: mockDailyQuests,
        weeklyQuests: mockWeeklyQuests,
        loading: false,
        error: null,
        completedDailyCount: 2,
        completedWeeklyCount: 1,
        totalDailyXp: 80,
        claimRewards: mockClaimRewards,
      });

      render(<GameplayHub />);

      expect(screen.getByText("Today's Progress")).toBeInTheDocument();
      expect(screen.getByText(/2 daily quests completed/)).toBeInTheDocument();
      expect(screen.getByText(/80 XP earned/)).toBeInTheDocument();
    });
  });

  describe('Claim rewards functionality', () => {
    it('shows claim button for completed quests when authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
      });

      useQuests.mockReturnValue({
        dailyQuests: mockDailyQuests,
        weeklyQuests: mockWeeklyQuests,
        loading: false,
        error: null,
        completedDailyCount: 1,
        completedWeeklyCount: 1,
        totalDailyXp: 50,
        claimRewards: mockClaimRewards,
      });

      render(<GameplayHub />);

      // Find claim buttons (should be visible for completed, unclaimed quests)
      const claimButtons = screen.getAllByRole('button', { name: /Claim/i });
      expect(claimButtons.length).toBeGreaterThan(0);
    });

    it('calls claimRewards when claim button is clicked', async () => {
      const user = userEvent.setup();

      useAuth.mockReturnValue({
        isAuthenticated: true,
      });

      useQuests.mockReturnValue({
        dailyQuests: mockDailyQuests,
        weeklyQuests: mockWeeklyQuests,
        loading: false,
        error: null,
        completedDailyCount: 1,
        completedWeeklyCount: 1,
        totalDailyXp: 50,
        claimRewards: mockClaimRewards,
      });

      render(<GameplayHub />);

      const claimButtons = screen.getAllByRole('button', { name: /Claim/i });
      await user.click(claimButtons[0]);

      expect(mockClaimRewards).toHaveBeenCalled();
    });
  });

  describe('Tab navigation', () => {
    it('switches to Gym Battles tab when clicked', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const gymTab = screen.getByRole('button', { name: /Gym Battles/i });
      await user.click(gymTab);

      // Gym content should be visible
      expect(screen.getByText('Central Park Arena')).toBeInTheDocument();
      expect(screen.getByText('Beach Training Grounds')).toBeInTheDocument();
      expect(screen.getByText('Mountain Peak Challenge')).toBeInTheDocument();
    });

    it('switches to Team Battles tab when clicked', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const pvpTab = screen.getByRole('button', { name: /Team Battles/i });
      await user.click(pvpTab);

      // Team battles content should be visible
      expect(screen.getByText('Fetch Tournament')).toBeInTheDocument();
      expect(screen.getByText('Agility Race')).toBeInTheDocument();
      expect(screen.getByText('Co-op Adventure')).toBeInTheDocument();
    });

    it('switches to Collections tab when clicked', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const collectionsTab = screen.getByRole('button', { name: /Collections/i });
      await user.click(collectionsTab);

      // Collections content should be visible
      expect(screen.getByText('breeds')).toBeInTheDocument();
      expect(screen.getByText('locations')).toBeInTheDocument();
      expect(screen.getByText('achievements')).toBeInTheDocument();
      expect(screen.getByText('badges')).toBeInTheDocument();
    });

    it('shows correct active tab styling', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const questsTab = screen.getByRole('button', { name: /Quests/i });
      const gymTab = screen.getByRole('button', { name: /Gym Battles/i });

      // Initially quests tab should be active
      expect(questsTab).toHaveClass('text-blue-600');

      await user.click(gymTab);

      // Now gym tab should be active
      expect(gymTab).toHaveClass('text-blue-600');
    });
  });

  describe('Gym Battles content', () => {
    it('displays gym challenge details', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const gymTab = screen.getByRole('button', { name: /Gym Battles/i });
      await user.click(gymTab);

      // Check gym details
      expect(screen.getByText('Coach Marcus')).toBeInTheDocument();
      expect(screen.getByText('0.5 mi away')).toBeInTheDocument();
      expect(screen.getByText('Level 10+')).toBeInTheDocument();
      expect(screen.getByText('500 XP + Park Badge')).toBeInTheDocument();
    });

    it('displays challenge gym buttons', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const gymTab = screen.getByRole('button', { name: /Gym Battles/i });
      await user.click(gymTab);

      const challengeButtons = screen.getAllByRole('button', { name: /Challenge Gym/i });
      expect(challengeButtons).toHaveLength(3);
    });
  });

  describe('Team Battles content', () => {
    it('displays battle type badges', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const pvpTab = screen.getByRole('button', { name: /Team Battles/i });
      await user.click(pvpTab);

      expect(screen.getByText('PvP')).toBeInTheDocument();
      expect(screen.getByText('Race')).toBeInTheDocument();
      expect(screen.getByText('PvE')).toBeInTheDocument();
    });

    it('displays queue up buttons', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const pvpTab = screen.getByRole('button', { name: /Team Battles/i });
      await user.click(pvpTab);

      const queueButtons = screen.getAllByRole('button', { name: /Queue Up/i });
      expect(queueButtons).toHaveLength(3);
    });
  });

  describe('Collections content', () => {
    it('displays collection progress', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const collectionsTab = screen.getByRole('button', { name: /Collections/i });
      await user.click(collectionsTab);

      expect(screen.getByText('34 / 100')).toBeInTheDocument(); // breeds
      expect(screen.getByText('67 / 150')).toBeInTheDocument(); // locations
      expect(screen.getByText('28 / 75')).toBeInTheDocument(); // achievements
      expect(screen.getByText('12 / 30')).toBeInTheDocument(); // badges
    });

    it('displays latest discoveries', async () => {
      const user = userEvent.setup();
      render(<GameplayHub />);

      const collectionsTab = screen.getByRole('button', { name: /Collections/i });
      await user.click(collectionsTab);

      expect(screen.getByText(/Shiba Inu/)).toBeInTheDocument();
      expect(screen.getByText(/Hidden Garden/)).toBeInTheDocument();
      expect(screen.getByText(/Marathon Walker/)).toBeInTheDocument();
      expect(screen.getByText(/Social Butterfly/)).toBeInTheDocument();
    });
  });
});
