import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations } from "@/schemas";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userConversations = await db.select()
            .from(conversations)
            .where(eq(conversations.userId, session.user.id))
            .orderBy(desc(conversations.createdAt));

        return NextResponse.json({ conversations: userConversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title } = await req.json();
        const id = crypto.randomUUID();

        // Check if DB insert supports returning, otherwise split
        const [newConversation] = await db.insert(conversations).values({
            id,
            title: title || "New Chat",
            userId: session.user.id,
        }).returning();

        return NextResponse.json(newConversation);
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
