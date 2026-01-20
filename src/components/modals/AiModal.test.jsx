import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiModal from './AiModal';

// Mock breed knowledge
vi.mock('../../utils/breedKnowledge', () => ({
  getBreedSpecificResponse: vi.fn(),
  getBreedInfo: vi.fn(),
  BREED_INFO: {}
}));

describe('AiModal Accessibility', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
  });

  it('renders chat history with correct ARIA attributes', () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const chatHistory = screen.getByRole('log');
    expect(chatHistory).toBeInTheDocument();
    expect(chatHistory).toHaveAttribute('aria-live', 'polite');
    expect(chatHistory).toHaveAttribute('aria-atomic', 'false');
    expect(chatHistory).toHaveAttribute('aria-label', 'Chat history');
    expect(chatHistory).toHaveAttribute('tabIndex', '0');
  });

  it('displays typing indicator with accessible text', async () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Typing indicator should appear
    const status = await screen.findByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('AI is typing...');

    // Wait for it to disappear (timeout is random 1-2s in component)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
