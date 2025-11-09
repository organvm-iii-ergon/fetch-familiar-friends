# Contributing to DogTale Daily

Thank you for your interest in contributing to DogTale Daily! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js (version 18 or higher)
- npm (version 9 or higher)

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ivi374forivi/fetch-familiar-friends.git
   cd fetch-familiar-friends
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Development Workflow

### Code Quality

Before submitting any changes, ensure your code passes all checks:

1. **Linting**: Run ESLint to check for code quality issues
   ```bash
   npm run lint
   ```

2. **Building**: Ensure the project builds successfully
   ```bash
   npm run build
   ```

3. **Manual Testing**: Test your changes in the browser
   ```bash
   npm run dev
   ```

### Code Standards

- **ES6+ JavaScript**: Use modern JavaScript features
- **React Hooks**: Prefer functional components with hooks
- **PropTypes**: Always include PropTypes validation for components
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Error Handling**: Implement proper error boundaries and try-catch blocks
- **Loading States**: Always show loading indicators for async operations
- **No Console Logs**: Remove console.log statements before committing (except for intentional error logging)

### Component Structure

```jsx
import { useState } from 'react';
import PropTypes from 'prop-types';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);

  // Component logic here

  return (
    <div>
      {/* JSX here */}
    </div>
  );
};

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number
};

MyComponent.defaultProps = {
  prop2: 0
};

export default MyComponent;
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the existing color scheme and design patterns
- Ensure responsive design (mobile-first approach)
- Add focus states for accessibility
- Use the custom CSS classes defined in `globals.css`:
  - `.glass-effect` for frosted glass effect
  - `.rounded-custom` and `.rounded-custom-lg` for consistent border radius
  - `.preserve-3d` for 3D transformations

### Git Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with descriptive messages:
   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   ```

3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

### Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes (not affecting code meaning)
- `refactor:` for code refactoring
- `test:` for test additions or changes
- `chore:` for maintenance tasks and tooling

Format: `<type>: <description>`

Examples:
- `feat: add theme selector component with accessibility support`
- `fix: resolve image loading timeout and retry logic`
- `docs: update error boundary usage in README`
- `chore: update dependencies to latest versions`

## Security Guidelines

### API Calls

- Always use `AbortController` for fetch requests with timeouts
- Implement proper error handling and retry logic
- Validate responses before using data
- Use HTTPS endpoints only

### Content Security Policy

The project includes a Content Security Policy (CSP) in `index.html`. When adding new external resources:

1. Update the CSP meta tag
2. Test that resources load correctly
3. Use the most restrictive policy possible

### Dependencies

- Regularly check for security vulnerabilities: `npm audit`
- Keep dependencies up to date
- Review dependency changes in package-lock.json

## Testing

Currently, the project doesn't have automated tests. When adding tests:

- Write tests for critical functionality
- Include edge cases and error scenarios
- Test accessibility features
- Test keyboard navigation

## Accessibility Checklist

When adding new features, ensure:

- [ ] All interactive elements are keyboard accessible
- [ ] ARIA labels are present on all buttons and interactive elements
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Error messages are announced to screen readers
- [ ] Loading states are communicated to assistive technologies

## Questions or Issues?

If you have questions or run into issues:

1. Check existing issues on GitHub
2. Create a new issue with a clear description
3. Include steps to reproduce (for bugs)
4. Include screenshots or recordings if relevant

## Code Review Process

All Pull Requests will be reviewed for:

- Code quality and standards compliance
- Functionality and correctness
- Performance implications
- Security considerations
- Accessibility compliance
- Documentation completeness

Thank you for contributing to DogTale Daily! 🐾
