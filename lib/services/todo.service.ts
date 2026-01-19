import { db } from "@/lib/db";
import { tasks } from "@/schemas";
import { eq, and, desc } from "drizzle-orm";

export class TodoService {
    static async createTodo(userId: string, title: string, description?: string) {
        const [newTodo] = await db.insert(tasks).values({
            title,
            description: description || null,
            userId,
            isCompleted: false,
        }).returning();
        return newTodo;
    }

    static async listTodos(userId: string, filter: "all" | "completed" | "pending" = "all") {
        let whereClause = eq(tasks.userId, userId);

        if (filter === "completed") {
            whereClause = and(whereClause, eq(tasks.isCompleted, true))!;
        } else if (filter === "pending") {
            whereClause = and(whereClause, eq(tasks.isCompleted, false))!;
        }

        return await db.select().from(tasks).where(whereClause).orderBy(desc(tasks.createdAt));
    }

    static async searchTodos(userId: string, query: string) {
        // Simple case-insensitive fuzzy search in title or description
        // Note: For production with large data, full-text search (tsvector) is better.
        // For this hackathon scope, ILIKE or client-side filtering (if small) works.
        // Assuming drizzle-orm and pg dialect:
        const lowerQuery = `%${query.toLowerCase()}%`;

        // Since we are using drizzle-orm, we might need 'ilike' from operators if using pg
        // However, standard SQL 'like' is case-sensitive usually. 
        // Let's filter in memory for simplicity if standard ilike isn't immediately available without imports
        // or check if we can import { ilike } from "drizzle-orm"

        // Actually, let's try to fetch all user todos and filter in JS for maximum reliability 
        // with the current potentially limited ORM setup.
        const allTodos = await this.listTodos(userId, "all");

        return allTodos.filter(todo =>
            todo.title.toLowerCase().includes(query.toLowerCase()) ||
            (todo.description && todo.description.toLowerCase().includes(query.toLowerCase()))
        );
    }

    static async updateTodo(userId: string, id: string, updates: { title?: string; description?: string }) {
        const [todo] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        if (!todo) return null;

        const [updatedTodo] = await db.update(tasks)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(tasks.id, id))
            .returning();
        return updatedTodo;
    }

    static async completeTodo(userId: string, id: string) {
        const [todo] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        if (!todo) return null;

        const [updatedTodo] = await db.update(tasks)
            .set({ isCompleted: true, updatedAt: new Date() })
            .where(eq(tasks.id, id))
            .returning();
        return updatedTodo;
    }

    static async deleteTodo(userId: string, id: string) {
        const [todo] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        if (!todo) return null;

        await db.delete(tasks).where(eq(tasks.id, id));
        return todo;
    }
}
