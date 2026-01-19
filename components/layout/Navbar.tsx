'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authClient } from '@/lib/auth-client';
import {
    Loader2,
    Menu,
    X,
    LayoutDashboard,
    ListTodo,
    LogOut,
    Sparkles
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export function Navbar() {
    const { data: session, isPending: loading } = authClient.useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    const handleSignOutClick = () => {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
        setShowSignOutConfirm(true);
    };

    const confirmSignOut = async () => {
        setIsSigningOut(true);
        try {
            await authClient.signOut();
            setShowSignOutConfirm(false);
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsSigningOut(false);
        }
    };

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        // Add more public links if needed
    ];

    const menuVariants = {
        closed: {
            opacity: 0,
            y: 10,
            scale: 0.95,
            transition: { duration: 0.2 }
        },
        open: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 20 }
        }
    };

    const sidebarVariants = {
        closed: { x: "100%", opacity: 0 },
        open: {
            x: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 30 }
        }
    };

    return (
        <>
            <ConfirmationModal
                isOpen={showSignOutConfirm}
                onClose={() => setShowSignOutConfirm(false)}
                onConfirm={confirmSignOut}
                title="Sign Out"
                description="Are you sure you want to sign out? You will need to log in again to access your tasks."
                confirmLabel="Sign Out"
                isLoading={isSigningOut}
            />

            <header className="sticky top-0 z-[100] w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-b-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">

                        {/* Brand / Logo */}
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2.5 group">
                                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition-transform group-hover:scale-105">
                                    <ListTodo className="h-5 w-5" />
                                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 hidden sm:inline-block">
                                    TaskFlow
                                </span>
                            </Link>

                            {/* Desktop Nav Links */}
                            <nav className="hidden md:flex items-center gap-1">
                                {session && navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "relative px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-muted/60",
                                            pathname === link.href ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {link.label}
                                        {pathname === link.href && (
                                            <motion.div
                                                layoutId="desktop-nav-indicator"
                                                className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Right Section: Auth & Mobile Toggle */}
                        <div className="flex items-center gap-3">
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : session ? (
                                <div className="flex items-center gap-3">
                                    {/* Desktop Profile Menu */}
                                    <div className="relative hidden md:block" ref={profileRef}>
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className={cn(
                                                "flex items-center gap-2.5 rounded-full border border-border/40 bg-background pl-1 pr-3 py-1 transition-all hover:border-border/80 hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-primary/20",
                                                isProfileOpen && "border-primary/50 bg-accent/10 ring-2 ring-primary/10"
                                            )}
                                        >
                                            <Avatar className="h-8 w-8 border border-white/10 ring-2 ring-background">
                                                <AvatarImage src={session.user.image || undefined} alt={session.user.name} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                                    {session.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-foreground/90 max-w-[100px] truncate">
                                                {session.user.name.split(' ')[0]}
                                            </span>
                                        </button>

                                        <AnimatePresence>
                                            {isProfileOpen && (
                                                <motion.div
                                                    initial="closed"
                                                    animate="open"
                                                    exit="closed"
                                                    variants={menuVariants}
                                                    className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-2 shadow-xl ring-1 ring-black/5"
                                                >
                                                    <div className="px-3 py-3 mb-2 border-b border-border/50">
                                                        <p className="text-sm font-semibold text-foreground truncate">{session.user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Link
                                                            href="/dashboard"
                                                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-all group"
                                                        >
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                <LayoutDashboard className="h-4 w-4" />
                                                            </div>
                                                            Dashboard
                                                        </Link>
                                                        {/* Add Settings or other links here */}
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-border/50">
                                                        <button
                                                            onClick={handleSignOutClick}
                                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all group"
                                                        >
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                                                                <LogOut className="h-4 w-4" />
                                                            </div>
                                                            Sign Out
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Mobile Menu Toggle */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsMobileMenuOpen(true)}
                                        className="md:hidden p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                        aria-label="Open menu"
                                    >
                                        <Menu className="h-6 w-6" />
                                    </motion.button>
                                </div>
                            ) : (
                                // Unauthenticated State
                                <div className="flex items-center gap-3">
                                    <Link href="/sign-in" className="hidden md:block">
                                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log In</Button>
                                    </Link>
                                    <Link href="/sign-up">
                                        <Button className="rounded-xl shadow-lg shadow-primary/20">Get Started</Button>
                                    </Link>
                                    {/* Mobile Menu Toggle for Guests */}
                                    <button
                                        onClick={() => setIsMobileMenuOpen(true)}
                                        className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-accent transition-colors"
                                    >
                                        <Menu className="h-6 w-6" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={sidebarVariants}
                            className="fixed inset-y-0 right-0 z-[101] w-[300px] bg-background border-l border-border/50 shadow-2xl md:hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                                <span className="text-lg font-bold">Menu</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 rounded-full hover:bg-accent transition-colors"
                                >
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                {session ? (
                                    <>
                                        {/* User Info Card */}
                                        <div className="mb-8 p-4 rounded-2xl bg-accent/30 border border-border/50 flex flex-col items-center text-center">
                                            <Avatar className="h-16 w-16 mb-3 ring-4 ring-background shadow-sm">
                                                <AvatarImage src={session.user.image || undefined} />
                                                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                                    {session.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h3 className="font-bold text-foreground text-lg">{session.user.name}</h3>
                                            <p className="text-sm text-muted-foreground break-all">{session.user.email}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Navigation</p>
                                            {navLinks.map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all",
                                                        pathname === link.href
                                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                            : "text-foreground/80 hover:bg-accent"
                                                    )}
                                                >
                                                    <link.icon className="h-5 w-5" />
                                                    {link.label}
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-border/50">
                                            <button
                                                onClick={handleSignOutClick}
                                                className="flex w-full items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <LogOut className="h-5 w-5" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-4 mt-4">
                                        <div className="text-center mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                                                <Sparkles className="h-7 w-7" />
                                            </div>
                                            <h3 className="font-bold text-xl">Welcome to TaskFlow</h3>
                                            <p className="text-muted-foreground mt-2 text-sm">Organize your life and get things done.</p>
                                        </div>
                                        <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button variant="outline" className="w-full h-12 rounded-xl text-base border-border/60">Log In</Button>
                                        </Link>
                                        <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/20">Create Account</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
