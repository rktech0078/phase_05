# Quickstart Guide: AI-Powered Todo Chatbot

## Overview
This guide will help you get the AI-Powered Todo Chatbot up and running quickly.

## Prerequisites
- Node.js 18+
- npm or yarn
- Neon PostgreSQL account
- OpenAI API key
- Better Auth compatible environment

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### 2. Environment Configuration
Create a `.env.local` file with the following variables:
```env
DATABASE_URL=<your-neon-postgres-url>
OPENAI_API_KEY=<your-openai-api-key>
NEXTAUTH_SECRET=<your-secret-key>
BETTER_AUTH_SECRET=<your-better-auth-secret>
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Database Setup
Run the database migrations:
```bash
npx drizzle-kit push
```

### 4. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Architecture Overview

### Key Components
1. **Frontend**: Next.js application with chat interface
2. **Backend API**: Next.js API routes handling stateless requests
3. **AI Agent**: OpenAI Agents SDK processing natural language
4. **MCP Tools**: Exposed functions for todo operations
5. **Database**: Neon PostgreSQL storing todos and conversations
6. **Authentication**: Better Auth for user management

### Request Flow
1. User sends natural language input via chat
2. Frontend sends request to backend API
3. Backend fetches conversation history from database
4. AI agent processes full conversation + new input
5. AI agent calls appropriate MCP tool(s)
6. MCP tool performs database operation
7. AI generates response based on tool results
8. Backend stores assistant response in database
9. Response is returned to frontend
10. Server discards all in-memory state

## Testing the Chatbot
Once the server is running:
1. Navigate to `http://localhost:3000`
2. Register or log in to your account
3. Try natural language commands like:
   - "Add a todo to buy groceries"
   - "Show me my pending tasks"
   - "Mark my meeting as completed"
   - "Update my workout reminder to tomorrow"

## Troubleshooting
- If you encounter database connection issues, verify your `DATABASE_URL` is correct
- If AI responses are not appearing, check that your `OPENAI_API_KEY` is valid
- For authentication issues, ensure Better Auth is properly configured