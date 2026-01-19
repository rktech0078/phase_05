import OpenAI from 'openai';
import { TodoService } from '@/lib/services/todo.service';

// Tool definitions for OpenRouter
const tools = [
    {
        type: 'function' as const,
        function: {
            name: 'add_todo',
            description: 'Add a new task to the todo list.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'The title of the task' },
                    description: { type: 'string', description: 'Optional description of the task' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'list_todos',
            description: 'List all tasks. Can filter by status.',
            parameters: {
                type: 'object',
                properties: {
                    filter: {
                        type: 'string',
                        enum: ['all', 'completed', 'pending'],
                        description: 'Filter tasks by status',
                    },
                },
                required: [],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'update_todo',
            description: 'Update a task. You can identify the task by its ID OR by providing its current title (fuzzy match).',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'The exact ID of the task (preferred)' },
                    current_title: { type: 'string', description: 'The current title of the task to find (fuzzy search)' },
                    new_title: { type: 'string', description: 'The new title for the task' },
                    new_description: { type: 'string', description: 'The new description for the task' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'complete_todo',
            description: 'Mark a task as completed. Identify by ID or Title.',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'The exact ID of the task' },
                    title: { type: 'string', description: 'The title of the task to find (fuzzy search)' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function' as const,
        function: {
            name: 'delete_todo',
            description: 'Delete a task. Identify by ID or Title.',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'The exact ID of the task' },
                    title: { type: 'string', description: 'The title of the task to find (fuzzy search)' },
                },
                required: [],
            },
        },
    },
];

// Tool execution logic
async function executeTool(toolName: string, args: Record<string, unknown>, userId: string): Promise<string> {
    try {
        switch (toolName) {
            case 'add_todo': {
                const { title, description } = args;
                const todo = await TodoService.createTodo(
                    userId,
                    typeof title === 'string' ? title : String(title),
                    typeof description === 'string' ? description : undefined
                );
                return `✅ Created task: **${todo.title}** (ID: ${todo.id})`;
            }

            case 'list_todos': {
                const filterValue = args.filter;
                const filter = typeof filterValue === 'string' &&
                               ['all', 'completed', 'pending'].includes(filterValue)
                               ? filterValue as 'all' | 'completed' | 'pending'
                               : 'all';
                const todos = await TodoService.listTodos(userId, filter);
                if (todos.length === 0) {
                    return "You have no tasks currently.";
                }
                return todos.map(t =>
                    `- [${t.isCompleted ? 'x' : ' '}] **${t.title}** ${t.description ? `_(${t.description})_` : ''} \`ID: ${t.id}\``
                ).join('\n');
            }

            case 'update_todo': {
                const { id, current_title, new_title, new_description } = args;

                let targetId: string | undefined;
                if (typeof id === 'string') {
                    targetId = id;
                }

                if (!targetId && typeof current_title === 'string') {
                    const matches = await TodoService.searchTodos(userId, current_title);
                    if (matches.length === 0) return `❌ Could not find any task matching "${current_title}".`;
                    if (matches.length > 1) {
                        return `⚠️ Found multiple tasks matching "${current_title}". Please specify which one:\n` +
                            matches.map(t => `- **${t.title}** (ID: ${t.id})`).join('\n');
                    }
                    targetId = matches[0].id;
                }

                if (!targetId) {
                    return "⚠️ Please provide either a Task ID or the Current Title to update a task.";
                }

                const updates: { title?: string; description?: string } = {};
                if (typeof new_title === 'string') {
                    updates.title = new_title;
                }
                if (typeof new_description === 'string') {
                    updates.description = new_description;
                }

                const todo = await TodoService.updateTodo(userId, targetId, updates);

                if (!todo) return "❌ Task not found.";
                return `✏️ Updated task: **${todo.title}**`;
            }

            case 'complete_todo': {
                const { id, title } = args;

                let targetId: string | undefined;
                if (typeof id === 'string') {
                    targetId = id;
                }

                if (!targetId && typeof title === 'string') {
                    const matches = await TodoService.searchTodos(userId, title);
                    if (matches.length === 0) return `❌ Could not find any task matching "${title}".`;
                    if (matches.length > 1) {
                        return `⚠️ Found multiple tasks matching "${title}". Please specify which one:\n` +
                            matches.map(t => `- **${t.title}** (ID: ${t.id})`).join('\n');
                    }
                    targetId = matches[0].id;
                }

                if (!targetId) return "⚠️ Please provide either a Task ID or Title to complete a task.";

                const todo = await TodoService.completeTodo(userId, targetId);
                if (!todo) return "❌ Task not found.";
                return `🎉 Completed: **${todo.title}**`;
            }

            case 'delete_todo': {
                const { id, title } = args;

                let targetId: string | undefined;
                if (typeof id === 'string') {
                    targetId = id;
                }

                if (!targetId && typeof title === 'string') {
                    const matches = await TodoService.searchTodos(userId, title);
                    if (matches.length === 0) return `❌ Could not find any task matching "${title}".`;
                    if (matches.length > 1) {
                        return `⚠️ Found multiple tasks matching "${title}". Please specify which one:\n` +
                            matches.map(t => `- **${t.title}** (ID: ${t.id})`).join('\n');
                    }
                    targetId = matches[0].id;
                }

                if (!targetId) return "⚠️ Please provide either a Task ID or Title to delete a task.";

                const todo = await TodoService.deleteTodo(userId, targetId);
                if (!todo) return "❌ Task not found.";
                return `🗑️ Deleted: **${todo.title}**`;
            }

            default:
                return `Unknown tool: ${toolName}`;
        }
    } catch (error) {
        console.error(`Tool execution error (${toolName}):`, error);
        return `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

export async function runTodoAgent(userMessage: string, userId: string, apiKey: string) {
    const client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        defaultHeaders: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Todo Agent',
        },
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: `You are a smart Todo Management Assistant.
You have direct access to the user's todo list database via tools.
ALWAYS use the provided tools to fetch, create, update, or delete tasks.
Do NOT hallucinate tasks. Always use 'list_todos' if you are unsure about the current state.
When a user refers to a task by name (e.g., "delete the milk task"), the tools are smart enough to find it. Just pass the title to the tool.`,
        },
        {
            role: 'user',
            content: userMessage,
        },
    ];

    let response = await client.chat.completions.create({
        model: 'openai/gpt-4o-mini', // Cheaper model for OpenRouter
        messages,
        tools,
        tool_choice: 'auto',
    });

    // Handle tool calls in a loop
    let iterations = 0;
    const maxIterations = 5;

    while (response.choices[0].message.tool_calls && iterations < maxIterations) {
        iterations++;
        const assistantMessage = response.choices[0].message;
        messages.push(assistantMessage);

        // Execute all tool calls
        const toolCalls = assistantMessage.tool_calls || [];
        for (const toolCall of toolCalls) {
            if (toolCall.type !== 'function') continue;

            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            console.log(`Executing tool: ${toolName}`, toolArgs);
            const result = await executeTool(toolName, toolArgs, userId);

            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: result,
            });
        }

        // Get next response
        response = await client.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages,
            tools,
            tool_choice: 'auto',
        });
    }

    return response.choices[0].message.content || "I processed your request.";
}
