# GitHub Organization Configuration

This directory contains all GitHub-specific configuration files for the Fetch Familiar Friends project.

## 📂 Directory Structure

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── ci.yml             # Continuous Integration
│   ├── deploy-pages.yml   # GitHub Pages deployment
│   ├── security-scan.yml  # Security scanning
│   ├── pr-automation.yml  # PR automation and labeling
│   ├── performance.yml    # Performance testing
│   ├── stale.yml         # Stale issue management
│   ├── release.yml       # Release automation
│   └── project-automation.yml # Project board automation
│
├── ISSUE_TEMPLATE/        # Issue templates
│   ├── bug_report.yml    # Bug report template
│   ├── feature_request.yml # Feature request template
│   ├── documentation.yml  # Documentation issue template
│   └── config.yml        # Issue template configuration
│
├── DISCUSSION_TEMPLATE/   # Discussion templates
│   ├── ideas.yml         # Ideas and suggestions
│   └── show-and-tell.yml # Community showcases
│
├── lighthouse/            # Lighthouse CI configuration
│   └── config.json       # Performance testing config
│
├── project-boards/        # Project board documentation
│   └── roadmap.md        # Project board setup guide
│
├── profile/              # Organization profile
│   └── README.md         # Organization profile page
│
├── PULL_REQUEST_TEMPLATE.md # PR template
├── CODEOWNERS            # Code ownership rules
├── CODE_OF_CONDUCT.md    # Community code of conduct
├── FUNDING.yml           # Funding and sponsorship
├── SUPPORT.md            # Support and help guide
├── GOVERNANCE.md         # Project governance
├── dependabot.yml        # Dependabot configuration
├── labeler.yml          # Auto-labeling configuration
├── auto-assign.yml      # Auto-assign reviewers
└── README.md            # This file
```

## 🚀 GitHub Actions Workflows

### Core Workflows

- **CI (`ci.yml`)** - Runs on every push and PR to main
  - Linting
  - Building
  - Testing
  - Artifact upload

- **Deploy Pages (`deploy-pages.yml`)** - Deploys to GitHub Pages
  - Triggered on push to main
  - Builds production bundle
  - Deploys to gh-pages

- **Security Scan (`security-scan.yml`)** - Weekly security checks
  - Dependency review
  - NPM audit
  - CodeQL analysis
  - Secret scanning

- **PR Automation (`pr-automation.yml`)** - Automates PR workflows
  - Auto-labeling by size and files
  - PR title validation
  - Welcome message for first-time contributors
  - Reviewer assignment

- **Performance (`performance.yml`)** - Performance testing
  - Lighthouse CI
  - Bundle size analysis
  - Performance budgets

- **Stale (`stale.yml`)** - Manages stale issues and PRs
  - Marks stale after 60 days (issues)
  - Marks stale after 30 days (PRs)
  - Auto-closes after additional period

- **Release (`release.yml`)** - Automated releases
  - Triggered on version tags
  - Builds release artifacts
  - Generates changelog
  - Creates GitHub release

- **Project Automation (`project-automation.yml`)** - Project board automation
  - Auto-adds issues to project
  - Moves cards based on status
  - Labels by priority and size

## 📝 Issue Templates

We provide structured templates for different types of issues:

1. **Bug Report** - For reporting bugs
   - Description
   - Reproduction steps
   - Expected vs actual behavior
   - Environment details
   - Screenshots

2. **Feature Request** - For suggesting new features
   - Problem statement
   - Proposed solution
   - Category and priority
   - Alternative solutions
   - Success metrics

3. **Documentation** - For documentation issues
   - Documentation type
   - Issue description
   - Location
   - Suggested improvements

## 🤝 Community Health Files

### Code of Conduct
Our [Code of Conduct](CODE_OF_CONDUCT.md) based on Contributor Covenant v2.1 ensures a welcoming community.

### Contributing Guidelines
See [CONTRIBUTING.md](../CONTRIBUTING.md) in the root directory for contribution guidelines.

### Support
[SUPPORT.md](SUPPORT.md) provides guidance on:
- Getting help
- Asking questions
- Reporting bugs
- Requesting features
- Common issues

### Governance
[GOVERNANCE.md](GOVERNANCE.md) outlines:
- Project roles
- Decision-making process
- Contribution workflow
- Release process
- Conflict resolution

### Security
[SECURITY.md](../SECURITY.md) in the root directory covers:
- Supported versions
- Reporting vulnerabilities
- Security update process

## 🏷️ Labeling System

### Priority Labels
- `priority: critical` 🔴 - Immediate action required
- `priority: high` 🟠 - Important, schedule soon
- `priority: medium` 🟡 - Normal priority
- `priority: low` 🟢 - Nice to have

### Type Labels
- `type: bug` 🐛 - Bug reports
- `type: feature` ✨ - New features
- `type: enhancement` ⚡ - Improvements
- `type: documentation` 📝 - Documentation
- `type: security` 🔒 - Security issues

### Component Labels
- `component: calendar` - Calendar system
- `component: social` - Social features
- `component: ar` - AR features
- `component: virtual-pet` - Virtual pet
- `component: memorial` - Memorial services
- `component: coaching` - Coaching features
- `component: telemedicine` - Telemedicine
- `component: subscription` - Subscription system

### Size Labels (auto-applied)
- `size/xs` - Tiny changes (< 10 lines)
- `size/s` - Small changes (< 100 lines)
- `size/m` - Medium changes (< 500 lines)
- `size/l` - Large changes (< 1000 lines)
- `size/xl` - Extra large changes (> 1000 lines)

### Status Labels
- `status: needs-triage` - Needs review
- `status: blocked` - Blocked by dependencies
- `status: in-progress` - Actively working
- `status: needs-review` - Ready for review
- `status: stale` - No recent activity

### Special Labels
- `good first issue` - Good for newcomers
- `help wanted` - Community help needed
- `duplicate` - Duplicate issue
- `wontfix` - Won't be implemented
- `keep-open` - Don't mark as stale

## 🤖 Automation Features

### Dependabot
- Weekly dependency updates
- Grouped updates for React and dev dependencies
- Auto-review and assignment

### Auto-labeling
- Size labels based on PR changes
- Component labels based on files changed
- Type labels based on PR patterns

### Auto-assignment
- Reviewers assigned based on CODEOWNERS
- Round-robin assignment
- Expertise-based assignment

### Stale Management
- Auto-labels stale issues/PRs
- Provides warning before closing
- Respects `keep-open` label

## 📊 Project Boards

We use GitHub Projects for planning and tracking:

1. **Product Roadmap** - High-level features and releases
2. **Sprint Planning** - 2-week sprint cycles
3. **Feature Development** - Major feature tracking
4. **Bug Triage** - Bug management

See [project-boards/roadmap.md](project-boards/roadmap.md) for details.

## 🔐 Security

### CodeQL
Automated code scanning for:
- JavaScript security vulnerabilities
- Code quality issues
- Best practice violations

### Secret Scanning
- TruffleHog for secret detection
- Checks all commits
- Prevents credential leaks

### Dependency Scanning
- Dependabot security updates
- NPM audit in CI
- Dependency review on PRs

## 📦 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions automatically:
   - Builds release artifacts
   - Generates changelog
   - Creates GitHub release
   - Posts announcement

## 🎯 Performance Monitoring

### Lighthouse CI
- Runs on every PR
- Tests performance, accessibility, SEO
- Enforces performance budgets
- Posts results as PR comment

### Bundle Analysis
- Tracks bundle size
- Alerts on size increases
- Identifies optimization opportunities

## 💡 Tips for Contributors

1. **Before Creating PR:**
   - Read [CONTRIBUTING.md](../CONTRIBUTING.md)
   - Check if issue exists
   - Discuss major changes first

2. **PR Best Practices:**
   - Use semantic PR titles
   - Fill out PR template completely
   - Link related issues
   - Keep PRs focused and small

3. **Getting Help:**
   - Check [SUPPORT.md](SUPPORT.md)
   - Search existing discussions
   - Ask in GitHub Discussions
   - Be patient and respectful

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Projects Guide](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines)

## 🆘 Need Help?

- 📖 Read [SUPPORT.md](SUPPORT.md)
- 💬 Ask in [Discussions](https://github.com/ivi374forivi/fetch-familiar-friends/discussions)
- 🐛 Report bugs via [Issues](https://github.com/ivi374forivi/fetch-familiar-friends/issues)

---

**Maintained by the Fetch Familiar Friends team**

Last updated: November 2025
