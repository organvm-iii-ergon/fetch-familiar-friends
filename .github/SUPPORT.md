# Support

Thank you for using Fetch Familiar Friends! 🐾

This document explains how to get help with the project.

## Getting Help

### 📚 Documentation

Before asking for help, please check our comprehensive documentation:

- **[Project Documentation](../docs/PROJECT.md)** - Main project overview and guides
- **[Technical Specifications](../docs/technical/)** - Detailed technical documentation
- **[Roadmap](../ROADMAP.md)** - Project plans and upcoming features
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute to the project

### 💬 Discussions

For general questions, ideas, and community discussions:

1. Visit our [GitHub Discussions](https://github.com/ivi374forivi/fetch-familiar-friends/discussions)
2. Search existing discussions to see if your question has been answered
3. Create a new discussion if needed:
   - **Q&A** - Ask questions about using the project
   - **Ideas** - Share feature ideas and suggestions
   - **Show and Tell** - Share what you've built
   - **General** - Everything else

### 🐛 Bug Reports

If you've found a bug:

1. Check [existing issues](https://github.com/ivi374forivi/fetch-familiar-friends/issues) to see if it's already reported
2. If not, [create a new issue](https://github.com/ivi374forivi/fetch-familiar-friends/issues/new/choose) using our bug report template
3. Provide as much detail as possible (see the template for guidance)

### ✨ Feature Requests

Have an idea for a new feature?

1. Check [existing feature requests](https://github.com/ivi374forivi/fetch-familiar-friends/issues?q=is%3Aissue+label%3Aenhancement)
2. If your idea is new, [create a feature request](https://github.com/ivi374forivi/fetch-familiar-friends/issues/new/choose)
3. Explain the problem you're trying to solve and your proposed solution

## Quick Links

| Resource | Link |
|----------|------|
| 📖 Documentation | [docs/PROJECT.md](../docs/PROJECT.md) |
| 🐛 Bug Reports | [Create Issue](https://github.com/ivi374forivi/fetch-familiar-friends/issues/new/choose) |
| 💡 Feature Requests | [Create Issue](https://github.com/ivi374forivi/fetch-familiar-friends/issues/new/choose) |
| 💬 Discussions | [GitHub Discussions](https://github.com/ivi374forivi/fetch-familiar-friends/discussions) |
| 🔒 Security Issues | [Security Policy](../SECURITY.md) |
| 🤝 Contributing | [Contributing Guide](../CONTRIBUTING.md) |

## Response Times

We're a community-driven project, so response times may vary:

- **Bug Reports**: We aim to acknowledge within 1-3 business days
- **Feature Requests**: We aim to review within 1 week
- **Pull Requests**: We aim to provide initial feedback within 1 week
- **Discussions**: Community members typically respond within 1-2 days

## Community Guidelines

When seeking support:

- ✅ Be respectful and patient
- ✅ Search before posting
- ✅ Provide clear, detailed information
- ✅ Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- ✅ Use appropriate channels (issues vs discussions)

## Common Issues

### Installation Problems

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Ensure you're using the correct Node.js version
node --version  # Should be 18.x or 20.x

# Clean build
npm run clean
npm run build
```

### Development Server Issues

```bash
# Kill any processes using port 5173
lsof -ti:5173 | xargs kill -9

# Restart dev server
npm run dev
```

## Additional Resources

- **[Changelog](../CHANGELOG.md)** - See what's new in each release
- **[Roadmap](../ROADMAP.md)** - Future plans and priorities
- **[Agent Orchestration](../AGENT_ORCHESTRATION.md)** - AI collaboration guidelines

## Commercial Support

For commercial support, custom development, or consulting:

- Email: [INSERT CONTACT EMAIL]
- GitHub Sponsors: [@ivi374forivi](https://github.com/sponsors/ivi374forivi)

---

**Thank you for being part of our community!** 🐾

We're here to help make your experience with Fetch Familiar Friends as smooth as possible.
