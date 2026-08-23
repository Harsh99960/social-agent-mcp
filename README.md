# 🤖 Social Agent — MCP Powered AI

An AI-powered social media management platform built with **React, Node.js, MongoDB, and Model Context Protocol (MCP)**.

Social Agent allows users to connect their Bluesky account and interact with an AI assistant that can perform social-media-related tasks through MCP tools.

## ✨ Features

- 🔐 JWT-based user authentication
- 📝 User registration and login
- 🤖 AI-powered conversational interface
- 🔌 Model Context Protocol (MCP) integration
- 🦋 Bluesky account integration
- ✍️ Create Bluesky posts through the AI agent
- 💬 Reply to Bluesky posts
- 📊 Bluesky analytics dashboard
- 📈 Engagement and content statistics
- 🏆 Best-performing post detection
- 📰 Retrieve latest user posts
- 🔒 Encrypted Bluesky app-password storage
- 🛡️ Protected frontend routes
- 🎨 Responsive modern UI

## 🧠 What is MCP?

**Model Context Protocol (MCP)** provides a standardized way for AI applications to connect with external data sources and tools.

In this project, MCP acts as a bridge between the AI assistant and Bluesky services.

Instead of hard-coding every social-media action into the AI application, the MCP server exposes reusable tools such as:

- `createBlueskyPost`
- `getMyPosts`
- `getPostThread`
- `createReply`
- `getBlueskyStats`

This allows the AI agent to interact with external services through structured tools.

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │     React Frontend  │
                    │                     │
                    │ Chat • Dashboard    │
                    │ Login • Bluesky     │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Express Server    │
                    │                     │
                    │ Auth • API Routes   │
                    │ Middleware          │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     MCP Server      │
                    │                     │
                    │ Social Media Tools  │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │     Bluesky     │         │     MongoDB      │
        │       API       │         │      Database    │
        └─────────────────┘         └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend

- React
- React Router
- Vite
- CSS
- Recharts

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

### AI & MCP

- Model Context Protocol
- MCP SDK
- AI-powered tool calling

### Social Media

- Bluesky
- AT Protocol API

### Security

- JWT authentication
- Protected routes
- Encrypted Bluesky credentials
- Environment variables for secrets

## 📁 Project Structure

```text
social-agent-mcp/
│
├── client/
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   └── mcp.tool.js
│
├── .gitignore
└── README.md
```

## 🔐 Authentication

The application uses JWT-based authentication.

Users can:

1. Create an account
2. Login securely
3. Receive an authentication token
4. Access protected routes
5. Connect their own Bluesky account

Protected API requests use the authenticated user's identity to ensure that Bluesky actions are performed on the correct account.

## 🦋 Bluesky Integration

Users can connect their Bluesky account using a **Bluesky App Password**.

The application verifies the credentials before storing them and encrypts the app password before saving it to the database.

Once connected, users can use the AI agent to:

- Create posts
- Retrieve their latest posts
- View post threads
- Create replies
- Analyze account performance

## 📊 Analytics Dashboard

The dashboard provides insights into the user's Bluesky activity.

Analytics include:

- Total posts
- Likes
- Replies
- Reposts
- Quotes
- Total engagement
- Followers
- Following
- Best-performing post
- Selected analytics periods

Supported analytics periods:

- 7 days
- 30 days
- 90 days

## 💬 AI Chat

The chat interface allows users to communicate naturally with the AI agent.

Instead of manually navigating multiple APIs, users can ask the agent to perform tasks such as:

```text
Show me my latest posts
```

```text
Create a post about AI trends
```

```text
Show my Bluesky analytics
```

The AI determines which MCP tool should be used to complete the request.

## ⚙️ Environment Variables

Create `.env` files for the backend configuration.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

Never commit actual secrets or `.env` files to GitHub.

## 🚀 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Harsh99960/social-agent-mcp.git
cd social-agent-mcp
```

### 2. Install dependencies

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install server dependencies:

```bash
cd ../server
npm install
```

Install client dependencies:

```bash
cd ../client
npm install
```

### 3. Configure environment variables

Create the required `.env` file in the appropriate backend directory and add your credentials.

### 4. Start the backend

```bash
cd server
npm run dev
```

### 5. Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

The application will then be available through the Vite development server.

## 🔒 Security Notes

- Never commit `.env` files.
- Never expose JWT secrets.
- Never expose encryption keys.
- Use Bluesky App Passwords instead of your main Bluesky password.
- Bluesky credentials are encrypted before being stored.

## 🚀 Deployment

The frontend is designed to be deployable through **Vercel**.

The backend requires its own production deployment and environment configuration.

Before production deployment:

- Replace localhost API URLs with the production backend URL.
- Configure production environment variables.
- Configure MongoDB access for the deployed backend.
- Configure CORS for the production frontend.
- Keep all secrets outside the source repository.

## 🎯 Future Improvements

Potential future improvements include:

- Support for additional social platforms
- Scheduled posts
- Advanced AI content generation
- Post performance recommendations
- Automated engagement workflows
- More detailed analytics
- Social-media trend analysis
- Improved MCP tool discovery

## 👨‍💻 Author

**Harsh Agrawal**

Built as a full-stack AI project exploring:

**React + Node.js + MongoDB + MCP + AI Agents + Bluesky API**

---

⭐ If you found this project interesting, consider giving the repository a star!
