'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
    '#a855f7', '#06b6d4', '#ec4899', '#10b981',
];

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    vx: number;
    vy: number;
    duration: number;
    delay: number;
    isCircle: boolean;
}

const createParticles = (): Particle[] => {
    return Array.from({ length: 50 }).map((_, i) => {
        const angle = (Math.random() * 360 * Math.PI) / 180;
        const speed = 25 + Math.random() * 30;
        return {
            id: i,
            x: 48 + Math.random() * 4,
            y: 45 + Math.random() * 5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: 6 + Math.random() * 6,
            rotation: Math.random() * 540,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 25,
            duration: 1.2 + Math.random() * 0.6,
            delay: Math.random() * 0.15,
            isCircle: Math.random() > 0.4,
        };
    });
};

export const Confetti = ({ onComplete }: { onComplete?: () => void }) => {
    const [particles] = useState<Particle[]>(createParticles);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        opacity: 1,
                        scale: 0,
                        rotate: 0,
                    }}
                    animate={{
                        left: `${p.x + p.vx}%`,
                        top: `${p.y + p.vy + 60}%`,
                        opacity: [1, 1, 0],
                        scale: [0, 1, 0.6],
                        rotate: p.rotation,
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: 'easeOut',
                    }}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.isCircle ? p.size : p.size * 2.5,
                        backgroundColor: p.color,
                        borderRadius: p.isCircle ? '50%' : '2px',
                    }}
                />
            ))}

            {/* Quick flash burst */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                }}
            />
        </div>
    );
};
