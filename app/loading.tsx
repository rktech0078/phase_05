'use client';

import { motion } from 'framer-motion';
import { ListTodo } from 'lucide-react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <div className="relative flex flex-col items-center gap-6">
                {/* Animated Brand Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [0.8, 1.1, 1],
                        opacity: 1,
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/40"
                >
                    <ListTodo className="h-10 w-10" />
                </motion.div>

                {/* Shimmering Loading Text */}
                <div className="flex flex-col items-center gap-2">
                    <motion.h3
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-xl font-bold tracking-tight text-foreground"
                    >
                        Antigravity Todo
                    </motion.h3>
                    <div className="h-1 w-32 bg-secondary rounded-full overflow-hidden relative">
                        <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
