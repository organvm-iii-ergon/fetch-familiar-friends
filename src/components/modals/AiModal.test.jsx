import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AiModal from "./AiModal";

// Mock dependencies
vi.mock("../../utils/breedKnowledge", () => ({
  getBreedSpecificResponse: vi.fn(() => "Mocked breed response"),
}));

// Mock Modal since it uses framer-motion and portals
vi.mock("./Modal", () => ({
  default: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));

describe("AiModal", () => {
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders correctly when open", () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "AI Assistant" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ask me anything about dogs..."),
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<AiModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays initial welcome message", () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);
    expect(
      screen.getByText(/Hi! I'm your DogTale AI assistant/),
    ).toBeInTheDocument();
  });

  it("updates input value on change", () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);
    const input = screen.getByPlaceholderText("Ask me anything about dogs...");
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(input.value).toBe("Hello");
  });

  it("shows typing indicator with accessible text", async () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);
    const input = screen.getByPlaceholderText("Ask me anything about dogs...");
    const sendButton = screen.getByRole("button", { name: "Send message" });

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("AI is typing...")).toHaveClass("sr-only");
  });

  it("has accessible chat log", () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-label", "Chat history");
    expect(log).toHaveAttribute("tabIndex", "0");
  });

  it("has accessible suggestion buttons", () => {
    render(<AiModal isOpen={true} onClose={() => {}} />);
    const suggestions = screen.getAllByRole("button", { name: /Ask:/ });
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
