'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    description = 'This action make your sessions end, and use a new login token.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const overlayVariants = {
        closed: { opacity: 0 },
        open: { opacity: 1 }
    };

    const modalVariants = {
        closed: {
            scale: 0.95,
            opacity: 0,
            y: 10
        },
        open: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 300, damping: 30 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={overlayVariants}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={modalVariants}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl p-6"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex flex-col items-center text-center sm:text-left sm:items-start">
                            {/* Icon */}
                            <div className={cn(
                                "mb-4 sm:mb-6 flex h-16 w-16 sm:h-12 sm:w-12 items-center justify-center rounded-2xl sm:rounded-xl",
                                variant === 'danger' && "bg-destructive/10 text-destructive",
                                variant === 'warning' && "bg-orange-500/10 text-orange-500",
                                variant === 'info' && "bg-primary/10 text-primary"
                            )}>
                                <AlertTriangle className="h-8 w-8 sm:h-6 sm:w-6" />
                            </div>

                            {/* Content */}
                            <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">
                                {title}
                            </h3>
                            <p className="mb-6 text-muted-foreground text-base sm:text-sm leading-relaxed">
                                {description}
                            </p>

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto rounded-xl border-border/50"
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={cn(
                                        "w-full sm:w-auto rounded-xl shadow-lg",
                                        variant === 'danger' && "bg-destructive hover:bg-destructive/90 shadow-destructive/20",
                                        variant === 'warning' && "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20",
                                        variant === 'info' && "bg-primary hover:bg-primary/90 shadow-primary/20"
                                    )}
                                >
                                    {isLoading ? 'Processing...' : confirmLabel}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
