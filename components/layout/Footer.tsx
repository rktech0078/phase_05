'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin, Heart, ListTodo } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="border-t bg-background/50 backdrop-blur-xl transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Logo & Info */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                <ListTodo className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                Todo App
                            </span>
                        </Link>
                        <p className="text-muted-foreground max-w-xs leading-relaxed">
                            Organize your workflow and boost productivity with our modern, AI-ready task management platform.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <a href="#" className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Platform</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><Link href="/" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Antigravity Todo. All rights reserved.</p>
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/30 ring-1 ring-border">
                        <span>Made with</span>
                        <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                        <span>by</span>
                        <span className="font-semibold text-foreground">Rafay</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
