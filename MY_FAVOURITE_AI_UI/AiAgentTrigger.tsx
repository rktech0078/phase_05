'use client';

import { useAiAgent } from '@/contexts/AiAgentContext';
import { Sparkles } from 'lucide-react';

export default function AiAgentTrigger() {
  const { toggle } = useAiAgent();

  return (
    <button
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--gray-300)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        zIndex: 50,
      }}
      className="ai-trigger-btn"
    >
      <Sparkles size={16} />
      <span className="inline">Ask AI</span>
      <style jsx>{`
        .ai-trigger-btn:hover {
          background-color: var(--gray-100);
        }
        :global(.dark) .ai-trigger-btn {
          border-color: var(--gray-800);
        }
        :global(.dark) .ai-trigger-btn:hover {
          background-color: var(--gray-800);
        }
      `}</style>
    </button>
  );
}
