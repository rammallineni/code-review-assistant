# AI Code Review Assistant

A production-grade, AI-powered code review platform that integrates with GitHub to automatically analyze pull requests, detect potential issues, and deliver structured, actionable feedback. Built with a modern full-stack architecture and deployed for real-world use.

**[Live Demo](https://ai-cra.vercel.app)** · **[API Health Check](https://ai-cra-api.onrender.com/health)**

---

## The Problem

Manual code reviews are time-consuming and inconsistent. Reviewers often miss edge cases, security vulnerabilities, or style violations—especially under tight deadlines. Teams need a way to augment human review with automated, intelligent analysis that catches issues early and maintains code quality standards.

## What This Project Does

AI Code Review Assistant connects to your GitHub repositories and automatically reviews every pull request using Anthropic's Claude API. When a PR is opened or updated, the system:

- Analyzes code changes for bugs, security issues, and anti-patterns
- Generates structured feedback with severity levels and line-specific comments
- Posts review comments directly to the GitHub PR
- Tracks review history and metrics per repository

---

## Key Features

- **GitHub OAuth Authentication** — Secure login with granular repository permissions
- **Webhook-Driven Architecture** — Real-time PR detection via GitHub webhooks
- **AI-Powered Analysis** — Leverages Anthropic Claude for context-aware code review
- **Structured Feedback** — Categorized issues (bug, security, style, performance) with severity ratings
- **Repository Management** — Connect/disconnect repos, view review history
- **Review Dashboard** — Track metrics, filter by status, and drill into individual reviews
- **Production Deployment** — Fully deployed with CI/CD, environment separation, and monitoring

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  GitHub.com     │────────▶│  Backend API     │────────▶│  PostgreSQL     │
│  (Webhooks)     │         │  (Express/Node)  │         │  (Neon)         │
│                 │◀────────│                  │◀────────│                 │
└─────────────────┘         └────────┬─────────┘         └─────────────────┘
                                     │
                                     │ AI Analysis
                                     ▼
                            ┌──────────────────┐
                            │                  │
                            │  Anthropic API   │
                            │  (Claude)        │
                            │                  │
                            └──────────────────┘

┌─────────────────┐
│                 │
│  React Frontend │─────────▶ Backend API (REST)
│  (Vercel)       │
│                 │
└─────────────────┘
```

---

## Pull Request Review Workflow

1. **User connects a repository** via the dashboard after GitHub OAuth login
2. **Webhook is registered** on the repository for `pull_request` events
3. **PR is opened/updated** on GitHub, triggering a webhook POST to the backend
4. **Backend fetches the diff** using GitHub's API and the user's access token
5. **Diff is sent to Anthropic Claude** with a structured prompt for code review
6. **AI response is parsed** into categorized issues with severity and line numbers
7. **Review is stored** in PostgreSQL with full metadata
8. **Comments are posted** back to the GitHub PR via the Checks/Comments API
9. **Dashboard updates** to reflect the new review status and findings

---

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- TanStack Query for data fetching
- Tailwind CSS for styling

### Backend
- Node.js with TypeScript
- Express.js REST API
- Prisma ORM for database access
- GitHub OAuth (Passport.js)
- Anthropic SDK for AI integration

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Database:** Neon (Serverless PostgreSQL)
- **Version Control:** GitHub
- **Secrets Management:** Environment variables per platform

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Stores GitHub user info, OAuth tokens, and preferences |
| `repositories` | Tracks connected repos and webhook registration status |
| `reviews` | Contains review metadata, status, and aggregated metrics |
| `review_comments` | Individual findings with severity, category, and line references |
| `webhook_events` | Logs incoming webhook payloads for debugging and replay |

---

## Example API Endpoints

```
Authentication
  GET   /auth/github          → Initiates GitHub OAuth flow
  GET   /auth/github/callback → Handles OAuth callback
  POST  /auth/logout          → Clears session

Repositories
  GET   /api/repositories           → List connected repositories
  POST  /api/repositories/:id/connect    → Register webhook and enable reviews
  DELETE /api/repositories/:id/disconnect → Remove webhook

Reviews
  GET   /api/reviews              → List reviews with filters
  GET   /api/reviews/:id          → Get review details with comments

Webhooks
  POST  /webhooks/github          → Receives GitHub webhook events
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or Neon connection string)
- GitHub OAuth App credentials
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-cra.git
cd ai-cra

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables (see below)
cp .env.example .env

# Run database migrations
cd backend && npx prisma migrate dev

# Start development servers
npm run dev  # In both /backend and /frontend
```

---

## Environment Variables

### Backend
```
DATABASE_URL
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_WEBHOOK_SECRET
ANTHROPIC_API_KEY
SESSION_SECRET
FRONTEND_URL
```

### Frontend
```
VITE_API_URL
VITE_GITHUB_CLIENT_ID
```

---

## Why This Project Is Technically Interesting

**OAuth with Webhooks** — Implements the full GitHub OAuth flow with token refresh, then uses those tokens to dynamically register webhooks on user repositories. This requires careful handling of permissions, token storage, and webhook signature verification.

**Event-Driven Architecture** — The webhook handler decouples event ingestion from processing. Incoming events are validated, logged, and queued for async analysis, allowing the system to handle bursts of PR activity without blocking.

**Structured AI Prompting** — The Anthropic integration uses carefully designed prompts that produce consistent, parseable output. The system extracts severity, category, line numbers, and suggested fixes from raw AI responses.

**Production Hardening** — Includes rate limiting, error boundaries, graceful degradation when AI is unavailable, and comprehensive logging. The database schema supports idempotent webhook processing to handle GitHub's retry behavior.

**Full Deployment Pipeline** — Separate staging and production environments with environment-specific configurations. Frontend deploys automatically on Vercel; backend uses Render with health checks.

---

## Future Improvements

- **Batch Review Mode** — Analyze multiple PRs in a single request for org-wide audits
- **Custom Review Rules** — Allow users to define project-specific patterns to flag
- **Review Templates** — Pre-configured prompts for different review styles (security-focused, performance-focused)
- **Metrics Dashboard** — Track review trends, common issues, and team velocity over time
- **Slack/Discord Notifications** — Alert channels when reviews complete or critical issues are found
- **Self-Hosted Option** — Docker Compose setup for teams that can't use external services

---

## Author

Built by **[Your Name]**

- GitHub: [github.com/yourusername](https://github.com/yourusername)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)

---

*This project demonstrates full-stack development, third-party API integration, and production deployment practices. It is actively maintained and open to feedback.*
