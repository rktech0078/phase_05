'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-destructive/5">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center space-y-8"
            >
                {/* Error Icon */}
                <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <AlertCircle className="h-12 w-12" />
                </div>

                {/* Error Text */}
                <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Something went wrong!
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We encountered an unexpected error. Don't worry, your tasks are safe.
                        You can try refreshing the page or returning home.
                    </p>
                    {error.digest && (
                        <code className="block bg-muted p-2 rounded text-xs font-mono text-muted-foreground">
                            Error ID: {error.digest}
                        </code>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                        onClick={() => reset()}
                        size="lg"
                        className="gap-2 px-8"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try again
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="gap-2 px-8"
                    >
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Go to Home
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
