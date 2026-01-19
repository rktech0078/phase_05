'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AiAgentContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggle: () => void;
}

const AiAgentContext = createContext<AiAgentContextType | undefined>(undefined);

export function AiAgentProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(prev => !prev);

    return (
        <AiAgentContext.Provider value={{ isOpen, setIsOpen, toggle }}>
            {children}
        </AiAgentContext.Provider>
    );
}

export function useAiAgent() {
    const context = useContext(AiAgentContext);
    if (context === undefined) {
        throw new Error('useAiAgent must be used within an AiAgentProvider');
    }
    return context;
}
