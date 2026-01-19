import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AiModal from './AiModal';
import * as DataValidation from '../../utils/dataValidation';

// Mock dependencies
vi.mock('../../utils/breedKnowledge', () => ({
  getBreedSpecificResponse: vi.fn(),
}));

vi.mock('../../utils/dataValidation', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isFamilyFriendly: vi.fn(),
    sanitizeInput: vi.fn((str) => str),
  };
});

describe('AiModal Security', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView as it's not implemented in JSDOM
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate user input using isFamilyFriendly', async () => {
    // Setup - allow clean input
    vi.mocked(DataValidation.isFamilyFriendly).mockReturnValue(true);

    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(input, { target: { value: 'Hello doggy' } });
    fireEvent.click(sendButton);

    expect(DataValidation.isFamilyFriendly).toHaveBeenCalledWith('Hello doggy');
  });

  it('should block profanity and show error message', async () => {
    // Setup - block profanity
    vi.mocked(DataValidation.isFamilyFriendly).mockReturnValue(false);

    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(input, { target: { value: 'Bad words' } });
    fireEvent.click(sendButton);

    // Validation should be called
    expect(DataValidation.isFamilyFriendly).toHaveBeenCalledWith('Bad words');

    // Should NOT clear input (so user can fix it)
    expect(input.value).toBe('Bad words');

    // Should show error message
    // We expect some error text to appear. The exact text depends on implementation.
    // We'll search for likely error text.
    expect(screen.getByText(/family-friendly/i)).toBeInTheDocument();
  });

  it('should sanitize input before processing', async () => {
    // Setup - allow input but verify sanitization
    vi.mocked(DataValidation.isFamilyFriendly).mockReturnValue(true);
    const mockSanitize = vi.mocked(DataValidation.sanitizeInput);
    mockSanitize.mockReturnValue('Sanitized Input');

    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(input, { target: { value: '<script>alert(1)</script>' } });
    fireEvent.click(sendButton);

    expect(mockSanitize).toHaveBeenCalledWith('<script>alert(1)</script>');

    // The rendered message should be the sanitized one
    // Note: We need to wait for state update
    await waitFor(() => {
        expect(screen.getByText('Sanitized Input')).toBeInTheDocument();
    });
  });
});
