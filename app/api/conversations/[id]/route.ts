import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages } from "@/schemas";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await db.transaction(async (tx) => {
            // Delete all messages associated with this conversation first
            await tx.delete(messages)
                .where(
                    eq(messages.conversationId, params.id)
                );

            // Then delete the conversation itself
            await tx.delete(conversations)
                .where(
                    and(
                        eq(conversations.id, params.id),
                        eq(conversations.userId, session.user.id)
                    )
                );
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title } = await req.json();

        const [updated] = await db.update(conversations)
            .set({
                title,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(conversations.id, params.id),
                    eq(conversations.userId, session.user.id)
                )
            )
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating conversation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
