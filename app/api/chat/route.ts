import { auth } from "@/lib/auth";
import { runTodoAgent } from "@/lib/agents/todo-agent";
import { ConversationService } from "@/lib/services/conversation";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { messages: newMessages, conversationId } = await req.json();
        const lastMessage = newMessages[newMessages.length - 1];

        if (!lastMessage || !conversationId) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const userId = session.user.id;

        if (!process.env.OPENROUTER_API_KEY) {
            console.error("Missing OPENROUTER_API_KEY environment variable");
            return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
        }

        // 1. Persist User Message
        await ConversationService.addMessage(userId, conversationId, "user", lastMessage.content);

        // 2. Run Agent with OpenRouter
        const finalResponse = await runTodoAgent(
            lastMessage.content,
            userId,
            process.env.OPENROUTER_API_KEY
        );

        // 3. Persist Assistant Response
        await ConversationService.addMessage(userId, conversationId, "assistant", finalResponse);

        return NextResponse.json({
            role: "assistant",
            content: finalResponse,
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
        }

        const history = await ConversationService.getHistory(session.user.id, conversationId);

        return NextResponse.json({ messages: history });
    } catch (error) {
        console.error("Chat API History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
