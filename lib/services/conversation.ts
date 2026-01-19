import { db } from "@/lib/db";
import { messages, conversations } from "@/schemas";
import { eq, and, asc } from "drizzle-orm";

export class ConversationService {
    static async getHistory(userId: string, conversationId: string) {
        return await db.select()
            .from(messages)
            .where(and(eq(messages.userId, userId), eq(messages.conversationId, conversationId)))
            .orderBy(asc(messages.createdAt));
    }

    static async addMessage(userId: string, conversationId: string, role: "user" | "assistant", content: string) {
        await db.transaction(async (tx) => {
            await tx.insert(messages).values({
                userId,
                conversationId,
                role,
                content,
            });

            // Update conversation timestamp
            // We use try-catch or safe update in case conversation doesn't exist (e.g. legacy data)
            try {
                await tx.update(conversations)
                    .set({ updatedAt: new Date() })
                    .where(eq(conversations.id, conversationId));
            } catch (e) {
                // Ignore if conversation doesn't exist (optional: create it?)
                console.warn("Failed to update conversation timestamp", e);
            }
        });
    }
}
