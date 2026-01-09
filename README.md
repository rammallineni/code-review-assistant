# 🔍 AI-Powered Code Review Assistant

<div align="center">

![Code Review Assistant](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge&logo=openai)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)

**Intelligent code review automation for GitHub pull requests using Claude AI**

[Live Demo](#) • [Documentation](#api-documentation) • [Deploy to Railway](#deployment)

</div>

---

## 🎯 Overview

AI-Powered Code Review Assistant is a sophisticated tool that automatically analyzes GitHub pull requests and provides intelligent feedback on code quality, security vulnerabilities, and best practices. Leveraging Anthropic's Claude AI, it delivers actionable insights that help developers ship better code faster.

### ✨ Key Features

- 🔐 **GitHub OAuth Integration** - Seamless authentication with your GitHub account
- 🤖 **AI-Powered Analysis** - Intelligent code review using Claude AI
- 🛡️ **Security Scanning** - Detect vulnerabilities, SQL injection, XSS, and more
- ⚡ **Performance Insights** - Identify memory leaks and inefficient algorithms
- 📊 **Analytics Dashboard** - Track trends and improvements over time
- 🔔 **Webhook Support** - Automatic reviews on new pull requests
- ⚙️ **Customizable Rules** - Configure review preferences per project
- 📱 **Responsive Design** - Works beautifully on all devices

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Library |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Vite | Build Tool |
| React Query | Data Fetching |
| Zustand | State Management |
| Framer Motion | Animations |
| Recharts | Data Visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web Framework |
| TypeScript | Type Safety |
| PostgreSQL | Primary Database |
| Redis | Caching Layer |
| JWT | Authentication |

### AI & Integrations
| Technology | Purpose |
|------------|---------|
| Anthropic Claude | AI Analysis |
| GitHub API | Repository Integration |
| OAuth 2.0 | Authentication |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Railway | Cloud Deployment |
| Docker | Containerization |
| Nginx | Static File Serving |

---

## 🖼️ Screenshots

<div align="center">

### Landing Page
*Beautiful, modern landing page with clear value proposition*

![Landing Page](screenshots/landing.png)

### Dashboard
*Comprehensive overview of your code review activity*

![Dashboard](screenshots/dashboard.png)

### Review Details
*Detailed issue breakdown with actionable suggestions*

![Review Details](screenshots/review-detail.png)

### Analytics
*Track trends and improvements over time*

![Analytics](screenshots/analytics.png)

</div>

> 📸 *Screenshots coming soon - the application is fully functional!*

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **GitHub Account** (for OAuth)
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))
- **Docker** (optional, for local databases)

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/rammallineni/ai-code-review-assistant.git
cd ai-code-review-assistant
```

#### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3. Configure Environment Variables

```bash
# Backend configuration
cp backend/env.example backend/.env

# Frontend configuration
cp frontend/env.example frontend/.env
```

Edit the `.env` files with your credentials:

**Backend `.env`:**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/code_review
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
ANTHROPIC_API_KEY=your_anthropic_api_key
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:4000
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

#### 4. Start Local Databases (Docker)

```bash
docker-compose up -d postgres redis
```

#### 5. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### 6. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Documentation:** http://localhost:4000/api/docs

---

## 🌐 Deployment

### Deploy to Railway

This project is optimized for Railway deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ai-code-review)

### Quick Railway Setup

1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Deploy backend from `backend/` directory
4. Deploy frontend from `frontend/` directory
5. Configure environment variables
6. Update GitHub OAuth callback URL

---

## 📚 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/github` | GET | Initiate GitHub OAuth |
| `/api/auth/github/callback` | GET | OAuth callback |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Logout |

### Repositories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/repositories` | GET | List connected repos |
| `/api/repositories/github` | GET | List GitHub repos |
| `/api/repositories/connect` | POST | Connect a repo |
| `/api/repositories/:id` | GET | Get repo details |
| `/api/repositories/:id` | PATCH | Update repo settings |
| `/api/repositories/:id` | DELETE | Disconnect repo |

### Reviews

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews` | GET | List reviews |
| `/api/reviews` | POST | Create new review |
| `/api/reviews/:id` | GET | Get review details |
| `/api/reviews/:id/issues` | GET | Get review issues |
| `/api/reviews/issues/:id/resolve` | POST | Mark issue resolved |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/dashboard` | GET | Full dashboard data |
| `/api/analytics/overview` | GET | Overview stats |
| `/api/analytics/timeline` | GET | Review timeline |
| `/api/analytics/categories` | GET | Issue categories |

Full API documentation available at `/api/docs` when running the backend.

---

## 🔧 Configuration

### Review Categories

| Category | Description |
|----------|-------------|
| Security | SQL injection, XSS, sensitive data exposure |
| Performance | Memory leaks, inefficient algorithms |
| Style | Code formatting, naming conventions |
| Bugs | Logic errors, potential runtime issues |
| Best Practices | Design patterns, error handling |

### Severity Levels

| Level | Description |
|-------|-------------|
| Critical | Must fix before merge |
| Warning | Should be addressed |
| Info | Suggestions for improvement |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**rammallineni**

- GitHub: [@rammallineni](https://github.com/rammallineni)

---

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude AI API
- [GitHub](https://github.com/) for the OAuth and repository APIs
- [Railway](https://railway.app/) for seamless cloud deployment
- [Tailwind CSS](https://tailwindcss.com/) for the beautiful styling utilities
- [Lucide Icons](https://lucide.dev/) for the icon library

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [rammallineni](https://github.com/rammallineni)

</div>
