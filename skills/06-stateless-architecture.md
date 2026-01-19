# Skill: Stateless Architecture

## Overview
Stateless architecture is a design principle where the server maintains zero in-memory state between requests. All state is persisted to external storage (database, cache, etc.). This skill covers implementing truly stateless systems based on the constitutional principle in `.specify/memory/constitution.md`.

## What is Stateless Architecture?

**Definition**: A stateless system does not retain any information about previous requests in server memory. Each request is self-contained and includes all necessary context.

**Key Principle from Constitution:**
> "Zero in-memory state between requests. All state persisted to database. No server-side session storage. Conversation history fetched per request. MCP tools are stateless."

## Why Statelessness?

### Benefits

1. **Horizontal Scalability**
   - Any server can handle any request
   - No session affinity needed
   - Easy to add/remove servers
   - Load balancing simplified

2. **Reliability**
   - Server crashes don't lose data
   - No memory leaks from accumulated state
   - Predictable resource usage
   - Easy to restart servers

3. **Simplicity**
   - No complex state synchronization
   - Easier to reason about
   - Simpler debugging
   - Clear data flow

4. **Cloud-Native**
   - Works well with serverless (AWS Lambda, Vercel Functions)
   - Container-friendly
   - Auto-scaling compatible
   - Cost-effective

### Trade-offs

1. **Database Load**: More database queries per request
2. **Latency**: Fetching state adds overhead
3. **Complexity**: Must design for statelessness from start
4. **Caching**: Need external cache (Redis) for performance

## Stateless vs Stateful Comparison

### Stateful Approach (What to Avoid)

```typescript
// ❌ BAD: In-memory session storage
const sessions = new Map<string, UserSession>();

export async function POST(req: Request) {
  const sessionId = req.cookies.get('sessionId');
  const session = sessions.get(sessionId); // In-memory lookup

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use session data
  const userId = session.userId;
  // ...
}

// ❌ BAD: In-memory conversation history
const conversationHistory = new Map<string, Message[]>();

export async function POST(req: Request) {
  const { conversationId, message } = await req.json();

  // Get history from memory
  const history = conversationHistory.get(conversationId) || [];
  history.push({ role: 'user', content: message });

  // Run AI with history
  const response = await runAgent(history);

  // Store in memory
  history.push({ role: 'assistant', content: response });
  conversationHistory.set(conversationId, history);

  return NextResponse.json({ response });
}

// ❌ BAD: Caching in module scope
let cachedTodos: Todo[] | null = null;

export async function GET(req: Request) {
  if (cachedTodos) {
    return NextResponse.json(cachedTodos); // Stale data!
  }

  cachedTodos = await db.query.tasks.findMany();
  return NextResponse.json(cachedTodos);
}
```

**Problems:**
- State lost on server restart
- Doesn't work with multiple servers
- Memory leaks over time
- Stale data issues
- Can't scale horizontally

### Stateless Approach (Correct)

```typescript
// ✅ GOOD: Database-backed sessions
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Session fetched from database each request
  const userId = session.user.id;
  // ...
}

// ✅ GOOD: Fetch conversation history from database
export async function POST(req: Request) {
  const { conversationId, message } = await req.json();
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session.user.id;

  // Fetch history from database
  const { messages: history } = await ConversationService.getHistory(
    userId,
    conversationId
  );

  // Persist user message
  await ConversationService.addMessage(
    userId,
    conversationId,
    'user',
    message
  );

  // Build message array
  const messageArray = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  // Run AI agent
  const response = await runAgent(messageArray, userId);

  // Persist assistant response
  await ConversationService.addMessage(
    userId,
    conversationId,
    'assistant',
    response
  );

  return NextResponse.json({ response });
}

// ✅ GOOD: External cache (Redis) for performance
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session.user.id;

  // Try external cache
  const cached = await redis.get(`todos:${userId}`);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  // Fetch from database
  const todos = await TodoService.listTodos(userId);

  // Cache in Redis (external state)
  await redis.setex(`todos:${userId}`, 300, JSON.stringify(todos));

  return NextResponse.json(todos);
}
```

**Benefits:**
- Works across multiple servers
- Survives server restarts
- No memory leaks
- Consistent data
- Horizontally scalable

## Implementation Patterns

### 1. Authentication (Stateless Sessions)

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  // Sessions stored in database, not memory
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
});

// Every request fetches session from database
export async function getSession(req: Request) {
  return await auth.api.getSession({ headers: req.headers });
}
```

**Key Points:**
- Session data in database table
- Session token in cookie
- Each request validates token and fetches session
- No in-memory session storage

### 2. Conversation History (Stateless AI)

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, conversationId } = await req.json();
  const userId = session.user.id;

  // 1. Fetch entire conversation history from database
  const { messages: history } = await ConversationService.getHistory(
    userId,
    conversationId
  );

  // 2. Persist user message to database
  await ConversationService.addMessage(
    userId,
    conversationId,
    'user',
    message
  );

  // 3. Build complete message array for AI
  const messageArray = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  // 4. Run AI agent (stateless - no memory of previous calls)
  const response = await runTodoAgent(
    messageArray,
    userId,
    process.env.OPENROUTER_API_KEY!
  );

  // 5. Persist assistant response to database
  await ConversationService.addMessage(
    userId,
    conversationId,
    'assistant',
    response
  );

  // 6. Return response (server forgets everything after this)
  return NextResponse.json({ response });
}
```

