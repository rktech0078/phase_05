# Todo Full-Stack Web Application

This is a full-stack todo web application built with Next.js, featuring user authentication and task management capabilities.

## Features

- User registration and authentication
- Create, read, update, and delete tasks
- Mark tasks as complete/incomplete
- Secure access to user-specific data only

## Tech Stack

- **Frontend**: Next.js 16+ with App Router
- **Backend**: Next.js API Routes
- **Authentication**: Better Auth
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (copy `.env.local.example` to `.env.local` and fill in your values)
4. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## API Endpoints

The application provides the following API endpoints:

- `GET /api/{user_id}/tasks` - List all tasks for a user
- `POST /api/{user_id}/tasks` - Create a new task
- `GET /api/{user_id}/tasks/{id}` - Get a specific task
- `PUT /api/{user_id}/tasks/{id}` - Update a task
- `DELETE /api/{user_id}/tasks/{id}` - Delete a task
- `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle task completion status

All endpoints require authentication.

## Project Structure

```
.
├── app/                 # Next.js App Router structure
│   ├── (auth)/          # Authentication-related routes
│   ├── api/             # API route handlers
│   ├── dashboard/       # Main application dashboard
│   └── tasks/           # Task management pages
├── components/          # Reusable React components
├── lib/                 # Utility functions and libraries
├── schemas/             # Database schemas (Drizzle ORM)
├── middleware.ts        # Next.js middleware (auth protection)
└── docs/                # Documentation
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
DATABASE_URL="your-neon-postgres-connection-string"
AUTH_SECRET="your-auth-secret"
BETTER_AUTH_SECRET="your-better-auth-secret"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Specify license here]
<!-- 


rules_version = '2';

service cloud.firestore {

  match /databases/{database}/documents {

    // =========================

    // Admin / Teacher (Firebase Auth)

    // =========================

    match /{document=**} {

      allow read, write: if request.auth != null;

    }

    // =========================

    // Holidays (Public Read)

    // =========================

    match /holidays/{holidayId} {

      allow read: if true;          // students + public

      allow write: if request.auth != null;

    }

    // =========================

    // Attendance (Limited Read)

    // Structure:

    // attendance/{grNo}/{date}

    // =========================

    match /attendance/{grNo}/{recordId} {

      allow read: if true;          // students read

      allow write: if request.auth != null;

    }

  }

} -->