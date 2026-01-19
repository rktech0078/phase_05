'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
    success: "border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    error: "border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10 text-rose-900 dark:text-rose-100",
    info: "border-blue-500/20 bg-blue-50/80 dark:bg-blue-500/10 text-blue-900 dark:text-blue-100",
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg sm:min-w-[300px] max-w-[90vw]",
                styles[type]
            )}
        >
            <div className="shrink-0">{icons[type]}</div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
                <X size={16} className="opacity-50" />
            </button>
        </motion.div>
    );
};
