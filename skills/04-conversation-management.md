# Skill: Conversation Management Pattern

## Overview
This skill covers implementing persistent conversation management for AI chatbots, including message storage, conversation history, and multi-session support. Based on the implementation in `lib/services/conversation.ts` and `components/ai-agent/AiAgent.tsx`.

## Core Concepts

### 1. Conversation Architecture

**Key Components:**
- **Conversations**: Top-level chat sessions with titles
- **Messages**: Individual messages within conversations
- **Roles**: User, assistant, system
- **Persistence**: All data stored in database (stateless)

**Database Schema:**

```typescript
// conversations table
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull().default('New Conversation'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// messages table
export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

**Key Features:**
- UUID-based IDs for conversations and messages
- Cascade delete (deleting conversation removes all messages)
- User ownership for data isolation
- Timestamps for ordering and display

### 2. Service Layer Implementation

```typescript
// lib/services/conversation.ts
import { db } from '@/lib/db';
import { conversations, messages } from '@/schemas';
import { eq, and, desc } from 'drizzle-orm';

export class ConversationService {
  /**
   * Get conversation history with all messages
   */
  static async getHistory(userId: string, conversationId: string) {
    // Verify ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Fetch messages in chronological order
    const messageList = await db.query.messages.findMany({
      where: and(
        eq(messages.conversationId, conversationId),
        eq(messages.userId, userId)
      ),
      orderBy: [messages.createdAt],
    });

    return {
      conversation,
      messages: messageList,
    };
  }

  /**
   * Add a new message to conversation
   */
  static async addMessage(
    userId: string,
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ) {
    // Verify conversation ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Insert message
    const [message] = await db.insert(messages).values({
      conversationId,
      role,
      content,
      userId,
    }).returning();

    // Update conversation timestamp
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return message;
  }

  /**
   * Create new conversation
   */
  static async createConversation(userId: string, title?: string) {
    const [conversation] = await db.insert(conversations).values({
      userId,
      title: title || 'New Conversation',
    }).returning();

    return conversation;
  }

  /**
   * List all conversations for user
   */
  static async listConversations(userId: string) {
    return await db.query.conversations.findMany({
      where: eq(conversations.userId, userId),
      orderBy: [desc(conversations.updatedAt)],
    });
  }

  /**
   * Delete conversation (cascade deletes messages)
   */
  static async deleteConversation(userId: string, conversationId: string) {
    const result = await db.delete(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ))
      .returning();

    if (result.length === 0) {
      throw new Error('Conversation not found or access denied');
    }

