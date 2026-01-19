'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ModelSelectorProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    icon?: React.ReactNode;
}

export function ModelSelector({
    options,
    value,
    onChange,
    placeholder = "Select option",
    label,
    icon
}: ModelSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        if (open && isDesktop) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open, isDesktop]);

    // Desktop Dropdown
    if (isDesktop) {
        return (
            <div className="relative" ref={containerRef}>
                <button
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "h-7 px-2 rounded-lg transition-all text-[11px] font-medium flex items-center gap-1.5 border max-w-[200px]",
                        open
                            ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                >
                    {icon}
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronDown size={12} className={cn("transition-transform duration-200 shrink-0", open && "rotate-180")} />
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 max-h-[300px] overflow-y-auto"
                        >
                            {label && (
                                <span className="text-[10px] font-bold text-zinc-400 px-2 py-1 block uppercase tracking-wider">{label}</span>
                            )}

                            {options.length > 0 ? (
                                options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            onChange(option);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between",
                                            value === option ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                        )}
                                    >
                                        <span className="truncate mr-2">{option}</span>
                                        {value === option && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-xs text-zinc-400">
                                    No options available
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Mobile Drawer
    if (!isDesktop) {
        return (
            <>
                <button
                    onClick={() => setOpen(true)}
                    className={cn(
                        "h-7 px-2 rounded-lg transition-all text-[10px] font-medium flex items-center gap-1.5 border",
                        open
                            ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                >
                    {icon}
                    <span className="truncate max-w-[60px] xs:max-w-[80px]">{value || placeholder}</span>
                    <ChevronDown size={10} className="shrink-0 opacity-50" />
                </button>

                {mounted && createPortal(
                    <AnimatePresence>
                        {open && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setOpen(false)}
                                    className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                                />
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="fixed inset-x-0 bottom-0 z-[120] bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] safe-area-bottom"
                                    style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
                                >
                                    <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-3 shrink-0" />

                                    <div className="px-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                {label || "Select Option"}
                                            </h3>
                                            <button
                                                onClick={() => setOpen(false)}
                                                className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2 min-h-0">
                                        {options.length > 0 ? (
                                            <div className="grid gap-1">
                                                {options.map((option) => (
                                                    <button
                                                        key={option}
                                                        onClick={() => {
                                                            onChange(option);
                                                            setOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-4 py-3 text-sm rounded-xl transition-colors flex items-center justify-between",
                                                            value === option
                                                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                                                                : "text-zinc-600 dark:text-zinc-400"
                                                        )}
                                                    >
                                                        <span className="truncate mr-2">{option}</span>
                                                        {value === option && (
                                                            <div className="w-5 h-5 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center shrink-0">
                                                                <Check size={12} className="text-white dark:text-zinc-900" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-zinc-500">
                                                <p>No options available</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </>
        );
    }
    return null;
}
