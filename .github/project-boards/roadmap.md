# GitHub Project Board Configuration

This document describes the GitHub Projects setup for organizing work.

## Main Project Board: Product Roadmap

**View:** https://github.com/orgs/ivi374forivi/projects/1

### Columns

1. **📋 Backlog**
   - All new issues start here
   - Not yet prioritized
   - Needs triage and discussion

2. **🎯 Planned**
   - Approved for development
   - Prioritized and refined
   - Ready for assignment

3. **🚀 In Progress**
   - Actively being worked on
   - Has an assignee
   - Linked to active PR

4. **👀 In Review**
   - PR submitted
   - Awaiting code review
   - Testing in progress

5. **✅ Done**
   - Merged to main
   - Deployed to production
   - Completed and closed

6. **❄️ On Hold**
   - Blocked by dependencies
   - Waiting for decisions
   - Temporarily paused

### Labels for Prioritization

- `priority: critical` 🔴 - Must fix/implement immediately
- `priority: high` 🟠 - Important, schedule soon
- `priority: medium` 🟡 - Normal priority
- `priority: low` 🟢 - Nice to have, when time permits

### Labels for Components

- `component: calendar`
- `component: social`
- `component: ar`
- `component: virtual-pet`
- `component: memorial`
- `component: coaching`
- `component: telemedicine`
- `component: subscription`
- `component: gameplay`

### Labels for Type

- `type: bug` 🐛
- `type: feature` ✨
- `type: enhancement` ⚡
- `type: documentation` 📝
- `type: refactoring` ♻️
- `type: security` 🔒
- `type: performance` 🚀

### Automation Rules

1. **New Issues** → Automatically added to Backlog
2. **Issue Assigned** → Move to In Progress
3. **PR Created** → Move to In Review
4. **PR Merged** → Move to Done and close issue
5. **Issue Closed** → Archive after 30 days

## Sprint Planning Board

**View:** https://github.com/orgs/ivi374forivi/projects/2

### Sprints

- 2-week sprint cycles
- Sprint planning every other Monday
- Sprint retrospective every other Friday

### Sprint Columns

1. **Sprint Backlog** - Committed for this sprint
2. **In Progress** - Currently working
3. **Blocked** - Needs help
4. **Review** - Ready for testing
5. **Done** - Completed this sprint

## Feature Development Board

**View:** https://github.com/orgs/ivi374forivi/projects/3

Tracks major features from conception to launch:

1. **Ideas** - Feature proposals
2. **Design** - UX/UI design phase
3. **Development** - Implementation
4. **Testing** - QA and user testing
5. **Launch** - Released to production
6. **Monitor** - Post-launch monitoring

## Bug Triage Board

**View:** https://github.com/orgs/ivi374forivi/projects/4

Quick triage for bugs:

1. **New** - Needs investigation
2. **Confirmed** - Bug verified
3. **Assigned** - Developer assigned
4. **Fixed** - Fix deployed
5. **Verified** - Fix confirmed

## How to Use

### For Contributors

1. Check the **Roadmap** for planned work
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on an issue to get it assigned
4. Move the issue card as you progress

### For Maintainers

1. Triage new issues weekly
2. Plan sprints bi-weekly
3. Review project boards in standups
4. Update roadmap monthly

### For Users

1. View the **Roadmap** to see what's coming
2. Vote on features by reacting to issues (👍)
3. Follow specific features you're interested in

## Milestones

Milestones track major releases:

- **v0.3.0** - Enhanced Social Features
- **v0.4.0** - AR and Gameplay Expansion
- **v0.5.0** - Premium Services Launch
- **v1.0.0** - Full Platform Launch

## Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Project Automation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project)
