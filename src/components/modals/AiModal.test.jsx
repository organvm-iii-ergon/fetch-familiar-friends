import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiModal from './AiModal';

// Mock the breed knowledge util
vi.mock('../../utils/breedKnowledge', () => ({
  getBreedSpecificResponse: vi.fn((breed, topic) => `Mock response for ${breed} about ${topic}`)
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AiModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly when open', () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);
    // Use more specific query to avoid ambiguity (Header vs Message)
    expect(screen.getByRole('heading', { name: /AI Assistant/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask me anything about dogs...')).toBeInTheDocument();
  });

  it('validates input length', async () => {
    const user = userEvent.setup();
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Ask me anything about dogs...');
    const longText = 'a'.repeat(501);

    await user.type(input, longText);
    expect(input).toHaveValue(longText.slice(0, 500)); // Should be truncated by maxLength attribute
  });

  it('should block profanity and show inline error', async () => {
    const user = userEvent.setup();
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Ask me anything about dogs...');
    const sendButton = screen.getByLabelText('Send message');

    // Attempt to send a message with profanity
    await user.type(input, 'This is a damn test');
    await user.click(sendButton);

    // Expect inline error to be displayed
    // Using findByRole because state update is async, though we could use screen.getByText inside waitFor
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/family-friendly/i);

    // Verify message was not added
    const messages = screen.queryAllByText('This is a damn test');
    const chatMessages = messages.filter(el => el.tagName === 'P');
    expect(chatMessages.length).toBe(0);

    // Verify error clears on typing
    await user.type(input, 'Sorry');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
