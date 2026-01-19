import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "@/lib/db";
import { tasks } from "@/schemas";
import { eq, and } from "drizzle-orm";

// Initialize MCP Server
export const mcpServer = new McpServer({
    name: "todo-agent-server",
    version: "1.0.0",
});

// --- Tools Implementation ---

// 1. Create Todo
mcpServer.tool(
    "createTodo",
    {
        title: z.string().describe("The title of the todo"),
        description: z.string().optional().describe("Optional description"),
        userId: z.string().describe("The authenticated user ID"),
    },
    async ({ title, description, userId }) => {
        const [newTodo] = await db.insert(tasks).values({
            title,
            description: description || null,
            userId,
            isCompleted: false,
        }).returning();

        return {
            content: [{ type: "text", text: `Created todo: ${newTodo.title} (ID: ${newTodo.id})` }],
        };
    }
);

// 2. List Todos
mcpServer.tool(
    "listTodos",
    {
        userId: z.string().describe("The authenticated user ID"),
        filter: z.enum(["all", "completed", "pending"]).optional().default("all"),
    },
    async ({ userId, filter }) => {
        const query = db.select().from(tasks).where(eq(tasks.userId, userId));

        // Apply filters (in-memory or simpler query modification for now)
        const allTodos = await query;
        let filteredTodos = allTodos;

        if (filter === "completed") {
            filteredTodos = allTodos.filter(t => t.isCompleted);
        } else if (filter === "pending") {
            filteredTodos = allTodos.filter(t => !t.isCompleted);
        }

        if (filteredTodos.length === 0) {
            return { content: [{ type: "text", text: "No todos found." }] };
        }

        const list = filteredTodos.map(t =>
            `- [${t.isCompleted ? "x" : " "}] ${t.title} (ID: ${t.id})`
        ).join("\n");

        return {
            content: [{ type: "text", text: `Here are your ${filter} todos:\n${list}` }],
        };
    }
);

// 3. Update Todo
mcpServer.tool(
    "updateTodo",
    {
        id: z.string().describe("The ID of the todo to update"),
        title: z.string().optional(),
        description: z.string().optional(),
        userId: z.string().describe("The authenticated user ID"),
    },
    async ({ id, title, description, userId }) => {
        // Verify ownership
        const [todo] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        if (!todo) {
            return { content: [{ type: "text", text: "Todo not found or access denied." }], isError: true };
        }

        await db.update(tasks)
            .set({
                title: title || todo.title,
                description: description || todo.description,
                updatedAt: new Date()
            })
            .where(eq(tasks.id, id));

        return {
            content: [{ type: "text", text: `Updated todo: ${title || todo.title}` }],
        };
    }
);

// 4. Complete Todo
mcpServer.tool(
    "completeTodo",
    {
        id: z.string().describe("The ID of the todo to complete"),
        userId: z.string().describe("The authenticated user ID"),
    },
    async ({ id, userId }) => {
        const [todo] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        if (!todo) {
            return { content: [{ type: "text", text: "Todo not found or access denied." }], isError: true };
        }

        await db.update(tasks).set({ isCompleted: true, updatedAt: new Date() }).where(eq(tasks.id, id));

        return {
            content: [{ type: "text", text: `Marked todo as completed: ${todo.title}` }],
        };
    }
);

// 5. Delete Todo
mcpServer.tool(
    "deleteTodo",
    {
        id: z.string().describe("The ID of the todo to delete"),
        userId: z.string().describe("The authenticated user ID"),
    },
    async ({ id, userId }) => {
        const [todo] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        if (!todo) {
            return { content: [{ type: "text", text: "Todo not found or access denied." }], isError: true };
        }

        await db.delete(tasks).where(eq(tasks.id, id));

        return {
            content: [{ type: "text", text: `Deleted todo: ${todo.title}` }],
        };
    }
);
