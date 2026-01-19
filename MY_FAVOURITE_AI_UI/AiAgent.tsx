'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    X, Sparkles, Bot, Copy,
    ThumbsUp, Check, Square, ArrowUp, Zap, Layers, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { authClient } from '@/lib/auth-client';
import { useAiAgent } from '@/contexts/AiAgentContext';
import RoboticIcon from '@/components/RoboticIcon';
import { ModelSelector } from '@/components/ai-agent/ModelSelector';

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
    model?: string;
};

type Provider = 'gemini' | 'openrouter' | 'groq' | 'mistral';

const MODELS = {
    mistral: ['mistral-small-latest', 'mistral-large-latest', 'mistral-medium', 'codestral-latest'],
    gemini: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
    openrouter: ['openrouter/auto', 'nvidia/nemotron-nano-9b-v2:free', 'qwen/qwen3-coder:free', 'tngtech/deepseek-r1t2-chimera:free'],
    groq: ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.3-70b-versatile'],
};

// OPENROUTER MODELS = ['google/gemini-2.0-flash-exp:free', 'google/gemma-2-9b-it:free', 'qwen/qwen3-235b-a22b:free', 'mistralai/mistral-7b-instruct:free', 'deepseek/deepseek-r1:free',]
// GROQ MODELS = ['meta-llama/llama-3.3-70b-instruct:free', 'meta-llama/llama-3.2-3b-instruct:free', 'google/gemma-2-9b-it:free', 'qwen/qwen-2-7b-instruct:free', 'openchat/openchat-3.5-0106:free', 'groq/openai/gpt-oss-120b', 'groq/moonshotai/kimi-k2-instruct-0905', ]

