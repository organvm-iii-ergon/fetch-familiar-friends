import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiModal from './AiModal';

// Mock Modal since it uses portals/framer-motion which can be tricky in tests
vi.mock('./Modal', () => ({
  default: ({ isOpen, children, title, onClose }) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-modal="true" aria-label={title}>
        <button onClick={onClose} aria-label="Close modal">Close</button>
        {children}
      </div>
    );
  }
}));

// Mock breed knowledge
vi.mock('../../utils/breedKnowledge', () => ({
  getBreedSpecificResponse: () => 'Mock breed response'
}));

describe('AiModal Accessibility', () => {
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('should render the chat container with correct accessibility roles', () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);

    const chatLog = screen.getByLabelText('Chat history');
    expect(chatLog).toBeInTheDocument();
    expect(chatLog).toHaveAttribute('role', 'log');
    expect(chatLog).toHaveAttribute('aria-live', 'polite');
    expect(chatLog).toHaveAttribute('tabIndex', '0');
  });

  it('should show typing indicator with accessible text', async () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Hello' } });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Should see typing indicator
    const typingStatus = screen.getByRole('status');
    expect(typingStatus).toBeInTheDocument();
    expect(typingStatus).toHaveTextContent('AI is typing');
  });
});
