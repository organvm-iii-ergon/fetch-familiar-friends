<!-- AI Handoff Header -->
**AI Handoff Overview:** This document is structured for seamless agent transitions. Coordinate updates with the orchestration plan in `AGENT_ORCHESTRATION.md`.
<!-- /AI Handoff Header -->

# Attend Our Familiar Friends

🐾 **An interactive, personalized, generative daily dog calendar app**  
Pet calendar, tracker, reminder, and social hub for dog lovers.

## 📚 Documentation

This repository contains comprehensive planning and documentation for the project.

**Start Here**: [📖 Complete Project Documentation](docs/PROJECT.md)

### Quick Links

- **[Roadmap & Planning](docs/roadmap/)** - Strategic plans and product roadmaps
- **[Technical Specs](docs/technical/)** - Implementation details and architecture
- **[Archive](docs/archive/)** - Previous iterations and version history
- **[ChatPRD Documents](ChatPRD/)** - Product requirements and brainstorming documents

### AI Agent Documentation

- `DOC_INDEX.md` — Cross-reference map for every knowledge artifact in the repository
- `ROADMAP.md` — Delivery plan and milestones aligned with upcoming releases
- `AGENT_ORCHESTRATION.md` — Task routing and ownership across collaborating agents
- `ANNOTATED_BIBLIOGRAPHY.md` — External research on adjacent implementations and inspiration repos
- `ECOSYSTEM_OVERVIEW.md` — Surrounding tools, rituals, and governance practices

## 🎯 Project Status

**Phase**: Active Development  
**Version**: 0.2.0

## 🚀 What's This About?

We're building a delightful daily experience for dog owners:
- 🐶 Personalized daily dog content
- 📅 Care tracking and reminders  
- 💬 Social community features
- 🤖 AI-powered content generation

## 🛠️ Development

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Project Structure

```
├── src/
│   ├── components/
│   │   ├── calendar/       # Calendar-related components
│   │   ├── modals/         # Modal components
│   │   └── ErrorBoundary.jsx
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── styles/
│   │   └── globals.css     # Global styles and Tailwind
│   ├── App.jsx             # Main application component
│   └── index.jsx           # Application entry point
├── docs/                   # Project documentation
├── ChatPRD/                # Product requirements and planning
└── public/                 # Static assets
```

For detailed development guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📖 Getting Started

1. Read the [Project Documentation](docs/PROJECT.md)
2. Explore the [Main Roadmap](ROADMAP.md)
3. Check out the [Technical Specifications](docs/technical/)
4. Review [Agent Orchestration](AGENT_ORCHESTRATION.md) for AI collaboration

## 🗂️ Repository Organization

```
├── docs/
│   ├── PROJECT.md          # Main project documentation
│   ├── roadmap/            # Planning and roadmaps
│   ├── technical/          # Technical specifications
│   └── archive/            # Previous iterations
├── ChatPRD/                # Product requirement documents
├── AGENT_ORCHESTRATION.md  # AI agent coordination
├── DOC_INDEX.md            # Documentation index
└── README.md               # This file
```

## 🤖 Operating Rhythm (For AI Agents)

1. Capture new information in domain-specific files under `ChatPRD/` and register it in `DOC_INDEX.md`
2. Record planning decisions, risks, and deliverables within `ROADMAP.md`
3. Use `AGENT_ORCHESTRATION.md` to assign owners (@Gemini, @Copilot, @Codex, OS-Agents) and track cross-agent review loops
4. Reference `ANNOTATED_BIBLIOGRAPHY.md` and `ECOSYSTEM_OVERVIEW.md` for best-practice alignment

## 🤝 Contributing

We welcome contributions from the community! Please see our:

- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](.github/CODE_OF_CONDUCT.md)** - Community standards
- **[Support Guide](.github/SUPPORT.md)** - Getting help
- **[Governance](.github/GOVERNANCE.md)** - Project governance
- **[Security Policy](SECURITY.md)** - Reporting vulnerabilities

### Quick Contribution Links

- 🐛 [Report a Bug](https://github.com/ivi374forivi/fetch-familiar-friends/issues/new?template=bug_report.yml)
- ✨ [Request a Feature](https://github.com/ivi374forivi/fetch-familiar-friends/issues/new?template=feature_request.yml)
- 💬 [Join Discussions](https://github.com/ivi374forivi/fetch-familiar-friends/discussions)
- 🎯 [View Project Board](https://github.com/orgs/ivi374forivi/projects/1)

## 🏗️ GitHub Organization Features

This project leverages comprehensive GitHub organization features:

- **Automated CI/CD** - GitHub Actions workflows for testing, building, and deployment
- **Security Scanning** - CodeQL, Dependabot, and secret detection
- **Project Boards** - Organized planning and tracking
- **Issue Templates** - Structured bug reports and feature requests
- **PR Automation** - Auto-labeling, size detection, and reviewer assignment
- **Performance Testing** - Lighthouse CI and bundle analysis
- **Release Automation** - Automated versioning and changelog generation
- **Stale Management** - Automatic cleanup of inactive issues/PRs

See [.github/README.md](.github/README.md) for complete details.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Last updated: November 2025*

<!-- AI Handoff Footer -->
**Next Steps:** Confirm alignment with `ROADMAP.md` and log cross-agent feedback before closing this document.
<!-- /AI Handoff Footer -->
