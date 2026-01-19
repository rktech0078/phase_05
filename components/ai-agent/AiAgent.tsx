'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    X, Sparkles, Bot, Copy,
    ThumbsUp, Check, Square, ArrowUp, Loader2, Plus, PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAiAgent } from '@/contexts/AiAgentContext';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { SlashCommandMenu } from '@/components/ai-agent/SlashCommandMenu';
import { useNotification } from '@/contexts/NotificationContext';

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
    model?: string;
};

type Conversation = {
    id: string;
    title: string;
    updatedAt: string;
};

export function AiAgent() {
    const { showToast, triggerConfetti } = useNotification();
    const { isOpen, setIsOpen } = useAiAgent();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [input, setInput] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { data: session, isPending: isSessionPending } = authClient.useSession();
    const [thinkingMessage, setThinkingMessage] = useState<string>('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    const [commandFilter, setCommandFilter] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    // Fetch conversations list
    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
            showToast("Failed to load conversations", "error");
        }
    }, [showToast]);

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen, fetchConversations]);

    // Fetch messages for selected conversation
    useEffect(() => {
        if (conversationId) {
            const fetchHistory = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/chat?conversationId=${conversationId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMessages((data.messages || []).map((m: Message, i: number) => ({ ...m, id: `hist-${i}` })));
                    }
                } catch (error) {
                    console.error("Failed to load chat history", error);
                    showToast("Failed to load chat history", "error");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchHistory();
        } else {
            setMessages([]);
        }
    }, [conversationId, showToast]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const [selectionButtonPos, setSelectionButtonPos] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const handleSelection = () => {
            if (isOpen) return;
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setSelectionButtonPos({
                    x: rect.left + (rect.width / 2),
                    y: rect.top - 50
                });
            } else {
                setSelectionButtonPos(null);
            }
        };
        const handleInteraction = () => {
            if (window.getSelection()?.toString().trim().length === 0) setSelectionButtonPos(null);
        }
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('mousedown', handleInteraction);
        return () => {
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('mousedown', handleInteraction);
        };
    }, [isOpen]);

    const handleFloatingButtonClick = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const selection = window.getSelection();
        if (selection) setSelectedText(selection.toString().trim());
        setIsOpen(true);
        setSelectionButtonPos(null);
    };

    const copyToClipboard = async (text: string, idx: number) => {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        showToast("Message copied to clipboard", "success");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            setThinkingMessage('');
        }
    };

    const handleNewChat = async () => {
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Chat' })
            });
            if (res.ok) {
                const newConv = await res.json();
                setConversations([newConv, ...conversations]);
                setConversationId(newConv.id);
                setMessages([]);
            }
        } catch (error) {
            console.error("Failed to create conversation", error);
            showToast("Failed to create conversation", "error");
        }
    };

    // Generate smart title from first message (ChatGPT style)
    const generateTitle = (message: string): string => {
        // Clean and truncate message for title
        const cleaned = message.trim().replace(/\n/g, ' ');
        if (cleaned.length <= 40) return cleaned;
        // Try to cut at word boundary
        const truncated = cleaned.substring(0, 40);
        const lastSpace = truncated.lastIndexOf(' ');
        return lastSpace > 20 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    };

    // Update conversation title in DB and local state
    const updateConversationTitle = async (convId: string, title: string) => {
        try {
            const res = await fetch(`/api/conversations/${convId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            if (res.ok) {
                setConversations(prev =>
                    prev.map(c => c.id === convId ? { ...c, title } : c)
                );
            }
        } catch (error) {
            console.error("Failed to update conversation title", error);
            showToast("Failed to update title", "error");
        }
    };

    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const conv = conversations.find(c => c.id === id);
        setDeleteConfirmation({ id, title: conv?.title || 'this conversation' });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        try {
            const res = await fetch(`/api/conversations/${deleteConfirmation.id}`, { method: 'DELETE' });
            if (res.ok) {
                setConversations(conversations.filter(c => c.id !== deleteConfirmation.id));
                if (conversationId === deleteConfirmation.id) {
                    setConversationId(null);
                    setMessages([]);
                }
                showToast("Conversation deleted", "success");
            }
        } catch (error) {
            console.error("Failed to delete conversation", error);
            showToast("Failed to delete conversation", "error");
        } finally {
            setDeleteConfirmation(null);
        }
    };

    // Handle input change to detect slash commands
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);

        // Check if input starts with "/" to show command menu
        if (value.startsWith('/')) {
            setShowCommandMenu(true);
            setCommandFilter(value);
        } else {
            setShowCommandMenu(false);
            setCommandFilter('');
        }
    };

    // Handle command selection from menu
    const handleCommandSelect = (command: string) => {
        setInput(command + ' ');
        setShowCommandMenu(false);
        setCommandFilter('');
        textareaRef.current?.focus();
    };

    // Execute slash command
    const executeSlashCommand = async (commandInput: string): Promise<string | null> => {
        if (!session?.user?.id) return 'Please sign in to use commands.';

        const parts = commandInput.trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');
        const userId = session.user.id;

        try {
            switch (command) {
                case '/add': {
                    if (!args) return 'Please provide a task title. Example: `/add Buy groceries`';
                    const res = await fetch(`/api/${userId}/tasks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: args, description: '' })
                    });
                    if (res.ok) {
                        const task = await res.json();
                        showToast("Task created successfully", "success");
                        return `✅ **Task Created!**\n\n**Title:** ${task.title}\n**ID:** \`${task.id}\``;
                    }
                    return '❌ Failed to create task.';
                }

                case '/list': {
                    const filter = args.toLowerCase();
                    let url = `/api/${userId}/tasks`;
                    if (filter === 'pending' || filter === 'incomplete') {
                        url += '?completed=false';
                    } else if (filter === 'done' || filter === 'completed') {
                        url += '?completed=true';
                    }
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        const tasks = data.tasks || [];
                        if (tasks.length === 0) {
                            return '📋 No tasks found.';
                        }
                        const taskList = tasks.map((t: { title: string; isCompleted: boolean; id: string }, i: number) =>
                            `${i + 1}. ${t.isCompleted ? '✅' : '⬜'} **${t.title}** \`ID: ${t.id}\``
                        ).join('\n');
                        return `📋 **Your Tasks (${tasks.length})**\n\n${taskList}`;
                    }
                    return '❌ Failed to fetch tasks.';
                }

                case '/complete': {
                    if (!args) return 'Please provide a task ID. Example: `/complete <task-id>`';
                    const taskId = args.trim();
                    const res = await fetch(`/api/${userId}/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isCompleted: true })
                    });
                    if (res.ok) {
                        triggerConfetti();
                        showToast("Task marked as completed", "success");
                        return `✅ **Task Completed!**\nTask \`${taskId}\` has been marked as done.`;
                    }
                    return '❌ Failed to complete task. Make sure the ID is correct.';
                }

                case '/delete': {
                    if (!args) return 'Please provide a task ID. Example: `/delete <task-id>`';
                    const taskId = args.trim();
                    const res = await fetch(`/api/${userId}/tasks/${taskId}`, {
                        method: 'DELETE'
                    });
                    if (res.status === 204 || res.ok) {
                        showToast("Task deleted", "success");
                        return `🗑️ **Task Deleted!**\nTask \`${taskId}\` has been removed.`;
                    }
                    return '❌ Failed to delete task. Make sure the ID is correct.';
                }

                case '/edit': {
                    const editParts = args.split(' ');
                    if (editParts.length < 2) {
                        return 'Please provide task ID and new title. Example: `/edit <task-id> New Title`';
                    }
                    const taskId = editParts[0];
                    const newTitle = editParts.slice(1).join(' ');
                    const res = await fetch(`/api/${userId}/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: newTitle })
                    });
                    if (res.ok) {
                        showToast("Task updated", "success");
                        return `✏️ **Task Updated!**\nTask \`${taskId}\` renamed to: **${newTitle}**`;
                    }
                    return '❌ Failed to update task. Make sure the ID is correct.';
                }

                case '/help': {
                    return `## 🚀 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| \`/add\` | Create a new task | \`/add Buy groceries\` |
| \`/list\` | List all tasks | \`/list\` or \`/list pending\` |
| \`/complete\` | Mark task as done | \`/complete <task-id>\` |
| \`/delete\` | Remove a task | \`/delete <task-id>\` |
| \`/edit\` | Update task title | \`/edit <task-id> New Title\` |
| \`/help\` | Show this help | \`/help\` |

💡 **Tip:** You can also ask me naturally to manage your tasks!`;
                }

                default:
                    return null; // Not a command, process normally
            }
        } catch (error) {
            console.error('Command execution error:', error);
            return '❌ An error occurred while executing the command.';
        }
    };

    const sendMessage = async () => {
        if (!input.trim() && !selectedText) return;

        // Check if it's a slash command first
        if (input.trim().startsWith('/')) {
            const userMessage: Message = { role: 'user', content: input };
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            setShowCommandMenu(false);

            const result = await executeSlashCommand(input.trim());
            if (result) {
                const botMessage: Message = { role: 'assistant', content: result };
                setMessages(prev => [...prev, botMessage]);
                return;
            }
        }
        let currentConvId = conversationId;
        if (!currentConvId) {
            try {
                const res = await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: input.substring(0, 30) || 'New Chat' })
                });
                if (res.ok) {
                    const newConv = await res.json();
                    setConversations([newConv, ...conversations]);
                    currentConvId = newConv.id;
                    setConversationId(newConv.id);
                } else {
                    return;
                }
            } catch (error) {
                console.error("Failed to auto-create conversation", error);
                return;
            }
        }

        const userContent = input.trim();
        const currentMessages = [...messages, { role: 'user', content: userContent, id: Date.now().toString() } as Message];

        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);
        setThinkingMessage('');

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages,
                    conversationId: currentConvId
                }),
                signal: abortController.signal,
            });

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content,
                id: `ai-${Date.now()}`,
                model: 'OpenRouter'
            }]);

            // Auto-generate title from first user message (ChatGPT style)
            const currentConv = conversations.find(c => c.id === currentConvId);
            if (currentConv && (currentConv.title === 'New Chat' || !currentConv.title)) {
                const smartTitle = generateTitle(userContent);
                updateConversationTitle(currentConvId!, smartTitle);
            }

            setSelectedText('');

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log("Generation stopped by user");
            } else {
                console.error("Chat error:", error);
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the AI models right now. Please try again later.', id: `err-${Date.now()}` }]);
            }
        } finally {
            setIsLoading(false);
            setThinkingMessage('');
            abortControllerRef.current = null;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Context Menu Button */}
            <AnimatePresence>
                {selectionButtonPos && !isOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        onClick={handleFloatingButtonClick}
                        className="fixed z-[60] flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg shadow-lg dark:bg-zinc-50 dark:text-zinc-900 border border-zinc-200 dark:border-zinc-800"
                        style={{
                            top: selectionButtonPos?.y,
                            left: selectionButtonPos?.x,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <Sparkles size={14} />
                        Ask AI
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Main Trigger */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: 10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 10 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-[110] flex items-center justify-center w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border border-zinc-800 dark:border-zinc-200"
                    >
                        <Bot size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
                    >
                        {/* Backdrop with Backdrop Blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-zinc-950/20 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                            className="fixed inset-0 sm:relative sm:inset-auto w-full h-[100dvh] sm:h-[85vh] sm:max-w-5xl bg-white dark:bg-zinc-950 sm:rounded-2xl shadow-2xl flex border-0 sm:border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                            {isSessionPending ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white dark:bg-zinc-950">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                                        <Bot className="absolute inset-0 m-auto w-5 h-5 text-violet-500 animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Verifying session...</p>
                                </div>
                            ) : !session ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-950">
                                    <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-3xl flex items-center justify-center mb-6 relative">
                                        <Bot size={40} className="text-violet-600 dark:text-violet-400" />
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 border-4 border-white dark:border-zinc-950 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Authentication Required</h2>
                                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
                                        Please sign in to access our AI services and manage your tasks more efficiently.
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                                        <Link
                                            href="/sign-in"
                                            className="flex-1"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
                                            >
                                                Sign In
                                            </motion.button>
                                        </Link>
                                        <Link
                                            href="/sign-up"
                                            className="flex-1"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition-colors"
                                            >
                                                Sign Up
                                            </motion.button>
                                        </Link>
                                    </div>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="mt-6 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline underline-offset-4"
                                    >
                                        Maybe later
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Existing Sidebar and Chat Logic */}
                                    <AnimatePresence>
                                        {showSidebar && (
                                            <>
                                                {/* Mobile backdrop */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={() => setShowSidebar(false)}
                                                    className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                                                />

                                                {/* Sidebar - Full screen on mobile, inline on desktop */}
                                                <motion.div
                                                    initial={{ x: "-100%" }}
                                                    animate={{ x: 0 }}
                                                    exit={{ x: "-100%" }}
                                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                    className={cn(
                                                        "h-full border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden z-40",
                                                        // Mobile: fixed full-height overlay
                                                        "fixed inset-y-0 left-0 w-[280px] shadow-2xl",
                                                        // Desktop: relative inline
                                                        "sm:relative sm:inset-auto sm:w-[260px] sm:shadow-none sm:bg-zinc-50 sm:dark:bg-zinc-900/50"
                                                    )}
                                                >
                                                    {/* Mobile Header with Close */}
                                                    <div className="sm:hidden flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles size={18} className="text-violet-500" />
                                                            <span className="font-semibold text-zinc-900 dark:text-white">Chats</span>
                                                        </div>
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => setShowSidebar(false)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                        >
                                                            <X size={18} className="text-zinc-500" />
                                                        </motion.button>
                                                    </div>

                                                    {/* Sidebar Content */}
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="flex flex-col h-full"
                                                    >
                                                        {/* New Chat Button */}
                                                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 sm:border-b">
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => {
                                                                    handleNewChat();
                                                                    // Close sidebar on mobile after action
                                                                    if (window.innerWidth < 640) setShowSidebar(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors"
                                                            >
                                                                <Plus size={18} />
                                                                New Chat
                                                            </motion.button>
                                                        </div>

                                                        {/* Conversations List */}
                                                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                                            {conversations.length === 0 ? (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    className="text-center py-12 px-4"
                                                                >
                                                                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                        <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                                        </svg>
                                                                    </div>
                                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No conversations yet</p>
                                                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Start a new chat to begin</p>
                                                                </motion.div>
                                                            ) : (
                                                                conversations.map((conv, index) => (
                                                                    <motion.div
                                                                        key={conv.id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: index * 0.03 }}
                                                                        onClick={() => {
                                                                            setConversationId(conv.id);
                                                                            // Close sidebar on mobile after selection
                                                                            if (window.innerWidth < 640) setShowSidebar(false);
                                                                        }}
                                                                        className={cn(
                                                                            "w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group relative cursor-pointer",
                                                                            conversationId === conv.id
                                                                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                                                                        )}
                                                                    >
                                                                        <svg
                                                                            className={cn(
                                                                                "w-4 h-4 shrink-0",
                                                                                conversationId === conv.id ? "text-violet-500" : "text-zinc-400"
                                                                            )}
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        >
                                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                                        </svg>
                                                                        <span className="truncate flex-1">{conv.title || "New Chat"}</span>

                                                                        {/* Delete button - Always visible for clarity */}
                                                                        <button
                                                                            onClick={(e) => handleDeleteConversation(e, conv.id)}
                                                                            className={cn(
                                                                                "p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-lg transition-colors shrink-0",
                                                                                conversationId === conv.id ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                                                                            )}
                                                                        >
                                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M3 6h18" />
                                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                            </svg>
                                                                        </button>
                                                                    </motion.div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>

                                    {/* Main Chat Area */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        {/* Header */}
                                        <header className="flex gap-2 items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20 shrink-0">
                                            <div className="flex items-center gap-2 sm:gap-3 mr-auto min-w-0">
                                                <motion.button
                                                    onClick={() => setShowSidebar(!showSidebar)}
                                                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.08)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-lg shrink-0 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    <motion.div
                                                        animate={{ rotate: showSidebar ? 0 : 180 }}
                                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                                    >
                                                        <PanelLeft size={16} className="text-zinc-600 dark:text-zinc-400" />
                                                    </motion.div>
                                                </motion.button>
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={16} className="text-violet-500" />
                                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Physical AI</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 sm:gap-2 md:overflow-visible overflow-x-auto no-scrollbar">
                                                <span className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md">
                                                    OpenRouter
                                                </span>

                                                <button
                                                    onClick={() => setIsOpen(false)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </header>

                                        {/* Chat Content */}
                                        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 scroll-smooth">
                                            {messages.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-6"
                                                    >
                                                        <Bot size={32} className="text-violet-600 dark:text-violet-400" />
                                                    </motion.div>
                                                    <motion.h2
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="text-xl font-medium text-zinc-900 dark:text-white mb-2"
                                                    >
                                                        How can I help you today?
                                                    </motion.h2>
                                                    <motion.p
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="text-sm text-zinc-500 max-w-xs mb-8"
                                                    >
                                                        I can help you manage tasks, answer questions, or just chat. Start a conversation!
                                                    </motion.p>

                                                    <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                                                        {[
                                                            'Create a task to buy milk',
                                                            'List my pending tasks',
                                                            'What can you do?'
                                                        ].map((q, i) => (
                                                            <motion.button
                                                                key={i}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.3 + (i * 0.05) }}
                                                                onClick={() => { setInput(q); }}
                                                                className="p-3 text-left text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl transition-colors"
                                                            >
                                                                {q}
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-3xl mx-auto w-full">
                                                    {messages.map((msg, idx) => (
                                                        <motion.div
                                                            key={msg.id || idx}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="flex gap-4"
                                                        >
                                                            <div className="shrink-0 mt-0.5">
                                                                {msg.role === 'user' ? (
                                                                    <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-white dark:text-zinc-900">U</div>
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded bg-violet-500 flex items-center justify-center">
                                                                        <Sparkles size={14} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-2">
                                                                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                                                    {msg.role === 'user' ? (
                                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                                    ) : (
                                                                        <ReactMarkdown
                                                                            remarkPlugins={[remarkGfm]}
                                                                            components={{
                                                                                code: ({ className, children, ...props }) => {
                                                                                    const match = /language-(\w+)/.exec(className || '')
                                                                                    return match ? (
                                                                                        <code className={className} {...props}>{children}</code>
                                                                                    ) : (
                                                                                        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-medium" {...props}>{children}</code>
                                                                                    )
                                                                                }
                                                                            }}
                                                                        >
                                                                            {msg.content}
                                                                        </ReactMarkdown>
                                                                    )}
                                                                </div>
                                                                {/* Actions Footer */}
                                                                {msg.role === 'assistant' && !isLoading && (
                                                                    <div className="flex items-center gap-3 pt-1">
                                                                        {msg.model && (
                                                                            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                                                {msg.model}
                                                                            </span>
                                                                        )}
                                                                        <div className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
                                                                        <button onClick={() => copyToClipboard(msg.content, idx)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                                                                            {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                                                                        </button>
                                                                        <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                                                                            <ThumbsUp size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    {isLoading && (
                                                        <div className="flex gap-4">
                                                            <div className="shrink-0 mt-0.5">
                                                                <div className="w-6 h-6 rounded bg-violet-500 flex items-center justify-center">
                                                                    <Sparkles size={14} className="text-white" />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                                                                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                                                        Thinking...
                                                                    </span>
                                                                </div>

                                                                <AnimatePresence mode="wait">
                                                                    {thinkingMessage && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -5, height: 0 }}
                                                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                                            exit={{ opacity: 0, y: -5, height: 0 }}
                                                                            className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg"
                                                                        >
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                                            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                                                                                {thinkingMessage.replace('Thinking... \n ', '')}
                                                                            </span>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div ref={messagesEndRef} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Input Area */}
                                        <footer className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                                            <div className="max-w-3xl mx-auto w-full relative">
                                                {selectedText && (
                                                    <div className="mb-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg flex justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Context</span>
                                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">&quot;{selectedText}&quot;</p>
                                                        </div>
                                                        <button onClick={() => setSelectedText('')} className="text-zinc-400 hover:text-zinc-600"><X size={14} /></button>
                                                    </div>
                                                )}

                                                {/* Slash Command Menu */}
                                                <SlashCommandMenu
                                                    isVisible={showCommandMenu}
                                                    filter={commandFilter}
                                                    onSelect={handleCommandSelect}
                                                    onClose={() => setShowCommandMenu(false)}
                                                    position="top"
                                                />


                                                {/* Flex-Wrapper Layout for Fix */}
                                                <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 transition-all shadow-sm">
                                                    {/* Tools/Commands Button */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            setShowCommandMenu(!showCommandMenu);
                                                            setCommandFilter('/');
                                                            textareaRef.current?.focus();
                                                        }}
                                                        className={cn(
                                                            "shrink-0 w-7 h-7 rounded-full transition-all flex items-center justify-center",
                                                            showCommandMenu
                                                                ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                                                : "bg-transparent text-zinc-400 dark:text-zinc-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400"
                                                        )}
                                                        title="Show commands"
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                                        </svg>
                                                    </motion.button>
                                                    <textarea
                                                        ref={textareaRef}
                                                        value={input}
                                                        onChange={handleInputChange}
                                                        onKeyDown={handleKeyDown}
                                                        placeholder="Type / for multiple tools..."
                                                        className="flex-1 bg-transparent border-0 py-1 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 focus:outline-none outline-none resize-none min-h-[24px] max-h-[120px] overflow-y-auto leading-relaxed"
                                                        rows={1}
                                                    />
                                                    <div className="shrink-0">
                                                        {isLoading ? (
                                                            <button onClick={stopGeneration} className="w-7 h-7 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition-opacity flex items-center justify-center">
                                                                <Square size={14} fill="currentColor" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={sendMessage}
                                                                disabled={!input.trim() && !selectedText}
                                                                className={cn(
                                                                    "w-7 h-7 rounded-full transition-all flex items-center justify-center",
                                                                    input.trim() || selectedText
                                                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90"
                                                                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                                                                )}
                                                            >
                                                                <ArrowUp size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-center text-[10px] text-zinc-400 mt-2">
                                                    AI can make mistakes. Check important info.
                                                </p>
                                            </div>
                                        </footer>
                                    </div>
                                    {/* Delete Confirmation Modal */}
                                    <AnimatePresence>
                                        {deleteConfirmation && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                                            >
                                                {/* Backdrop */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={() => setDeleteConfirmation(null)}
                                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                                />

                                                {/* Modal */}
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                                    className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-zinc-200 dark:border-zinc-800"
                                                >
                                                    {/* Warning Icon */}
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                                        className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                                                    >
                                                        <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                                                            <path d="M12 9v4" />
                                                            <path d="M12 17h.01" />
                                                        </svg>
                                                    </motion.div>

                                                    {/* Title */}
                                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white text-center mb-2">
                                                        Delete Conversation?
                                                    </h3>

                                                    {/* Description */}
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
                                                        Are you sure you want to delete{' '}
                                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                            &quot;{deleteConfirmation.title}&quot;
                                                        </span>
                                                        ? This action cannot be undone.
                                                    </p>

                                                    {/* Buttons */}
                                                    <div className="flex gap-3">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setDeleteConfirmation(null)}
                                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                                                        >
                                                            Cancel
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={confirmDelete}
                                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                            </svg>
                                                            Delete
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