export default function AiAgent() {
    const { isOpen, setIsOpen } = useAiAgent();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [provider, setProvider] = useState<Provider>('gemini');
    const [model, setModel] = useState<string>(MODELS.gemini[0]);
    const [thinkingMessage, setThinkingMessage] = useState<string>('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);




    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const loadSession = async () => {
            if (!isOpen) return;

            // Using better-auth client to get session
            const session = await authClient.getSession();
            if (!session) return;

            // Note: Since we're not using Supabase anymore, we're not loading previous chat sessions
            // from the database. This would require implementing a new API endpoint to fetch
            // user's chat history from the PostgreSQL database using Drizzle ORM.
        };
        loadSession();
    }, [isOpen]);

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

    const sendMessage = async () => {
        if (!input.trim() && !selectedText) return;

        const userContent = input.trim();
        const currentMessages = [...messages, { role: 'user', content: userContent, id: Date.now().toString() } as Message];

        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);
        setThinkingMessage('');

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const providersList: Provider[] = [
            provider, // First try selected
            'gemini',
            'openrouter',
            'groq',
            'mistral'
        ].filter((p, index, self) => self.indexOf(p) === index) as Provider[]; // Dedupe

        try {
            let response: Response | null = null;
            let employedProvider = provider;

            for (const currentProvider of providersList) {
                try {
                    if (currentProvider !== provider) {
                        setThinkingMessage(`Thinking... \n (Switching to ${currentProvider}...)`);
                    }

                    const currentModel = currentProvider === provider ? model : MODELS[currentProvider][0];

                    const attemptResponse = await fetch('/api/agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: currentMessages,
                            provider: currentProvider,
                            model: currentModel,
                            selectedText,
                            sessionId
                        }),
                        signal: abortController.signal,
                    });

                    if (!attemptResponse.ok) throw new Error(attemptResponse.statusText);

                    response = attemptResponse;
                    employedProvider = currentProvider;
                    break; // Success
                } catch (err: unknown) {
                    if (err instanceof Error && err.name === 'AbortError') throw err;
                    console.warn(`Provider ${currentProvider} failed, trying next...`);
                    continue;
                }
            }

            if (!response) throw new Error("All providers failed to generate a response.");

            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId && !sessionId) {
                setSessionId(newSessionId);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No reader available");

            const assistantMsgId = `ai-${Date.now()}`;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '',
                id: assistantMsgId,
                model: employedProvider
            }]);

            // Clear thinking message once streaming starts/found
            if (employedProvider !== provider) {
                // Keep showing briefly or clear? Let's clear to show the answer.
                setThinkingMessage('');
            }

            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                setMessages(prev => {
                    const newArr = [...prev];
                    const lastIdx = newArr.length - 1;
                    if (newArr[lastIdx].role === 'assistant') {
                        newArr[lastIdx] = { ...newArr[lastIdx], content: accumulatedText };
                    }
                    return newArr;
                });
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
                        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border border-zinc-800 dark:border-zinc-200"
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
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                            className="fixed inset-0 sm:relative sm:inset-auto w-full h-[100dvh] sm:h-[85vh] sm:max-w-4xl bg-white dark:bg-zinc-950 sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-zinc-200 dark:border-zinc-800"
                        >
                            {/* Header */}
                            <header className="flex gap-2 items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20 shrink-0">
                                <div className="flex items-center gap-2 sm:gap-3 mr-auto min-w-0">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-lg shrink-0">
                                        <RoboticIcon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-900 dark:text-zinc-100" />
                                    </div>
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hidden sm:inline-block">Physical AI</span>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 md:overflow-visible overflow-x-auto no-scrollbar">
                                    {/* Dynamic Provider Selector */}
                                    <ModelSelector
                                        label="Select Provider"
                                        value={provider}
                                        options={['gemini', 'openrouter', 'groq', 'mistral']}
                                        onChange={(val) => {
                                            setProvider(val as Provider);
                                            setModel(MODELS[val as Provider][0]);
                                        }}
                                        icon={<Zap size={12} className={cn("transition-colors", provider === 'gemini' ? "text-blue-500" : provider === 'groq' ? "text-orange-500" : "text-purple-500")} />}
                                    />

                                    <ModelSelector
                                        label="Select Model"
                                        value={model}
                                        options={MODELS[provider]}
                                        onChange={setModel}
                                        icon={<Layers size={12} />}
                                    />

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
                                            className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6"
                                        >
                                            <RoboticIcon className="w-8 h-8 text-zinc-900 dark:text-zinc-100" />
                                        </motion.div>
                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-xl font-medium text-zinc-900 dark:text-white mb-2"
                                        >
                                            How can I help you?
                                        </motion.h2>
                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-sm text-zinc-500 max-w-xs mb-8"
                                        >
                                            I can analyze documentation, explain complex topics, or help you write code.
                                        </motion.p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                                            {[
                                                'Explain VLA Models',
                                                'Sim-to-Real Transfer',
                                                'ROS 2 Installation',
                                                'Create URDF File'
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
                                                        <RoboticIcon className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
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
                                                    <RoboticIcon className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
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
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">&#34;{selectedText}&#34;</p>
                                            </div>
                                            <button onClick={() => setSelectedText('')} className="text-zinc-400 hover:text-zinc-600"><X size={14} /></button>
                                        </div>
                                    )}
                                    {/* Flex-Wrapper Layout for Fix */}
                                    <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 transition-all shadow-sm">
                                        <textarea
                                            ref={textareaRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask Physical AI..."
                                            className="flex-1 bg-transparent border-0 p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 focus:outline-none outline-none resize-none min-h-[40px] max-h-[160px] overflow-y-auto"
                                        />
                                        <div className="shrink-0 pb-1">
                                            {isLoading ? (
                                                <button onClick={stopGeneration} className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center">
                                                    <Square size={16} fill="currentColor" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={sendMessage}
                                                    disabled={!input.trim() && !selectedText}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-all flex items-center justify-center",
                                                        input.trim() || selectedText
                                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90"
                                                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                                                    )}
                                                >
                                                    <ArrowUp size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] text-zinc-400 mt-2">
                                        AI can make mistakes. Check important info.
                                    </p>
                                </div>
                            </footer>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
