# Skill: MCP Server Setup and Tool Development

## Overview
Model Context Protocol (MCP) is a standard for exposing application functionality as tools that AI agents can discover and use. This skill covers implementing an MCP server based on the pattern in `lib/mcp/server.ts`.

## What is MCP?

MCP (Model Context Protocol) provides:
- **Standardized Tool Interface**: Consistent way to expose functions to AI
- **Type Safety**: Schema validation with Zod
- **Discoverability**: Tools can be listed and described programmatically
- **Interoperability**: Works with any MCP-compatible client

## Core Architecture

### 1. MCP Server Setup

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Initialize MCP server
const server = new Server(
  {
    name: 'todo-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Setup transport (stdio for CLI, HTTP for web)
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Key Components:**
- **Server**: Main MCP server instance
- **Transport**: Communication layer (stdio, HTTP, WebSocket)
- **Capabilities**: Declares what the server can do (tools, resources, prompts)

### 2. Tool Definition Pattern

```typescript
// Define Zod schemas for validation
const CreateTodoSchema = z.object({
  userId: z.string().describe('The ID of the user creating the todo'),
  title: z.string().min(1).describe('The title of the todo item'),
  description: z.string().optional().describe('Optional description'),
});

// Register tool with MCP server
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'createTodo',
      description: 'Create a new todo item for a user',
      inputSchema: zodToJsonSchema(CreateTodoSchema),
    },
    // ... other tools
  ],
}));
```

**Best Practices:**
- Use Zod for schema definition and validation
- Include detailed descriptions for each field
- Mark optional fields explicitly
- Use `.describe()` for AI-readable documentation

### 3. Tool Execution Handler

```typescript
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'createTodo': {
        // Validate input
        const validated = CreateTodoSchema.parse(args);

        // Execute business logic
        const result = await TodoService.createTodo(
          validated.userId,
          validated.title,
          validated.description
        );

        // Return MCP response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'listTodos': {
        const validated = ListTodosSchema.parse(args);
        const todos = await TodoService.listTodos(
          validated.userId,
          validated.filter
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(todos, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Return error in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            success: false,
          }),
        },
      ],
      isError: true,
    };
  }
});
```

**Key Points:**
- Always validate input with Zod schemas
- Use try-catch for error handling
- Return structured responses
- Include `isError: true` for error responses

### 4. Complete Tool Set Example

```typescript
// Schema definitions
const schemas = {
  createTodo: z.object({
    userId: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
  }),

  listTodos: z.object({
    userId: z.string(),
    filter: z.enum(['all', 'completed', 'pending']).default('all'),
  }),

  updateTodo: z.object({
    userId: z.string(),
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),

  completeTodo: z.object({
    userId: z.string(),
    id: z.string(),
  }),

  deleteTodo: z.object({
    userId: z.string(),
    id: z.string(),
  }),
};

// Tool definitions
const tools = [
  {
    name: 'createTodo',
    description: 'Create a new todo item with title and optional description',
    inputSchema: zodToJsonSchema(schemas.createTodo),
  },
  {
    name: 'listTodos',
    description: 'List todos with optional filtering (all, completed, pending)',
    inputSchema: zodToJsonSchema(schemas.listTodos),
  },
  {
    name: 'updateTodo',
    description: 'Update a todo item by ID',
    inputSchema: zodToJsonSchema(schemas.updateTodo),
  },
  {
    name: 'completeTodo',
    description: 'Mark a todo as completed',
    inputSchema: zodToJsonSchema(schemas.completeTodo),
  },
  {
    name: 'deleteTodo',
    description: 'Delete a todo item by ID',
    inputSchema: zodToJsonSchema(schemas.deleteTodo),
  },
];
```

### 5. Zod to JSON Schema Conversion

```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';

// Zod schema
const schema = z.object({
  userId: z.string().describe('User ID'),
  title: z.string().min(1).max(200).describe('Todo title'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// Convert to JSON Schema for MCP
const jsonSchema = zodToJsonSchema(schema);

// Result:
// {
//   type: 'object',
//   properties: {
//     userId: { type: 'string', description: 'User ID' },
//     title: {
//       type: 'string',
//       minLength: 1,
//       maxLength: 200,
//       description: 'Todo title'
//     },
//     priority: {
//       type: 'string',
//       enum: ['low', 'medium', 'high']
//     }
//   },
//   required: ['userId', 'title']
// }
```

## Integration Patterns

### 1. Service Layer Integration

```typescript
// MCP tools should delegate to service layer
class TodoService {
  static async createTodo(userId: string, title: string, description?: string) {
    // Validate ownership
    // Execute database operations
    // Return structured result
    return {
      success: true,
      todo: { id, title, description, userId, createdAt }
    };
  }
}

// MCP tool handler
case 'createTodo': {
  const { userId, title, description } = CreateTodoSchema.parse(args);
  const result = await TodoService.createTodo(userId, title, description);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
```

**Benefits:**
- Separation of concerns
- Reusable business logic
- Easier testing
- Consistent error handling

### 2. Authentication & Authorization

```typescript
// Option 1: Require userId in every tool
const schema = z.object({
  userId: z.string().describe('User ID for authorization'),
  // ... other fields
});

// Option 2: Use MCP context (if available)
server.setRequestHandler(CallToolRequestSchema, async (request, context) => {
  const userId = context?.userId;
  if (!userId) {
    throw new Error('Authentication required');
  }

  // Proceed with tool execution
});

// Option 3: Token-based auth
const schema = z.object({
  authToken: z.string(),
  // ... other fields
});

// Validate token and extract userId
const userId = await validateToken(args.authToken);
```

**Recommendation**: For this project, userId is passed explicitly in each tool call for stateless operation.

### 3. Error Handling Pattern

```typescript
async function handleToolCall(name: string, args: any) {
  try {
    // Validate input
    const validated = schemas[name].parse(args);

    // Execute tool
    const result = await executeTool(name, validated);

    // Return success response
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: result
        })
      }]
    };
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: error.errors
          })
        }],
        isError: true
      };
    }

    // Business logic error
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        })
      }],
      isError: true
    };
  }
}
```

## Advanced Patterns

### 1. Tool Composition

```typescript
// Composite tool that uses multiple services
const BulkOperationSchema = z.object({
  userId: z.string(),
  operations: z.array(z.object({
    type: z.enum(['create', 'update', 'delete']),
    data: z.any()
  }))
});

case 'bulkOperation': {
  const { userId, operations } = BulkOperationSchema.parse(args);
  const results = [];

  for (const op of operations) {
    switch (op.type) {
      case 'create':
        results.push(await TodoService.createTodo(userId, op.data.title));
        break;
      case 'update':
        results.push(await TodoService.updateTodo(userId, op.data.id, op.data));
        break;
      case 'delete':
        results.push(await TodoService.deleteTodo(userId, op.data.id));
        break;
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify(results) }] };
}
```

### 2. Streaming Responses (for long operations)

```typescript
// For operations that take time
case 'generateReport': {
  const { userId } = GenerateReportSchema.parse(args);

  // Return initial response
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'processing',
        jobId: 'job-123'
      })
    }]
  };
}

// Separate tool to check status
case 'checkJobStatus': {
  const { jobId } = CheckJobSchema.parse(args);
  const status = await JobService.getStatus(jobId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(status)
    }]
  };
}
```

### 3. Resource Exposure (Beyond Tools)

```typescript
// MCP can also expose resources (data sources)
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'todo://user/{userId}/tasks',
      name: 'User Tasks',
      description: 'All tasks for a specific user',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Parse URI and fetch data
  const userId = extractUserIdFromUri(uri);
  const tasks = await TodoService.listTodos(userId);

  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(tasks),
    }],
  };
});
```

## Deployment Patterns

### 1. Standalone MCP Server (CLI)

```typescript
// mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const server = new Server(/* config */);
  // Register handlers...

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP Server running on stdio');
}

main().catch(console.error);
```

**Usage:**
```bash
node mcp-server.js
```

### 2. HTTP MCP Server

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const server = new Server(/* config */);

app.post('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp/messages', res);
  await server.connect(transport);
});

