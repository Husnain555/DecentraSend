# Contributing to DecentraSend

Thank you for your interest in contributing to DecentraSend! This guide will help you get started.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Code Style Guidelines](#code-style-guidelines)
- [Areas Where Help Is Needed](#areas-where-help-is-needed)
- [Issue Labels](#issue-labels)
- [First-Time Contributor Tips](#first-time-contributor-tips)

## Development Environment Setup

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later)
- A modern web browser (Chrome, Firefox, or Edge recommended)
- Git

### Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/Husnain555/DecentraSend.git
   cd decentrasend
   ```
3. Install dependencies and start the development server:
   ```bash
   bun install && npm run dev
   ```
4. Open the URL printed in your terminal (usually `http://localhost:5173`) to see the app running.

## Project Structure

```
decentrasend/
├── public/                   # Static site root (deploy this)
│   ├── index.html            # Main page — upload + download views
│   ├── css/
│   │   └── style.css         # Dark theme responsive UI
│   └── js/
│       ├── crypto.js         # AES-256-GCM encrypt/decrypt (Web Crypto API)
│       ├── ipfs.js           # Pinata upload + multi-gateway IPFS download
│       └── app.js            # Main app logic wiring everything together
├── docs/                     # Documentation
├── .github/                  # GitHub templates and workflows
├── package.json
├── README.md
├── LICENSE
├── SECURITY.md
├── ARCHITECTURE.md
└── CONTRIBUTING.md
```

## Submitting Pull Requests

1. Create a new branch from `main` for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes, keeping commits small and focused.
3. Write clear commit messages that explain *why* you made the change.
4. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request against the `main` branch of the upstream repository.
6. Fill out the PR template completely.
7. Wait for a review. A maintainer will review your PR and may request changes.

### PR Expectations

- Each PR should address a single concern (one bug fix, one feature, etc.).
- Include tests if you are adding new functionality.
- Make sure the existing tests pass before submitting.
- Link any related issues in the PR description.

## Code Style Guidelines

DecentraSend follows a deliberate, minimal approach to its tech stack:

- **Vanilla JavaScript only** -- no frameworks (React, Vue, Angular, etc.).
- **ES modules** (`import`/`export`) for all module boundaries.
- Use `const` by default; use `let` only when reassignment is necessary. Never use `var`.
- Prefer `async`/`await` over raw Promise chains.
- Use meaningful, descriptive variable and function names.
- Keep functions short and focused on a single responsibility.
- Add JSDoc comments for all exported functions.
- Use 2-space indentation.
- Use single quotes for strings.
- Always use strict equality (`===` and `!==`).
- No semicolons (the project relies on ASI).

If you are unsure about a style choice, look at the existing code for guidance.

## Areas Where Help Is Needed

We especially welcome contributions in the following areas:

### WebRTC Peer-to-Peer
- Direct browser-to-browser file transfer using WebRTC data channels.
- NAT traversal and signaling improvements.
- Connection reliability and fallback strategies.

### Streaming Encryption
- Streaming encrypt/decrypt for large files to reduce memory usage.
- Support for additional encryption algorithms.
- Key exchange protocol improvements.

### Mobile Optimization
- Responsive UI improvements for small screens.
- Touch interaction refinements.
- Performance tuning on mobile browsers (memory and CPU constraints).

### Internationalization (i18n)
- Extracting all user-facing strings into locale files.
- Adding translations for new languages.
- Right-to-left (RTL) layout support.

## Issue Labels

| Label | Description |
|---|---|
| `bug` | Something is not working as expected |
| `enhancement` | A new feature or improvement to existing functionality |
| `good first issue` | A manageable task well-suited for newcomers |
| `help wanted` | The maintainers would appreciate community help here |
| `documentation` | Improvements or additions to documentation |
| `p2p` | Related to WebRTC peer-to-peer transfers |
| `encryption` | Related to encryption and cryptography |
| `mobile` | Related to mobile device support |
| `i18n` | Related to internationalization and translations |
| `wontfix` | This issue will not be addressed |
| `duplicate` | This issue already exists elsewhere |

## First-Time Contributor Tips

- **Start small.** Look for issues labeled `good first issue` to find tasks that are scoped for newcomers.
- **Ask questions.** If something is unclear, open a discussion or comment on the issue. No question is too basic.
- **Read existing code first.** Spend some time reading through the codebase before making changes. Understanding the patterns in use will make your contribution smoother.
- **Run the app locally.** Make sure you can build and run DecentraSend before you start writing code.
- **Test your changes.** Verify that your changes work in at least two different browsers.
- **Be patient with reviews.** Maintainers are volunteers. Reviews may take a few days.
- **Don't be afraid to submit a draft PR.** If you want early feedback on your approach, open a draft pull request and ask for input.

Welcome aboard, and thank you for helping make decentralized file transfer better for everyone!