    return { success: true };
  }

  /**
   * Update conversation title
   */
  static async updateTitle(userId: string, conversationId: string, title: string) {
    const result = await db.update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ))
      .returning();

    if (result.length === 0) {
      throw new Error('Conversation not found');
    }

    return result[0];
  }

  /**
   * Auto-generate title from first message
   */
  static async generateTitle(userId: string, conversationId: string) {
    const { messages: messageList } = await this.getHistory(userId, conversationId);

    if (messageList.length === 0) {
      return;
    }

    // Use first user message as title (truncated)
    const firstUserMessage = messageList.find(m => m.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.slice(0, 50) +
        (firstUserMessage.content.length > 50 ? '...' : '');

      await this.updateTitle(userId, conversationId, title);
    }
  }
}
```

### 3. API Routes

#### Create Conversation

```typescript
// app/api/conversations/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ConversationService } from '@/lib/services/conversation';

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title } = await req.json();
  const userId = session.user.id;

  try {
    const conversation = await ConversationService.createConversation(userId, title);
    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const conversations = await ConversationService.listConversations(userId);
    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

#### Delete Conversation

```typescript
// app/api/conversations/[id]/route.ts
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const conversationId = params.id;

  try {
    await ConversationService.deleteConversation(userId, conversationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }
}
```

### 4. Chat API Integration

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, conversationId } = await req.json();
  const userId = session.user.id;

  try {
    // 1. Fetch conversation history
    const { messages: history } = await ConversationService.getHistory(
      userId,
      conversationId
    );

    // 2. Persist user message
    await ConversationService.addMessage(
      userId,
      conversationId,
      'user',
      message
    );

    // 3. Build message array for AI
    const messageArray = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // 4. Run AI agent
    const response = await runTodoAgent(
      messageArray,
      userId,
      process.env.OPENROUTER_API_KEY!
    );

    // 5. Persist assistant response
    await ConversationService.addMessage(
      userId,
      conversationId,
      'assistant',
      response
    );

    // 6. Auto-generate title if first message
    if (history.length === 0) {
      await ConversationService.generateTitle(userId, conversationId);
    }

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Key Pattern:**
1. Fetch history from DB (stateless)
2. Persist user message
3. Build full message array
4. Run AI agent
5. Persist AI response
6. Auto-generate title on first message

### 5. Frontend Implementation

#### Conversation List Component

```typescript
// components/ai-agent/ConversationList.tsx
import { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

export function ConversationList({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this conversation?')) return;

    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));

      // If deleted current conversation, create new one
      if (id === currentConversationId) {
        onNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  return (
    <div className="conversation-list">
      <button onClick={onNewConversation} className="new-conversation-btn">
        + New Conversation
      </button>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="conversations">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${
                conv.id === currentConversationId ? 'active' : ''
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-title">{conv.title}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(conv.id);
                }}
                className="delete-btn"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Chat Interface with History

```typescript
// components/ai-agent/AiAgent.tsx
export function AiAgent() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize with new conversation
  useEffect(() => {
    createNewConversation();
  }, []);

  async function createNewConversation() {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      const conversation = await response.json();
      setConversationId(conversation.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }

  async function loadConversation(id: string) {
    try {
      const response = await fetch(`/api/conversations/${id}/messages`);
      const data = await response.json();
      setConversationId(id);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !conversationId) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic update
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      const data = await response.json();

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        createdAt: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Revert optimistic update
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-agent">
      <ConversationList
        currentConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewConversation={createNewConversation}
      />

      <div className="chat-area">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="content">{msg.content}</div>
            </div>
          ))}
          {loading && <div className="loading">Thinking...</div>}
        </div>

        <div className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6. Advanced Features

#### Auto-Title Generation with AI

```typescript
static async generateTitleWithAI(userId: string, conversationId: string) {
  const { messages } = await this.getHistory(userId, conversationId);

  if (messages.length === 0) return;

  // Get first few messages for context
  const context = messages.slice(0, 3).map(m => m.content).join('\n');

  // Use AI to generate concise title
  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Generate a concise 3-5 word title for this conversation.'
      },
      {
        role: 'user',
        content: context
      }
    ],
    max_tokens: 20,
  });

  const title = response.choices[0].message.content?.trim() || 'New Conversation';
  await this.updateTitle(userId, conversationId, title);
}
```

#### Message Search

```typescript
static async searchMessages(userId: string, query: string) {
  return await db.query.messages.findMany({
    where: and(
      eq(messages.userId, userId),
      sql`${messages.content} ILIKE ${`%${query}%`}`
    ),
    with: {
      conversation: true,
    },
    orderBy: [desc(messages.createdAt)],
    limit: 50,
  });
}
```

#### Export Conversation

```typescript
static async exportConversation(userId: string, conversationId: string) {
  const { conversation, messages } = await this.getHistory(userId, conversationId);

  const markdown = `# ${conversation.title}\n\n` +
    messages.map(m =>
      `**${m.role.toUpperCase()}**: ${m.content}\n\n`
    ).join('');

  return {
    filename: `${conversation.title.replace(/\s+/g, '-')}.md`,
    content: markdown,
  };
}
```

## Best Practices

### 1. Always Verify Ownership

```typescript
// GOOD: Check ownership before operations
const conversation = await db.query.conversations.findFirst({
  where: and(
    eq(conversations.id, conversationId),
    eq(conversations.userId, userId)
  ),
});

if (!conversation) {
  throw new Error('Access denied');
}