**Critical Pattern:**
- Fetch history at start of request
- Persist all changes to database
- Build complete context for AI
- No state retained after response

### 3. MCP Tools (Stateless Operations)

```typescript
// lib/mcp/server.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'createTodo': {
        const { userId, title, description } = CreateTodoSchema.parse(args);

        // Stateless operation: no context from previous calls
        const result = await TodoService.createTodo(userId, title, description);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result),
          }],
        };
      }

      case 'listTodos': {
        const { userId, filter } = ListTodosSchema.parse(args);

        // Each call is independent - fetch fresh data
        const result = await TodoService.listTodos(userId, filter);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result),
          }],
        };
      }
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: error.message }),
      }],
      isError: true,
    };
  }
});
```

**Key Characteristics:**
- Each tool call is independent
- No shared state between calls
- All context passed in arguments
- Results returned immediately

### 4. Service Layer (Stateless Methods)

```typescript
// lib/services/todo.service.ts
export class TodoService {
  // ✅ GOOD: Static methods (no instance state)
  static async createTodo(userId: string, title: string, description?: string) {
    const [todo] = await db.insert(tasks).values({
      userId,
      title,
      description,
      isCompleted: false,
    }).returning();

    return { success: true, todo };
  }

  // ✅ GOOD: All context passed as parameters
  static async listTodos(userId: string, filter: string = 'all') {
    const todos = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId),
    });

    return { success: true, todos };
  }
}

// ❌ BAD: Instance state
export class TodoService {
  private userId: string; // State!
  private cache: Map<string, Todo>; // State!

  constructor(userId: string) {
    this.userId = userId;
    this.cache = new Map();
  }

  async createTodo(title: string) {
    // Uses instance state
    const todo = await db.insert(tasks).values({
      userId: this.userId, // From instance
      title,
    });

    this.cache.set(todo.id, todo); // Stores in memory
    return todo;
  }
}
```

**Best Practice:**
- Use static methods
- Pass all context as parameters
- No instance variables
- No caching in class

## Handling Common Scenarios

### 1. User Preferences

```typescript
// ❌ BAD: In-memory preferences
const userPreferences = new Map<string, Preferences>();

// ✅ GOOD: Database-backed preferences
export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').primaryKey(),
  theme: text('theme').default('light'),
  language: text('language').default('en'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Fetch preferences each request
async function getUserPreferences(userId: string) {
  return await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });
}
```

### 2. Rate Limiting

```typescript
// ❌ BAD: In-memory rate limiting
const requestCounts = new Map<string, number>();

// ✅ GOOD: Redis-backed rate limiting
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60); // 60 seconds window
  }

  return count <= 100; // 100 requests per minute
}
```

### 3. Temporary Data (File Uploads)

```typescript
// ❌ BAD: Store in server memory
const uploadedFiles = new Map<string, Buffer>();

// ✅ GOOD: Store in external storage (S3, database)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function handleFileUpload(file: File, userId: string) {
  const s3 = new S3Client({ region: 'us-east-1' });

  const key = `uploads/${userId}/${Date.now()}-${file.name}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: await file.arrayBuffer(),
  }));

  // Store metadata in database
  await db.insert(uploads).values({
    userId,
    key,
    filename: file.name,
    size: file.size,
  });

  return { key };
}
```

### 4. Background Jobs

```typescript
// ❌ BAD: In-memory job queue
const jobQueue: Job[] = [];

// ✅ GOOD: External job queue (BullMQ, AWS SQS)
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const jobQueue = new Queue('tasks', { connection: redis });

async function scheduleJob(userId: string, data: any) {
  await jobQueue.add('process-task', {
    userId,
    data,
  });
}

// Worker (separate process)
const worker = new Worker('tasks', async (job) => {
  const { userId, data } = job.data;
  // Process job
}, { connection: redis });
```

## Performance Optimization

### 1. Database Connection Pooling

```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

// Connection pool (shared across requests, but stateless)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// Each query is independent
// Pool manages connections efficiently
```

### 2. External Caching (Redis)

```typescript
// lib/cache.ts
import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Cache pattern
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache for next request
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

// Usage
const todos = await getCached(
  `todos:${userId}`,
  () => TodoService.listTodos(userId),
  300 // 5 minutes
);
```

### 3. Query Optimization

```typescript
// Fetch only what you need
const todos = await db.query.tasks.findMany({
  where: eq(tasks.userId, userId),
  columns: {
    id: true,
    title: true,
    isCompleted: true,
    // Don't fetch description if not needed
  },
  limit: 50, // Pagination
});

