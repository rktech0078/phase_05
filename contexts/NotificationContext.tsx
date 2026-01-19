'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from '@/components/ui/Toast';
import { Confetti } from '@/components/ui/Confetti';

type ToastType = 'success' | 'error' | 'info';

interface Notification {
    id: string;
    message: string;
    type: ToastType;
}

interface NotificationContextType {
    showToast: (message: string, type?: ToastType) => void;
    triggerConfetti: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    }, []);

    const triggerConfetti = useCallback(() => {
        setShowConfetti(false);
        setTimeout(() => setShowConfetti(true), 10);
    }, []);

    const removeToast = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, triggerConfetti }}>
            {children}
            {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
            <div className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-24 sm:pb-24 flex flex-col items-center sm:items-end gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                        <Toast
                            key={notification.id}
                            message={notification.message}
                            type={notification.type}
                            onClose={() => removeToast(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
