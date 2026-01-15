import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiModal from './AiModal';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AiModal Accessibility', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface with correct ARIA attributes', () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    // Check for dialog role (from Modal component)
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Check for chat log
    const chatLog = screen.getByRole('log');
    expect(chatLog).toHaveAttribute('aria-label', 'Chat history');
    expect(chatLog).toHaveAttribute('aria-live', 'polite');
    expect(chatLog).toHaveAttribute('aria-atomic', 'false');
    expect(chatLog).toHaveAttribute('tabIndex', '0');
  });

  it('shows accessible typing indicator when AI is generating response', async () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Typing indicator should appear
    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveTextContent('AI is typing...');
    });

    // Wait for response (typing indicator disappears)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 4000 });
  });
});
