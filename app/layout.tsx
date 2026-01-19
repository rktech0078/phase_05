import './globals.css';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { cn } from '@/lib/utils';
import { AiAgentProvider } from '@/contexts/AiAgentContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AiAgent } from '@/components/ai-agent/AiAgent';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Todo Application',
  description: 'A secure task management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <AiAgentProvider>
          <NotificationProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
            </div>
            <AiAgent />
          </NotificationProvider>
        </AiAgentProvider>
      </body>
    </html>
  );
}