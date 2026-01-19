# Skill: Service Layer Pattern

## Overview
The Service Layer pattern encapsulates business logic in reusable classes, separating concerns between API routes, database operations, and business rules. Based on the implementation in `lib/services/todo.service.ts`.

## What is the Service Layer?

The Service Layer sits between your API routes and database, providing:
- **Business Logic Encapsulation**: All domain logic in one place
- **Reusability**: Same methods used by API routes, agents, and MCP tools
- **Testability**: Easy to unit test without HTTP layer
- **Type Safety**: Strong TypeScript interfaces
- **Consistent Error Handling**: Centralized error management

## Architecture

```
┌─────────────────┐
│   API Routes    │  (HTTP layer)
│   AI Agents     │  (Tool execution)
│   MCP Tools     │  (External access)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Layer   │  (Business logic)
│  - Validation   │
│  - Authorization│
│  - Operations   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │  (Data persistence)
│  (Drizzle ORM)  │
└─────────────────┘
```

## Core Implementation Pattern

### 1. Service Class Structure

```typescript
// lib/services/todo.service.ts
import { db } from '@/lib/db';
import { tasks } from '@/schemas';
import { eq, and, desc, ilike, or } from 'drizzle-orm';

export class TodoService {
  /**
   * Create a new todo item
   */
  static async createTodo(
    userId: string,
    title: string,
    description?: string
  ) {
    // Validation
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (title.length > 200) {
      throw new Error('Title must be less than 200 characters');
    }

    // Database operation
    const [todo] = await db.insert(tasks).values({
      userId,
      title: title.trim(),
      description: description?.trim(),
      isCompleted: false,
    }).returning();

    return {
      success: true,
      todo,
    };
  }

  /**
   * List todos with optional filtering
   */
  static async listTodos(
    userId: string,
    filter: 'all' | 'completed' | 'pending' = 'all'
  ) {
    let whereClause = eq(tasks.userId, userId);

    if (filter === 'completed') {
      whereClause = and(whereClause, eq(tasks.isCompleted, true));
    } else if (filter === 'pending') {
      whereClause = and(whereClause, eq(tasks.isCompleted, false));
    }

    const todos = await db.query.tasks.findMany({
      where: whereClause,
      orderBy: [desc(tasks.createdAt)],
    });

    return {
      success: true,
      todos,
      count: todos.length,
    };
  }

  /**
   * Get single todo by ID
   */
  static async getTodo(userId: string, todoId: string) {
    const todo = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, todoId),
        eq(tasks.userId, userId)
      ),
    });

    if (!todo) {
      throw new Error('Todo not found or access denied');
    }

    return {
      success: true,
      todo,
    };
  }

  /**
   * Update todo fields
   */
  static async updateTodo(
    userId: string,
    todoId: string,
    updates: {
      title?: string;
      description?: string;
      isCompleted?: boolean;
    }
  ) {
    // Verify ownership
    const existing = await this.getTodo(userId, todoId);

    // Validate updates
    if (updates.title !== undefined) {
      if (updates.title.trim().length === 0) {
        throw new Error('Title cannot be empty');
      }
      if (updates.title.length > 200) {
        throw new Error('Title must be less than 200 characters');
      }
    }

    // Apply updates
    const [updated] = await db.update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tasks.id, todoId),
        eq(tasks.userId, userId)
      ))
      .returning();

    return {
      success: true,
      todo: updated,
    };
  }

  /**
   * Mark todo as completed
   */
  static async completeTodo(userId: string, todoId: string) {
    return await this.updateTodo(userId, todoId, { isCompleted: true });
  }

  /**
   * Delete todo
   */
  static async deleteTodo(userId: string, todoId: string) {
    // Verify ownership
    await this.getTodo(userId, todoId);

    await db.delete(tasks)
      .where(and(
        eq(tasks.id, todoId),
        eq(tasks.userId, userId)
      ));

    return {
      success: true,
      message: 'Todo deleted successfully',
    };
  }

  /**
   * Search todos by title or description
   */
  static async searchTodos(userId: string, query: string) {
    const searchPattern = `%${query}%`;

    const todos = await db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, userId),
        or(
          ilike(tasks.title, searchPattern),
          ilike(tasks.description, searchPattern)
        )
      ),
      orderBy: [desc(tasks.createdAt)],
    });

    return {
      success: true,
      todos,
      count: todos.length,
    };
  }

  /**
   * Get todo statistics
   */
  static async getStats(userId: string) {
    const allTodos = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId),
    });

    const completed = allTodos.filter(t => t.isCompleted).length;
    const pending = allTodos.length - completed;

    return {
      success: true,
      stats: {
        total: allTodos.length,
        completed,
        pending,
        completionRate: allTodos.length > 0
          ? Math.round((completed / allTodos.length) * 100)
          : 0,
      },
    };
  }
}
```

