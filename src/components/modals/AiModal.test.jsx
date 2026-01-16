import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AiModal from './AiModal';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AiModal Accessibility', () => {
  it('has correct ARIA attributes for chat history', () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);

    const chatHistory = screen.getByRole('log');
    expect(chatHistory).toBeInTheDocument();
    expect(chatHistory).toHaveAttribute('aria-live', 'polite');
    expect(chatHistory).toHaveAttribute('aria-label', 'Chat history');
    expect(chatHistory).toHaveAttribute('tabIndex', '0');
  });

  it('shows typing indicator with accessible text', async () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    const typingIndicator = await screen.findByRole('status');
    expect(typingIndicator).toBeInTheDocument();
    expect(typingIndicator).toHaveTextContent('AI is typing...');
  });
});
