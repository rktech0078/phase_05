# Skill: AI Agent Development with Function Calling

## Overview
This skill covers building AI agents that use function calling (tool use) to interact with application data and services. Based on the implementation in `lib/agents/todo-agent.ts`.

## Key Concepts

### 1. Agent Architecture
An AI agent consists of:
- **System Prompt**: Defines agent personality and capabilities
- **Function Tools**: Available actions the agent can take
- **Execution Loop**: Handles multi-turn tool calling
- **Service Integration**: Connects tools to business logic

### 2. Function Tool Definition Pattern

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'add_todo',
      description: 'Create a new todo item with title and optional description',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title of the todo item'
          },
          description: {
            type: 'string',
            description: 'Optional description for the todo item'
          }
        },
        required: ['title']
      }
    }
  }
];
```

**Best Practices:**
- Clear, descriptive function names
- Detailed descriptions for AI understanding
- Explicit parameter types and requirements
- Include examples in descriptions when helpful

### 3. Agent Execution Loop

```typescript
async function runAgent(userMessage: string, userId: string) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ];

  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto'
    });

    const message = response.choices[0].message;
    messages.push(message);

    // If no tool calls, agent is done
    if (!message.tool_calls) {
      return message.content;
    }

    // Execute each tool call
    for (const toolCall of message.tool_calls) {
      const result = await executeToolCall(toolCall, userId);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    iterations++;
  }

  return "Maximum iterations reached";
}
```

**Key Points:**
- Always limit iterations to prevent infinite loops
- Append all messages to conversation history
- Tool results must include `tool_call_id`
- Return final assistant message when no more tool calls

### 4. Tool Execution Pattern

```typescript
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

      // ... other tools

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
}
```

**Best Practices:**
- Always wrap in try-catch
- Return structured error objects
- Include success/error flags
- Pass user context (userId) for data isolation

### 5. Smart Features from This Project

#### Fuzzy Search for Ambiguity Resolution
```typescript
// When user says "complete the shopping task"
const todos = await TodoService.searchTodos(userId, 'shopping');

if (todos.length === 0) {
  return { error: 'No matching todos found' };
}

if (todos.length > 1) {
  return {
    error: 'Multiple todos found. Please be more specific.',
    matches: todos.map(t => ({ id: t.id, title: t.title }))
  };
}

// Exactly one match - proceed
return await TodoService.completeTodo(userId, todos[0].id);
```

#### Emoji-Rich Responses
```typescript
const SYSTEM_PROMPT = `
You are a helpful todo assistant. Use emojis to make responses friendly:
- ✅ for completed tasks
- 📝 for new tasks
- 🗑️ for deleted tasks
- 📋 for lists
- ⚠️ for errors
`;
```

### 6. OpenRouter Integration

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL,
    'X-Title': 'AI Todo App'
  }
});
```

**Configuration:**
- Use OpenRouter for access to multiple models
- Set custom headers for tracking
- Model recommendation: `openai/gpt-4o-mini` (cost-effective)
- Alternative: `anthropic/claude-3.5-sonnet` (more capable)

### 7. System Prompt Template

```typescript
const SYSTEM_PROMPT = `
You are a smart todo assistant that helps users manage their tasks through natural conversation.

CAPABILITIES:
- Create new todos with titles and descriptions
- List todos (all, completed, or pending)
- Update todo titles and descriptions
- Mark todos as complete
- Delete todos

BEHAVIOR:
- Be friendly and use emojis
- When ambiguous, ask for clarification
- Confirm destructive actions (delete)
- Provide helpful summaries after actions
- Handle errors gracefully with suggestions

TOOL USAGE:
- Use fuzzy search when user references tasks by partial title
- If multiple matches, list them and ask user to clarify
- Always verify ownership before operations
`;
```

### 8. API Route Integration

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, conversationId } = await req.json();
  const userId = session.user.id;

  // Persist user message
  await ConversationService.addMessage(
    userId,
    conversationId,
    'user',
    message
  );

  // Run agent
  const response = await runTodoAgent(
    message,
    userId,
    process.env.OPENROUTER_API_KEY!
  );

  // Persist assistant response
  await ConversationService.addMessage(
    userId,
    conversationId,
    'assistant',
    response
  );

  return NextResponse.json({ response });
}
```

## Common Pitfalls

1. **Forgetting to limit iterations** - Always set MAX_ITERATIONS
2. **Not handling tool errors** - Wrap all tool calls in try-catch
3. **Missing tool_call_id** - Required for tool response messages
4. **Hardcoding user context** - Always pass userId dynamically
5. **Unclear tool descriptions** - AI needs clear guidance on when to use tools
6. **Not validating tool arguments** - Parse and validate before execution

## Testing Strategy

```typescript
// Test individual tools
describe('TodoAgent Tools', () => {
  it('should create todo with valid input', async () => {
    const result = await executeToolCall({
      function: {
        name: 'add_todo',
        arguments: JSON.stringify({
          title: 'Test task',
          description: 'Test description'
        })
      }
    }, 'user-123');

    expect(result.success).toBe(true);
    expect(result.todo.title).toBe('Test task');
  });
});

// Test agent flow
describe('TodoAgent', () => {
  it('should handle multi-turn conversation', async () => {
    const response = await runTodoAgent(
      'Add a task to buy groceries, then list all my tasks',
      'user-123'
    );

    expect(response).toContain('buy groceries');
  });
});
```

## Performance Considerations

1. **Model Selection**: Use smaller models (gpt-4o-mini) for simple tasks
2. **Tool Batching**: Design tools to handle batch operations when possible
3. **Caching**: Cache tool schemas and system prompts
4. **Streaming**: Consider streaming responses for better UX
5. **Timeout Handling**: Set reasonable timeouts for API calls

## Security Considerations

1. **User Isolation**: Always filter data by userId
2. **Input Validation**: Validate all tool arguments
3. **Rate Limiting**: Implement rate limits on agent endpoints
4. **API Key Security**: Never expose API keys to frontend
5. **Audit Logging**: Log all tool executions for security review

## References

- Implementation: `lib/agents/todo-agent.ts`
- API Route: `app/api/chat/route.ts`
- Service Layer: `lib/services/todo.service.ts`
- OpenRouter Setup: `lib/ai/openrouter.ts`