// Use indexes
// CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
```

### 4. Parallel Queries

```typescript
// Fetch multiple resources in parallel
const [todos, stats, preferences] = await Promise.all([
  TodoService.listTodos(userId),
  TodoService.getStats(userId),
  getUserPreferences(userId),
]);
```

## Serverless Compatibility

Stateless architecture is essential for serverless platforms:

```typescript
// Vercel Edge Function (stateless by design)
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // No state from previous invocations
  // Function may run on different server each time
  // Must fetch all context from database

  const session = await auth.api.getSession({ headers: req.headers });
  const todos = await TodoService.listTodos(session.user.id);

  return new Response(JSON.stringify(todos), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Testing Stateless Systems

```typescript
describe('Stateless API', () => {
  it('should handle concurrent requests independently', async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);

    // Make multiple concurrent requests
    const requests = Array.from({ length: 10 }, (_, i) =>
      fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: `Task ${i}` }),
      })
    );

    const responses = await Promise.all(requests);

    // All should succeed independently
    expect(responses.every(r => r.ok)).toBe(true);

    // Verify all tasks created
    const todos = await TodoService.listTodos(user.id);
    expect(todos.todos.length).toBe(10);
  });

  it('should not leak data between users', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await TodoService.createTodo(user1.id, 'User 1 Task');
    await TodoService.createTodo(user2.id, 'User 2 Task');

    const user1Todos = await TodoService.listTodos(user1.id);
    const user2Todos = await TodoService.listTodos(user2.id);

    expect(user1Todos.todos.length).toBe(1);
    expect(user2Todos.todos.length).toBe(1);
    expect(user1Todos.todos[0].title).toBe('User 1 Task');
    expect(user2Todos.todos[0].title).toBe('User 2 Task');
  });
});
```

## Common Pitfalls

### 1. Module-Scope Variables

```typescript
// ❌ BAD: Module-scope state
let currentUser: User | null = null;

export async function POST(req: Request) {
  currentUser = await getUser(req); // Shared across requests!
  // ...
}

// ✅ GOOD: Request-scope only
export async function POST(req: Request) {
  const currentUser = await getUser(req); // Local variable
  // ...
}
```

### 2. Singleton Services with State

```typescript
// ❌ BAD: Singleton with state
class TodoManager {
  private static instance: TodoManager;
  private cache: Map<string, Todo> = new Map();

  static getInstance() {
    if (!this.instance) {
      this.instance = new TodoManager();
    }
    return this.instance;
  }
}

// ✅ GOOD: Stateless service
class TodoService {
  static async getTodo(userId: string, todoId: string) {
    // No instance state
    return await db.query.tasks.findFirst({
      where: and(eq(tasks.id, todoId), eq(tasks.userId, userId)),
    });
  }
}
```

### 3. Caching Without Invalidation

```typescript
// ❌ BAD: Stale cache
let cachedTodos: Todo[] | null = null;

export async function GET() {
  if (!cachedTodos) {
    cachedTodos = await db.query.tasks.findMany();
  }
  return NextResponse.json(cachedTodos); // Stale!
}

// ✅ GOOD: External cache with TTL
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session.user.id;

  const cached = await redis.get(`todos:${userId}`);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const todos = await TodoService.listTodos(userId);
  await redis.setex(`todos:${userId}`, 60, JSON.stringify(todos));

  return NextResponse.json(todos);
}
```

## Checklist for Stateless Design

- [ ] No module-scope variables that change
- [ ] No class instance variables (use static methods)
- [ ] Sessions stored in database, not memory
- [ ] Conversation history fetched from database each request
- [ ] All context passed as function parameters
- [ ] External cache (Redis) for performance, not in-memory
- [ ] Database connection pooling (not state)
- [ ] File uploads to external storage (S3, not server disk)
- [ ] Background jobs in external queue (BullMQ, SQS)
- [ ] Rate limiting with Redis, not in-memory counters
- [ ] Works correctly with multiple server instances
- [ ] Survives server restarts without data loss
- [ ] Compatible with serverless platforms

## Benefits Realized in This Project

1. **Scalability**: Can deploy to Vercel Edge Functions
2. **Reliability**: Server restarts don't lose conversations
3. **Simplicity**: Clear data flow, easy to debug
4. **Testability**: Each request is independent
5. **Cost-Effective**: No need for sticky sessions or state synchronization

## References

- Constitution: `.specify/memory/constitution.md`
- Chat API: `app/api/chat/route.ts`
- Conversation Service: `lib/services/conversation.ts`
- Todo Service: `lib/services/todo.service.ts`
- MCP Server: `lib/mcp/server.ts`
- Authentication: `lib/auth.ts`
