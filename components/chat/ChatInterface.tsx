'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, Loader2, MessageCircle, X, Sparkles, PanelLeft, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
}

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

export function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load conversations list
    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
            // If no conversation selected, maybe Create one or select most recent?
            // For now, let's just wait for user to select or start new.
            // Actually, usually we start a new chat if none exists or select top one.
            if (!conversationId) {
                // We can't auto-select recent effectively without checking date, 
                // but let's just let user choose or click New Chat.
                // Or better: auto-create a new ID in memory? 
                // Let's create a "New Chat" session if list is empty or just default to empty state.
            }
        }
    }, [isOpen, conversationId]);

    // Load messages when conversationId changes
    useEffect(() => {
        if (conversationId) {
            const fetchHistory = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/chat?conversationId=${conversationId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMessages(data.messages || []);
                    }
                } catch (error) {
                    console.error("Failed to load chat history", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchHistory();
        } else {
            setMessages([]);
        }
    }, [conversationId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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
                if (window.innerWidth < 768) setShowSidebar(false); // Close sidebar on mobile after selection
            }
        } catch (error) {
            console.error("Failed to create conversation", error);
        }
    };

    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setConversations(conversations.filter(c => c.id !== id));
                if (conversationId === id) {
                    setConversationId(null);
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error("Failed to delete conversation", error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Ensure we have a conversation ID. If not, create one first.
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
                    return; // Error creating convo
                }
            } catch (error) {
                console.error("Failed to auto-create conversation", error);
                return;
            }
        }

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    conversationId: currentConvId
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
            }
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-[101] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
                    "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-600",
                    "hover:scale-110 hover:shadow-purple-500/25 hover:shadow-2xl",
                    isOpen && "rotate-0"
                )}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Popup / Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                            "fixed z-[100] overflow-hidden shadow-2xl bg-background/95 backdrop-blur-xl border border-white/20 rounded-3xl",
                            // Responsive sizing based on sidebar
                            "bottom-[calc(1rem+60px)] right-6 transition-all duration-300",
                            showSidebar ? "w-[90vw] md:w-[900px] h-[80vh] max-h-[700px]" : "w-[90vw] md:w-[450px] h-[70vh] max-h-[600px]",
                            "max-md:inset-2 max-md:bottom-[80px] max-md:right-2 max-md:w-auto max-md:h-auto max-md:rounded-2xl"
                        )}
                    >
                        <div className="flex h-full w-full">

                            {/* Sidebar */}
                            <AnimatePresence mode="wait">
                                {showSidebar && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 260, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        className="h-full border-r border-white/10 bg-muted/30 flex flex-col shrink-0"
                                    >
                                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                            <Button
                                                variant="default"
                                                onClick={handleNewChat}
                                                className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-sm"
                                            >
                                                <Plus className="w-4 h-4" /> New Chat
                                            </Button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                            {conversations.length === 0 ? (
                                                <div className="text-center p-4 text-xs text-muted-foreground">
                                                    No history
                                                </div>
                                            ) : (
                                                conversations.map(conv => (
                                                    <button
                                                        key={conv.id}
                                                        onClick={() => {
                                                            setConversationId(conv.id);
                                                            if (window.innerWidth < 768) setShowSidebar(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-3 rounded-xl text-sm transition-colors flex items-center gap-3 group relative",
                                                            conversationId === conv.id
                                                                ? "bg-violet-500/10 text-violet-600 dark:text-violet-300 font-medium"
                                                                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <MessageSquare className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">{conv.title || "New Chat"}</span>

                                                        {/* Delete button (visible on hover) */}
                                                        <div
                                                            className={cn(
                                                                "absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity",
                                                                conversationId === conv.id && "opacity-100" // always show on active
                                                            )}
                                                            onClick={(e) => handleDeleteConversation(e, conv.id)}
                                                        >
                                                            <div className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-md">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Main Chat Area */}
                            <div className="flex-1 flex flex-col relative min-w-0">
                                {/* Header */}
                                <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-indigo-600/5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowSidebar(!showSidebar)}
                                            className="hover:bg-muted/50 text-muted-foreground"
                                        >
                                            <PanelLeft className="w-5 h-5" />
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-violet-500" />
                                            <div>
                                                <h3 className="font-semibold text-foreground text-sm">AI Copilot</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-full hover:bg-destructive/10 hover:text-destructive md:hidden"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Messages */}
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                                    {!conversationId && messages.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center h-full text-center px-6"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center mb-6">
                                                <Bot className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <h4 className="font-bold text-xl text-foreground mb-3">How can I help you today?</h4>
                                            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                                                I can help you manage tasks, answer questions, or just chat. Start a conversation!
                                            </p>

                                            <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
                                                {["Create a task to buy milk", "List my pending tasks", "What can you do?"].map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        onClick={() => setInput(suggestion)}
                                                        className="px-4 py-3 text-sm bg-muted/40 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 rounded-xl transition-all text-left"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {messages.map((msg, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={i}
                                            className={cn(
                                                "flex gap-4 max-w-[95%]",
                                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-1",
                                                msg.role === 'user'
                                                    ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                                                    : "bg-muted border border-white/10"
                                            )}>
                                                {msg.role === 'user'
                                                    ? <User className="w-4 h-4 text-white" />
                                                    : <Sparkles className="w-4 h-4 text-violet-500" />
                                                }
                                            </div>
                                            <div className={cn(
                                                "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                                                msg.role === 'user'
                                                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-tr-sm"
                                                    : "bg-muted/50 text-foreground rounded-tl-sm border border-white/10"
                                            )}>
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    {/* We can use ReactMarkdown here if needed, for now simplified */}
                                                    {msg.content.split('\n').map((line, j) => (
                                                        <p key={j} className="m-0 min-h-[1.2em]">{line}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-4 mr-auto max-w-[85%]"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-muted border border-white/10 flex items-center justify-center shrink-0 mt-1">
                                                <Sparkles className="w-4 h-4 text-violet-500" />
                                            </div>
                                            <div className="bg-muted/30 px-5 py-4 rounded-2xl rounded-tl-sm border border-white/10">
                                                <div className="flex gap-1.5">
                                                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-sm shrink-0">
                                    <div className="relative">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Message AI..."
                                            className="w-full bg-muted/40 border border-white/10 rounded-2xl pl-4 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/30 text-sm placeholder:text-muted-foreground/50 transition-all shadow-inner"
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={isLoading || !input.trim()}
                                            className={cn(
                                                "absolute right-2 top-2 h-9 w-9 rounded-xl transition-all",
                                                "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20",
                                                "disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700"
                                            )}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-center text-muted-foreground/40 mt-2">
                                        AI can make mistakes. Check important info.
                                    </p>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
