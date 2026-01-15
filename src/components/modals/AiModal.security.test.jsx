import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AiModal from './AiModal';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('AiModal Security', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent submission of profanity', () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Ask me anything about dogs.../i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    // Enter profanity
    fireEvent.change(input, { target: { value: 'This is shit' } });
    fireEvent.click(sendButton);

    // Expect the profanity NOT to be in the document
    // This assertion should FAIL before the fix
    expect(screen.queryByText('This is shit')).not.toBeInTheDocument();
  });
});
