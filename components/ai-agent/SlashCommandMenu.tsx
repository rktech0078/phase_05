'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type SlashCommand = {
    command: string;
    label: string;
    description: string;
    icon: React.ReactNode;
};

const COMMANDS: SlashCommand[] = [
    {
        command: '/add',
        label: 'Add Task',
        description: 'Create a new task',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </svg>
        ),
    },
    {
        command: '/edit',
        label: 'Edit Task',
        description: 'Modify an existing task',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
            </svg>
        ),
    },
    {
        command: '/delete',
        label: 'Delete Task',
        description: 'Remove a task permanently',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
        ),
    },
    {
        command: '/complete',
        label: 'Complete Task',
        description: 'Mark a task as done',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
            </svg>
        ),
    },
    {
        command: '/list',
        label: 'List Tasks',
        description: 'View all your tasks',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" x2="21" y1="6" y2="6" />
                <line x1="8" x2="21" y1="12" y2="12" />
                <line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" />
                <line x1="3" x2="3.01" y1="12" y2="12" />
                <line x1="3" x2="3.01" y1="18" y2="18" />
            </svg>
        ),
    },
    {
        command: '/help',
        label: 'Help',
        description: 'Show all available commands',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
            </svg>
        ),
    },
];

type SlashCommandMenuProps = {
    isVisible: boolean;
    filter: string;
    onSelect: (command: string) => void;
    onClose: () => void;
    position?: 'top' | 'bottom';
};

export function SlashCommandMenu({ isVisible, filter, onSelect, onClose, position = 'top' }: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter commands based on input
    const filteredCommands = React.useMemo(() => COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().includes(filter.toLowerCase()) ||
        cmd.label.toLowerCase().includes(filter.toLowerCase())
    ), [filter]);

    // Reset selection when filtered commands change
    React.useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredCommands.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredCommands.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        onSelect(filteredCommands[selectedIndex].command);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, selectedIndex, filteredCommands, onSelect, onClose]);

    return (
        <AnimatePresence>
            {isVisible && filteredCommands.length > 0 && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={cn(
                        "absolute left-0 right-0 mx-4 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden",
                        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                    )}
                >
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                            </svg>
                            Quick Commands
                        </p>
                    </div>

                    {/* Commands List */}
                    <div className="max-h-[280px] overflow-y-auto py-1">
                        {filteredCommands.map((cmd, index) => (
                            <motion.button
                                key={cmd.command}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => onSelect(cmd.command)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                    "w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors",
                                    selectedIndex === index
                                        ? "bg-violet-50 dark:bg-violet-500/10"
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                )}
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                    selectedIndex === index
                                        ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                )}>
                                    {cmd.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "font-medium text-sm transition-colors",
                                            selectedIndex === index
                                                ? "text-violet-700 dark:text-violet-300"
                                                : "text-zinc-900 dark:text-white"
                                        )}>
                                            {cmd.label}
                                        </span>
                                        <code className={cn(
                                            "text-xs px-1.5 py-0.5 rounded font-mono transition-colors",
                                            selectedIndex === index
                                                ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                        )}>
                                            {cmd.command}
                                        </code>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                        {cmd.description}
                                    </p>
                                </div>

                                {/* Selection indicator */}
                                {selectedIndex === index && (
                                    <motion.div
                                        layoutId="command-selection"
                                        className="w-1.5 h-8 bg-violet-500 rounded-full shrink-0"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Footer hint */}
                    <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-mono">↑↓</kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-mono">↵</kbd>
                            select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-mono">esc</kbd>
                            close
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { COMMANDS };
export type { SlashCommand };
