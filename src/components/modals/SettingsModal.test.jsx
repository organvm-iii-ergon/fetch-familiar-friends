import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsModal from './SettingsModal';

describe('SettingsModal Accessibility', () => {
  const mockSettings = {
    autoSave: true,
    notifications: false,
    imageQuality: 'high',
    cacheEnabled: true,
    preloadImages: true, // This enables the preload range slider
    preloadDays: 3,
    defaultView: 'day',
    animationsEnabled: true,
    compactMode: false,
    autoTheme: false
  };

  const mockOnClose = vi.fn();
  const mockOnSettingsChange = vi.fn();

  it('associates labels with form inputs', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // These should work if labels are correctly associated
    // If not associated, these will fail
    expect(screen.getByLabelText(/default view/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preload range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image quality/i)).toBeInTheDocument();
  });
});
