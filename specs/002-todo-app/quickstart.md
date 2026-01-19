# Quickstart Guide: Todo Full-Stack Web Application

## Overview
This guide provides a quick overview of how to set up and run the Todo Full-Stack Web Application.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Access to Neon Serverless PostgreSQL database

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="your-neon-postgres-connection-string"

# Authentication Configuration
AUTH_SECRET="your-auth-secret"
AUTH_URL="http://localhost:3000"  # Update for production

# Better Auth Configuration
BETTER_AUTH_SECRET="your-better-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Database Setup
Run the database migrations to set up the required tables:

```bash
npx drizzle-kit push
```

### 5. Run the Application
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Key Features

### Authentication
- Visit `/sign-up` to create a new account
- Visit `/sign-in` to log into an existing account
- Authentication is handled by Better Auth

### Task Management
- Visit `/dashboard` to view your task dashboard
- Create new tasks at `/tasks/create`
- View and edit existing tasks at `/tasks/[id]` or `/tasks/edit/[id]`

## API Endpoints
The application provides REST API endpoints for task management:
- `GET /api/{user_id}/tasks` - List all tasks
- `POST /api/{user_id}/tasks` - Create a new task
- `GET /api/{user_id}/tasks/{id}` - Get a specific task
- `PUT /api/{user_id}/tasks/{id}` - Update a task
- `DELETE /api/{user_id}/tasks/{id}` - Delete a task
- `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle task completion status

## Architecture
- **Frontend**: Next.js App Router with React components
- **Backend**: Next.js API route handlers
- **Authentication**: Better Auth
- **Database**: Neon Serverless PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS

## Development
For development, run the application in development mode:
```bash
npm run dev
```

This enables hot reloading and other development features.

## Testing
Run the test suite with:
```bash
npm test
# or
yarn test
```

## Deployment
The application is designed to be deployed to platforms that support Next.js applications, such as Vercel. Ensure environment variables are properly configured in the deployment environment.