import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiModal from '../AiModal';

// Mock dependencies
vi.mock('../../utils/breedKnowledge', () => ({
  getBreedSpecificResponse: vi.fn(),
  BREED_INFO: {}
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AiModal Security Tests', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sanitizes HTML input to prevent XSS', async () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    // Attempt XSS
    fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });
    fireEvent.click(sendButton);

    // Check that the message in the DOM is sanitized (rendered as text, not HTML)
    // The component renders message.content in a p tag.
    // We expect the text content to be the sanitized version.
    await waitFor(() => {
        const messages = screen.getAllByText((content, element) => {
            return element.tagName.toLowerCase() === 'p' &&
                   content.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
        });
        expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('blocks profanity with validation error', async () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    // Use a bad word (from the profanity list in dataValidation.js)
    fireEvent.change(input, { target: { value: 'This is damn bad' } });
    fireEvent.click(sendButton);

    // Check for error message
    expect(screen.getByText('Please keep the conversation family-friendly. Profanity is not allowed.')).toBeInTheDocument();

    // Verify message was NOT added to the chat
    // The initial message is "Hi! I'm your DogTale AI assistant..."
    // If sent, there would be a user message.
    const userMessages = screen.queryByText('This is damn bad');
    expect(userMessages).not.toBeInTheDocument();
  });

  it('clears error when typing new input', async () => {
    render(<AiModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    // Trigger error
    fireEvent.change(input, { target: { value: 'damn' } });
    fireEvent.click(sendButton);
    expect(screen.getByText('Please keep the conversation family-friendly. Profanity is not allowed.')).toBeInTheDocument();

    // Type something new
    fireEvent.change(input, { target: { value: 'Hello' } });

    // Error should be gone
    expect(screen.queryByText('Please keep the conversation family-friendly. Profanity is not allowed.')).not.toBeInTheDocument();
  });
});