// BAD: Direct access without verification
const conversation = await db.query.conversations.findFirst({
  where: eq(conversations.id, conversationId)
});
```

### 2. Use Transactions for Multi-Step Operations

```typescript
await db.transaction(async (tx) => {
  // Create conversation
  const [conversation] = await tx.insert(conversations).values({
    userId,
    title: 'New Chat',
  }).returning();

  // Add initial system message
  await tx.insert(messages).values({
    conversationId: conversation.id,
    role: 'system',
    content: SYSTEM_PROMPT,
    userId,
  });

  return conversation;
});
```

### 3. Implement Pagination for Large Histories

```typescript
static async getHistory(
  userId: string,
  conversationId: string,
  limit = 50,
  offset = 0
) {
  const messageList = await db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
      eq(messages.userId, userId)
    ),
    orderBy: [desc(messages.createdAt)],
    limit,
    offset,
  });

  return messageList.reverse(); // Chronological order
}
```

### 4. Handle Concurrent Updates

```typescript
// Use optimistic locking with version field
export const conversations = pgTable('conversations', {
  // ... other fields
  version: integer('version').notNull().default(1),
});

// Update with version check
const result = await db.update(conversations)
  .set({
    title: newTitle,
    version: sql`${conversations.version} + 1`,
  })
  .where(and(
    eq(conversations.id, conversationId),
    eq(conversations.version, currentVersion)
  ))
  .returning();

if (result.length === 0) {
  throw new Error('Conversation was modified by another request');
}
```

## Performance Optimization

### 1. Index Strategy

```sql
-- Index for user's conversations
CREATE INDEX idx_conversations_user_updated
ON conversations(user_id, updated_at DESC);

-- Index for conversation messages
CREATE INDEX idx_messages_conversation_created
ON messages(conversation_id, created_at);

-- Index for message search
CREATE INDEX idx_messages_content_gin
ON messages USING gin(to_tsvector('english', content));
```

### 2. Limit Message History

```typescript
// Only load recent messages, fetch older on demand
const RECENT_MESSAGE_LIMIT = 50;

static async getRecentHistory(userId: string, conversationId: string) {
  const messages = await db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
      eq(messages.userId, userId)
    ),
    orderBy: [desc(messages.createdAt)],
    limit: RECENT_MESSAGE_LIMIT,
  });

  return messages.reverse();
}
```

### 3. Cache Conversation List

```typescript
// Frontend: Cache conversation list, invalidate on changes
const { data: conversations, mutate } = useSWR(
  '/api/conversations',
  fetcher,
  { revalidateOnFocus: false }
);

// Invalidate cache after creating/deleting
await mutate();
```

## Security Considerations

1. **User Isolation**: Always filter by userId
2. **Input Sanitization**: Validate message content
3. **Rate Limiting**: Limit messages per minute
4. **Content Moderation**: Filter inappropriate content
5. **Data Retention**: Implement conversation expiry policy

## Testing

```typescript
describe('ConversationService', () => {
  it('should create conversation for user', async () => {
    const conv = await ConversationService.createConversation('user-1');
    expect(conv.userId).toBe('user-1');
  });

  it('should prevent access to other users conversations', async () => {
    const conv = await ConversationService.createConversation('user-1');

    await expect(
      ConversationService.getHistory('user-2', conv.id)
    ).rejects.toThrow('access denied');
  });

  it('should maintain message order', async () => {
    const conv = await ConversationService.createConversation('user-1');

    await ConversationService.addMessage('user-1', conv.id, 'user', 'First');
    await ConversationService.addMessage('user-1', conv.id, 'assistant', 'Second');

    const { messages } = await ConversationService.getHistory('user-1', conv.id);
    expect(messages[0].content).toBe('First');
    expect(messages[1].content).toBe('Second');
  });
});
```

## References

- Service Implementation: `lib/services/conversation.ts`
- Database Schema: `schemas/index.ts`
- API Routes: `app/api/conversations/`
- UI Component: `components/ai-agent/AiAgent.tsx`
- Chat API: `app/api/chat/route.ts`