**Key Characteristics:**
- Static methods (no instance state)
- Always require userId for data isolation
- Return structured responses with `success` flag
- Throw errors for exceptional cases
- Validate inputs before database operations
- Verify ownership before modifications

### 2. Usage in API Routes

```typescript
// app/api/[user_id]/tasks/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TodoService } from '@/lib/services/todo.service';

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') as 'all' | 'completed' | 'pending' || 'all';

  try {
    const result = await TodoService.listTodos(session.user.id, filter);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description } = await req.json();

  try {
    const result = await TodoService.createTodo(
      session.user.id,
      title,
      description
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Benefits:**
- API route is thin (just HTTP handling)
- Business logic in service (reusable)
- Easy to add new endpoints
- Consistent error handling

### 3. Usage in AI Agents

```typescript
// lib/agents/todo-agent.ts
async function executeToolCall(toolCall: any, userId: string) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  try {
    switch (name) {
      case 'add_todo':
        return await TodoService.createTodo(
          userId,
          parsedArgs.title,
          parsedArgs.description
        );

      case 'list_todos':
        return await TodoService.listTodos(
          userId,
          parsedArgs.filter || 'all'
        );

      case 'complete_todo':
        return await TodoService.completeTodo(
          userId,
          parsedArgs.id
        );

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

**Benefits:**
- Same business logic as API routes
- No code duplication
- Consistent behavior across interfaces

### 4. Usage in MCP Tools

```typescript
// lib/mcp/server.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'createTodo': {
        const { userId, title, description } = CreateTodoSchema.parse(args);
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
        const result = await TodoService.listTodos(userId, filter);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result),
          }],
        };
      }

      // ... other tools
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

**Benefits:**
- MCP tools are thin wrappers
- Business logic centralized
- Easy to maintain

## Advanced Patterns

### 1. Transaction Support

```typescript
static async bulkCreateTodos(
  userId: string,
  todos: Array<{ title: string; description?: string }>
) {
  return await db.transaction(async (tx) => {
    const created = [];

    for (const todo of todos) {
      const [newTodo] = await tx.insert(tasks).values({
        userId,
        title: todo.title,
        description: todo.description,
        isCompleted: false,
      }).returning();

      created.push(newTodo);
    }

    return {
      success: true,
      todos: created,
      count: created.length,
    };
  });
}
```

### 2. Pagination

```typescript
static async listTodosPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  filter: 'all' | 'completed' | 'pending' = 'all'
) {
  let whereClause = eq(tasks.userId, userId);

  if (filter === 'completed') {
    whereClause = and(whereClause, eq(tasks.isCompleted, true));
  } else if (filter === 'pending') {
    whereClause = and(whereClause, eq(tasks.isCompleted, false));
  }

  const offset = (page - 1) * pageSize;

  const [todos, totalCount] = await Promise.all([
    db.query.tasks.findMany({
      where: whereClause,
      orderBy: [desc(tasks.createdAt)],
      limit: pageSize,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(whereClause),
  ]);

  const totalPages = Math.ceil(totalCount[0].count / pageSize);

  return {
    success: true,
    todos,
    pagination: {
      page,
      pageSize,
      totalCount: totalCount[0].count,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
```

### 3. Soft Delete

```typescript
// Add deletedAt field to schema
export const tasks = pgTable('tasks', {
  // ... other fields
  deletedAt: timestamp('deleted_at'),
});

// Service method
static async softDeleteTodo(userId: string, todoId: string) {
  await this.getTodo(userId, todoId);

  const [deleted] = await db.update(tasks)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(tasks.id, todoId),
      eq(tasks.userId, userId)
    ))
    .returning();

  return {
    success: true,
    todo: deleted,
  };
}

// Update list method to exclude deleted
static async listTodos(userId: string, filter: string = 'all') {
  let whereClause = and(
    eq(tasks.userId, userId),
    isNull(tasks.deletedAt) // Exclude soft-deleted
  );

  // ... rest of implementation
}
```

### 4. Caching Layer

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

static async getTodoWithCache(userId: string, todoId: string) {
  const cacheKey = `todo:${userId}:${todoId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return {
      success: true,
      todo: JSON.parse(cached),
      fromCache: true,
    };
  }

  // Fetch from database
  const result = await this.getTodo(userId, todoId);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(result.todo));

  return {
    ...result,
    fromCache: false,
  };
}

// Invalidate cache on updates
static async updateTodo(userId: string, todoId: string, updates: any) {
  const result = await this.updateTodo(userId, todoId, updates);

  // Invalidate cache
  await redis.del(`todo:${userId}:${todoId}`);

  return result;
}
```

### 5. Event Emission

```typescript
import { EventEmitter } from 'events';

const eventBus = new EventEmitter();

static async createTodo(userId: string, title: string, description?: string) {
  const result = await db.insert(tasks).values({
    userId,
    title,
    description,
    isCompleted: false,
  }).returning();

  // Emit event
  eventBus.emit('todo:created', {
    userId,
    todo: result[0],
  });

  return {
    success: true,
    todo: result[0],
  };
}

// Listen to events elsewhere
eventBus.on('todo:created', async (data) => {
  // Send notification
  // Update analytics
  // Trigger webhooks
});
```

## Error Handling Patterns

### 1. Custom Error Classes

```typescript
// lib/errors.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Service usage
static async getTodo(userId: string, todoId: string) {
  const todo = await db.query.tasks.findFirst({
    where: and(
      eq(tasks.id, todoId),
      eq(tasks.userId, userId)
    ),
  });

  if (!todo) {
    throw new NotFoundError('Todo');
  }

  return { success: true, todo };
}

// API route handling
try {
  const result = await TodoService.getTodo(userId, todoId);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### 2. Result Type Pattern

```typescript
// lib/types.ts
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Service implementation
static async createTodo(
  userId: string,
  title: string,
  description?: string
): Promise<Result<Todo>> {
  try {
    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: 'Title is required',
      };
    }

    const [todo] = await db.insert(tasks).values({
      userId,
      title,
      description,
      isCompleted: false,
    }).returning();

    return {
      success: true,
      data: todo,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// API route handling
const result = await TodoService.createTodo(userId, title, description);

if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}

return NextResponse.json(result.data, { status: 201 });
```

## Testing Service Layer

### 1. Unit Tests

```typescript
// lib/services/__tests__/todo.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TodoService } from '../todo.service';
import { db } from '@/lib/db';
import { tasks } from '@/schemas';

describe('TodoService', () => {
  const testUserId = 'test-user-123';

  afterEach(async () => {
    // Clean up test data
    await db.delete(tasks).where(eq(tasks.userId, testUserId));
  });

  describe('createTodo', () => {
    it('should create a todo with valid input', async () => {
      const result = await TodoService.createTodo(
        testUserId,
        'Test Task',
        'Test Description'
      );

      expect(result.success).toBe(true);
      expect(result.todo.title).toBe('Test Task');
      expect(result.todo.description).toBe('Test Description');
      expect(result.todo.userId).toBe(testUserId);
      expect(result.todo.isCompleted).toBe(false);
    });

    it('should throw error for empty title', async () => {
      await expect(
        TodoService.createTodo(testUserId, '')
      ).rejects.toThrow('Title is required');
    });

    it('should throw error for title too long', async () => {
      const longTitle = 'a'.repeat(201);
      await expect(
        TodoService.createTodo(testUserId, longTitle)
      ).rejects.toThrow('Title must be less than 200 characters');
    });

    it('should trim whitespace from title', async () => {
      const result = await TodoService.createTodo(
        testUserId,
        '  Test Task  '
      );

      expect(result.todo.title).toBe('Test Task');
    });
  });

  describe('listTodos', () => {
    beforeEach(async () => {
      // Create test data
      await TodoService.createTodo(testUserId, 'Task 1');
      await TodoService.createTodo(testUserId, 'Task 2');
      await TodoService.createTodo(testUserId, 'Task 3');
    });

    it('should list all todos for user', async () => {
      const result = await TodoService.listTodos(testUserId, 'all');

      expect(result.success).toBe(true);
      expect(result.todos.length).toBe(3);
      expect(result.count).toBe(3);
    });

    it('should filter completed todos', async () => {
      const todos = await TodoService.listTodos(testUserId, 'all');
      await TodoService.completeTodo(testUserId, todos.todos[0].id);

      const result = await TodoService.listTodos(testUserId, 'completed');

      expect(result.todos.length).toBe(1);
      expect(result.todos[0].isCompleted).toBe(true);
    });

    it('should filter pending todos', async () => {
      const todos = await TodoService.listTodos(testUserId, 'all');
      await TodoService.completeTodo(testUserId, todos.todos[0].id);

      const result = await TodoService.listTodos(testUserId, 'pending');

      expect(result.todos.length).toBe(2);
      expect(result.todos.every(t => !t.isCompleted)).toBe(true);
    });

    it('should not return other users todos', async () => {
      await TodoService.createTodo('other-user', 'Other Task');

      const result = await TodoService.listTodos(testUserId, 'all');

      expect(result.todos.every(t => t.userId === testUserId)).toBe(true);
    });
  });

  describe('updateTodo', () => {
    it('should update todo title', async () => {
      const created = await TodoService.createTodo(testUserId, 'Original');

      const result = await TodoService.updateTodo(
        testUserId,
        created.todo.id,
        { title: 'Updated' }
      );

      expect(result.todo.title).toBe('Updated');
    });

    it('should throw error for non-existent todo', async () => {
      await expect(
        TodoService.updateTodo(testUserId, 'non-existent-id', { title: 'Test' })
      ).rejects.toThrow('Todo not found');
    });

    it('should prevent updating other users todos', async () => {
      const created = await TodoService.createTodo('other-user', 'Task');

      await expect(
        TodoService.updateTodo(testUserId, created.todo.id, { title: 'Hacked' })
      ).rejects.toThrow('access denied');
    });
  });

  describe('searchTodos', () => {
    beforeEach(async () => {
      await TodoService.createTodo(testUserId, 'Buy groceries', 'Milk and eggs');
      await TodoService.createTodo(testUserId, 'Call dentist', 'Schedule appointment');
      await TodoService.createTodo(testUserId, 'Buy birthday gift', 'For mom');
    });

    it('should search by title', async () => {
      const result = await TodoService.searchTodos(testUserId, 'buy');

      expect(result.todos.length).toBe(2);
      expect(result.todos.every(t => t.title.toLowerCase().includes('buy'))).toBe(true);
    });

    it('should search by description', async () => {
      const result = await TodoService.searchTodos(testUserId, 'appointment');

      expect(result.todos.length).toBe(1);
      expect(result.todos[0].description).toContain('appointment');
    });

    it('should be case insensitive', async () => {
      const result = await TodoService.searchTodos(testUserId, 'BUY');

      expect(result.todos.length).toBe(2);
    });
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/integration/todo-api.test.ts
import { describe, it, expect } from 'vitest';
import { createTestUser, getAuthToken } from './helpers';

describe('Todo API Integration', () => {
  it('should create and retrieve todo via API', async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);

    // Create todo
    const createResponse = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Integration Test Task',
        description: 'Test description',
      }),
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.success).toBe(true);

    // Retrieve todo
    const getResponse = await fetch('http://localhost:3000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const list = await getResponse.json();
    expect(list.todos.some(t => t.id === created.todo.id)).toBe(true);
  });
});
```

## Best Practices

1. **Always Validate Input**: Check inputs before database operations
2. **Verify Ownership**: Always filter by userId for security
3. **Use Transactions**: For multi-step operations that must be atomic
4. **Return Structured Responses**: Consistent format with success flag
5. **Throw Meaningful Errors**: Clear error messages for debugging
6. **Keep Methods Focused**: One method = one responsibility
7. **Use Static Methods**: No instance state needed
8. **Document Complex Logic**: Add comments for non-obvious code
9. **Test Thoroughly**: Unit tests for all methods
10. **Handle Edge Cases**: Empty strings, null values, concurrent updates

## Common Pitfalls

1. **Forgetting User Isolation**: Not filtering by userId
2. **No Input Validation**: Trusting client input
3. **Inconsistent Error Handling**: Different error formats
4. **Business Logic in Routes**: Duplicating logic across endpoints
5. **No Transaction Support**: Data inconsistency in multi-step operations
6. **Missing Tests**: Untested edge cases
7. **Tight Coupling**: Service depends on HTTP layer
8. **No Pagination**: Loading all records at once

## References

- Implementation: `lib/services/todo.service.ts`
- Conversation Service: `lib/services/conversation.ts`
- Database Schema: `schemas/index.ts`
- API Routes: `app/api/[user_id]/tasks/`
- Agent Integration: `lib/agents/todo-agent.ts`
