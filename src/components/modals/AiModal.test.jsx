import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiModal from './AiModal';

// Mock dependencies
vi.mock('./Modal', () => ({
  default: ({ children, isOpen, onClose, title }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button onClick={onClose} aria-label="Close">X</button>
        {children}
      </div>
    ) : null
  ),
}));

vi.mock('../../utils/breedKnowledge', () => ({
  getBreedSpecificResponse: vi.fn(),
}));

describe('AiModal Security Tests', () => {
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject profanity and show error message', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<AiModal isOpen={true} onClose={handleClose} />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    // Type a message with profanity
    const badMessage = 'This is shit code';
    await user.type(input, badMessage);

    // Send it
    await user.click(sendButton);

    // An error message should be displayed
    await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please keep the conversation family-friendly');
    });

    // It should NOT be added to the chat messages list
    const messages = screen.queryAllByText(badMessage);
    expect(messages.length).toBe(0);
  });

  it('should sanitize input before adding to chat', async () => {
     const user = userEvent.setup();
     const handleClose = vi.fn();

     render(<AiModal isOpen={true} onClose={handleClose} />);

     const input = screen.getByLabelText('Message input');
     const sendButton = screen.getByLabelText('Send message');

     // Type a message with HTML-like characters
     const xssMessage = '<script>alert(1)</script>';
     await user.type(input, xssMessage);

     await user.click(sendButton);

     // We expect the sanitized version to appear in the chat log
     // < becomes &lt;
     // / becomes &#x2F;
     const expectedSanitized = '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;';

     await waitFor(() => {
       expect(screen.getByText(expectedSanitized)).toBeInTheDocument();
     });

     // And ensure the original raw text is NOT in the document (except maybe in the input if it wasn't cleared, but it is cleared on send)
     expect(screen.queryByText(xssMessage)).not.toBeInTheDocument();
   });
});