app.listen(3000, () => {
  console.log('MCP Server running on http://localhost:3000/mcp');
});
```

### 3. Embedded in Next.js API Route

```typescript
// app/api/mcp/route.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export async function POST(req: Request) {
  const { tool, arguments: args } = await req.json();

  // Execute tool directly (simplified MCP)
  const result = await executeToolCall(tool, args);

  return NextResponse.json(result);
}
```

## Testing MCP Servers

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('MCP Server', () => {
  let client: Client;

  beforeAll(async () => {
    // Connect to MCP server
    client = new Client(/* config */);
    await client.connect(/* transport */);
  });

  it('should list available tools', async () => {
    const tools = await client.listTools();
    expect(tools).toContainEqual(
      expect.objectContaining({ name: 'createTodo' })
    );
  });

  it('should create todo via MCP', async () => {
    const result = await client.callTool('createTodo', {
      userId: 'test-user',
      title: 'Test Task'
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.todo.title).toBe('Test Task');
  });

  it('should validate input schema', async () => {
    await expect(
      client.callTool('createTodo', { userId: 'test' })
    ).rejects.toThrow('title is required');
  });
});
```

## Common Pitfalls

1. **Missing Validation**: Always validate with Zod before execution
2. **Inconsistent Response Format**: Standardize success/error responses
3. **No Error Handling**: Wrap all tool calls in try-catch
4. **Stateful Operations**: MCP tools should be stateless
5. **Missing Descriptions**: AI needs clear descriptions to use tools correctly
6. **No Authorization**: Always verify user permissions

## Performance Optimization

1. **Connection Pooling**: Reuse database connections
2. **Caching**: Cache frequently accessed data
3. **Batch Operations**: Provide batch tools for multiple operations
4. **Lazy Loading**: Only load data when needed
5. **Timeout Handling**: Set reasonable timeouts for long operations

## Security Checklist

- [ ] Validate all inputs with Zod schemas
- [ ] Verify user authorization for every operation
- [ ] Sanitize error messages (don't leak sensitive info)
- [ ] Rate limit tool calls
- [ ] Log all tool executions for audit
- [ ] Use environment variables for secrets
- [ ] Implement request signing (for HTTP transport)
- [ ] Validate tool names against whitelist

## References

- Implementation: `lib/mcp/server.ts`
- Service Integration: `lib/services/todo.service.ts`
- MCP SDK: https://github.com/modelcontextprotocol/sdk
- Zod Documentation: https://zod.dev
