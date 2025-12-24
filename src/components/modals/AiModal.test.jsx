import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AiModal from './AiModal';
import * as validationUtils from '../../utils/dataValidation';

// Mock the validation utils
vi.mock('../../utils/dataValidation', async () => {
  const actual = await vi.importActual('../../utils/dataValidation');
  return {
    ...actual,
    isFamilyFriendly: vi.fn(),
  };
});

// Mock getBreedSpecificResponse
vi.mock('../../utils/breedKnowledge', () => ({
  getBreedSpecificResponse: vi.fn(() => null),
}));

// Mock window.alert
window.alert = vi.fn();

describe('AiModal Security Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentBreed: 'Beagle',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default implementations
    validationUtils.isFamilyFriendly.mockReturnValue(true);
  });

  it('should validate input for family friendliness', async () => {
    validationUtils.isFamilyFriendly.mockReturnValue(false);

    render(<AiModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('Ask me anything about dogs...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Bad words' } });
    fireEvent.click(sendButton);

    expect(validationUtils.isFamilyFriendly).toHaveBeenCalledWith('Bad words');
    expect(window.alert).toHaveBeenCalledWith('Please keep the conversation friendly! 🐾');
    expect(input.value).toBe('Bad words'); // Should not clear input
  });
});
