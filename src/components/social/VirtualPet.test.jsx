import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VirtualPet from './VirtualPet';

// Mock dependencies
vi.mock('../../hooks/useVirtualPet', () => ({
  useVirtualPet: vi.fn(),
}));

vi.mock('../../hooks/useQuests', () => ({
  useQuests: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, transition, ...props }) => <div {...props}>{children}</div>,
  },
}));

import { useVirtualPet } from '../../hooks/useVirtualPet';
import { useQuests } from '../../hooks/useQuests';
import { useAuth } from '../../contexts/AuthContext';

const mockRealPet = {
  name: 'Max',
  species: 'dog',
};

const mockVirtualPet = {
  pet_name: 'Buddy',
  pet_type: 'dog',
  happiness: 85,
  hunger: 30,
  energy: 70,
  level: 5,
  experience: 350,
};

describe('VirtualPet Component', () => {
  const mockFeed = vi.fn();
  const mockPlay = vi.fn();
  const mockRest = vi.fn();
  const mockTreat = vi.fn();
  const mockGroom = vi.fn();
  const mockPerformAction = vi.fn();
  const mockUpdateQuestProgress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    useVirtualPet.mockReturnValue({
      pet: mockVirtualPet,
      loading: false,
      mood: 'happy',
      level: 5,
      isHungry: false,
      isTired: false,
      isSad: false,
      needsAttention: false,
      performAction: mockPerformAction,
      actionCooldowns: {},
      feed: mockFeed,
      play: mockPlay,
      rest: mockRest,
      treat: mockTreat,
      groom: mockGroom,
    });

    useQuests.mockReturnValue({
      updateQuestProgress: mockUpdateQuestProgress,
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<VirtualPet realPet={mockRealPet} />);
    expect(screen.getByText(/Virtual Buddy/)).toBeInTheDocument();
  });

  describe('Loading state', () => {
    it('displays loading spinner when loading', () => {
      useVirtualPet.mockReturnValue({
        pet: null,
        loading: true,
        mood: 'neutral',
        level: 1,
        isHungry: false,
        isTired: false,
        isSad: false,
        needsAttention: false,
        performAction: mockPerformAction,
        actionCooldowns: {},
        feed: mockFeed,
        play: mockPlay,
        rest: mockRest,
        treat: mockTreat,
        groom: mockGroom,
      });

      render(<VirtualPet realPet={mockRealPet} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Pet display', () => {
    it('displays pet name', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });

    it('displays pet level', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('Level 5')).toBeInTheDocument();
    });

    it('displays dog emoji for dog type pet', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('🐕')).toBeInTheDocument();
    });

    it('displays cat emoji for cat type pet', () => {
      useVirtualPet.mockReturnValue({
        pet: { ...mockVirtualPet, pet_type: 'cat' },
        loading: false,
        mood: 'happy',
        level: 5,
        isHungry: false,
        isTired: false,
        isSad: false,
        needsAttention: false,
        performAction: mockPerformAction,
        actionCooldowns: {},
        feed: mockFeed,
        play: mockPlay,
        rest: mockRest,
        treat: mockTreat,
        groom: mockGroom,
      });

      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('🐱')).toBeInTheDocument();
    });

    it('displays mood emoji based on stats', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      // With happiness > 80 should show happy face
      expect(screen.getByText('😊')).toBeInTheDocument();
    });
  });

  describe('Stats display', () => {
    it('displays happiness stat', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText(/Happiness/)).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays hunger stat (inverted)', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText(/Hunger/)).toBeInTheDocument();
      // Hunger is inverted, so 30 hunger shows as 70% (100 - 30)
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('displays energy stat', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText(/Energy/)).toBeInTheDocument();
    });

    it('shows stat icons', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getAllByText('😊').length).toBeGreaterThanOrEqual(1); // Happiness icon
      expect(screen.getByText('🍖')).toBeInTheDocument(); // Hunger icon
      expect(screen.getByText('⚡')).toBeInTheDocument(); // Energy icon
    });
  });

  describe('XP progress', () => {
    it('displays experience progress', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('350/250 XP')).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('displays all action buttons', () => {
      render(<VirtualPet realPet={mockRealPet} />);

      expect(screen.getByText('Feed')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();
      expect(screen.getByText('Rest')).toBeInTheDocument();
      expect(screen.getByText('Groom')).toBeInTheDocument();
      expect(screen.getByText('Treat')).toBeInTheDocument();
      expect(screen.getByText('Walk')).toBeInTheDocument();
    });

    it('displays action icons', () => {
      render(<VirtualPet realPet={mockRealPet} />);

      expect(screen.getAllByText('🍖').length).toBeGreaterThanOrEqual(1); // Feed
      expect(screen.getByText('🎾')).toBeInTheDocument(); // Play
      expect(screen.getByText('😴')).toBeInTheDocument(); // Rest
      expect(screen.getByText('✨')).toBeInTheDocument(); // Groom
      expect(screen.getByText('🦴')).toBeInTheDocument(); // Treat
      expect(screen.getAllByText('🚶').length).toBeGreaterThanOrEqual(1); // Walk
    });

    it('calls feed handler when Feed button is clicked', async () => {
      const user = userEvent.setup();
      mockFeed.mockResolvedValue({ success: true, xpGained: 5 });

      render(<VirtualPet realPet={mockRealPet} />);

      const feedButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('div')?.textContent === '🍖'
      );
      await user.click(feedButton);

      await waitFor(() => {
        expect(mockFeed).toHaveBeenCalled();
      });
    });

    it('calls play handler when Play button is clicked', async () => {
      const user = userEvent.setup();
      mockPlay.mockResolvedValue({ success: true, xpGained: 10 });

      render(<VirtualPet realPet={mockRealPet} />);

      const playButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('div')?.textContent === '🎾'
      );
      await user.click(playButton);

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });

  describe('Cooldown display', () => {
    it('shows cooldown timer when action is on cooldown', () => {
      useVirtualPet.mockReturnValue({
        pet: mockVirtualPet,
        loading: false,
        mood: 'happy',
        level: 5,
        isHungry: false,
        isTired: false,
        isSad: false,
        needsAttention: false,
        performAction: mockPerformAction,
        actionCooldowns: {
          feed: Date.now() + 10000, // 10 seconds in the future
        },
        feed: mockFeed,
        play: mockPlay,
        rest: mockRest,
        treat: mockTreat,
        groom: mockGroom,
      });

      render(<VirtualPet realPet={mockRealPet} />);

      // Should show cooldown time instead of "Feed"
      expect(screen.getByText(/\d+s/)).toBeInTheDocument();
    });

    it('disables button when on cooldown', () => {
      useVirtualPet.mockReturnValue({
        pet: mockVirtualPet,
        loading: false,
        mood: 'happy',
        level: 5,
        isHungry: false,
        isTired: false,
        isSad: false,
        needsAttention: false,
        performAction: mockPerformAction,
        actionCooldowns: {
          feed: Date.now() + 10000,
        },
        feed: mockFeed,
        play: mockPlay,
        rest: mockRest,
        treat: mockTreat,
        groom: mockGroom,
      });

      render(<VirtualPet realPet={mockRealPet} />);

      // The button with cooldown should have opacity-50 class
      const cooldownButton = document.querySelector('.opacity-50');
      expect(cooldownButton).toBeInTheDocument();
    });
  });

  describe('Needs attention indicator', () => {
    it('shows needs attention badge when pet needs attention', () => {
      useVirtualPet.mockReturnValue({
        pet: mockVirtualPet,
        loading: false,
        mood: 'sad',
        level: 5,
        isHungry: true,
        isTired: false,
        isSad: false,
        needsAttention: true,
        performAction: mockPerformAction,
        actionCooldowns: {},
        feed: mockFeed,
        play: mockPlay,
        rest: mockRest,
        treat: mockTreat,
        groom: mockGroom,
      });

      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('Needs attention!')).toBeInTheDocument();
    });

    it('does not show needs attention badge when pet is fine', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.queryByText('Needs attention!')).not.toBeInTheDocument();
    });
  });

  describe('Achievements section', () => {
    it('displays achievements section', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('displays achievement icons', () => {
      render(<VirtualPet realPet={mockRealPet} />);

      expect(screen.getByText('🎉')).toBeInTheDocument(); // First Week
      expect(screen.getByText('⭐')).toBeInTheDocument(); // Level achievement
    });

    it('shows unlocked achievements differently than locked ones', () => {
      render(<VirtualPet realPet={mockRealPet} />);

      const achievementContainers = document.querySelectorAll('.p-3.rounded-lg');
      // Some should have yellow background (unlocked)
      const unlockedAchievements = document.querySelectorAll('.bg-yellow-100');
      expect(unlockedAchievements.length).toBeGreaterThan(0);
    });
  });

  describe('Sync with Real Pet section', () => {
    it('displays sync section', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText(/Sync with Real Pet/)).toBeInTheDocument();
    });

    it('displays sync action buttons', () => {
      render(<VirtualPet realPet={mockRealPet} />);

      expect(screen.getByRole('button', { name: /Log Walk/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log Meal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log Play/i })).toBeInTheDocument();
    });
  });

  describe('Tips section', () => {
    it('displays tips section', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText('💜 Virtual Pet Tips')).toBeInTheDocument();
    });

    it('displays tips list', () => {
      render(<VirtualPet realPet={mockRealPet} />);

      expect(screen.getByText(/Check in daily/)).toBeInTheDocument();
      expect(screen.getByText(/Balance all stats/)).toBeInTheDocument();
      expect(screen.getByText(/Sync real activities/)).toBeInTheDocument();
    });

    it('shows sign in prompt when not authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText(/Sign in to save your progress!/)).toBeInTheDocument();
    });

    it('shows auto-save message when authenticated', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText(/Your progress is saved automatically!/)).toBeInTheDocument();
    });
  });

  describe('Action result toast', () => {
    it('shows success message after action', async () => {
      const user = userEvent.setup();
      mockFeed.mockResolvedValue({ success: true, xpGained: 5 });

      render(<VirtualPet realPet={mockRealPet} />);

      const feedButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('div')?.textContent === '🍖'
      );
      await user.click(feedButton);

      await waitFor(() => {
        expect(screen.getByText(/\+\d+ XP/)).toBeInTheDocument();
      });
    });

    it('shows level up message when leveling up', async () => {
      const user = userEvent.setup();
      mockFeed.mockResolvedValue({ success: true, leveledUp: true, newLevel: 6 });

      render(<VirtualPet realPet={mockRealPet} />);

      const feedButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('div')?.textContent === '🍖'
      );
      await user.click(feedButton);

      await waitFor(() => {
        expect(screen.getByText(/Level Up!/)).toBeInTheDocument();
      });
    });
  });

  describe('Fallback for unauthenticated users', () => {
    it('uses local state for unauthenticated users', async () => {
      const user = userEvent.setup();

      useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      // Return null pet to trigger local fallback
      useVirtualPet.mockReturnValue({
        pet: null,
        loading: false,
        mood: 'neutral',
        level: 1,
        isHungry: false,
        isTired: false,
        isSad: false,
        needsAttention: false,
        performAction: mockPerformAction,
        actionCooldowns: {},
        feed: mockFeed,
        play: mockPlay,
        rest: mockRest,
        treat: mockTreat,
        groom: mockGroom,
      });

      render(<VirtualPet realPet={mockRealPet} />);

      // Should use realPet name as fallback
      expect(screen.getByText(/Virtual Max/)).toBeInTheDocument();
    });
  });

  describe('Care section title', () => {
    it('displays care section with pet name', () => {
      render(<VirtualPet realPet={mockRealPet} />);
      expect(screen.getByText(/Care for Buddy/)).toBeInTheDocument();
    });
  });

  describe('Stat color coding', () => {
    it('shows green progress bar for high stats', () => {
      render(<VirtualPet realPet={mockRealPet} />);

      // With happiness at 85%, should have green bar
      const greenBars = document.querySelectorAll('.bg-green-500');
      expect(greenBars.length).toBeGreaterThan(0);
    });

    it('shows red progress bar for low stats', () => {
      useVirtualPet.mockReturnValue({
        pet: { ...mockVirtualPet, energy: 20 },
        loading: false,
        mood: 'tired',
        level: 5,
        isHungry: false,
        isTired: true,
        isSad: false,
        needsAttention: false,
        performAction: mockPerformAction,
        actionCooldowns: {},
        feed: mockFeed,
        play: mockPlay,
        rest: mockRest,
        treat: mockTreat,
        groom: mockGroom,
      });

      render(<VirtualPet realPet={mockRealPet} />);

      // With energy at 20%, should have red bar
      const redBars = document.querySelectorAll('.bg-red-500');
      expect(redBars.length).toBeGreaterThan(0);
    });
  });
});
