'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useNotification } from '@/contexts/NotificationContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast, triggerConfetti } = useNotification();
  const [userId, setUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: sessionData, isPending: sessionLoading } = authClient.useSession();

  const fetchTask = useCallback(async (currentUserId: string, taskId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${currentUserId}/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
      } else {
        showToast('Failed to fetch task', 'error');
      }
    } catch (err) {
      showToast('Error fetching task', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (sessionData?.user) {
      const taskId = Array.isArray(id) ? id[0] : id;
      if (taskId) {
        setUserId(sessionData.user.id);
        fetchTask(sessionData.user.id, taskId);
      }
    }
  }, [sessionData, sessionLoading, id, fetchTask]);


  const handleToggleTask = async () => {
    if (!userId || !task) return;

    try {
      const response = await fetch(`/api/${userId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !task.isCompleted }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
        if (updatedTask.isCompleted) triggerConfetti();
        showToast(updatedTask.isCompleted ? 'Task completed!' : 'Task active', 'success');
      } else {
        showToast('Failed to update task', 'error');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      showToast('Error updating task', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!userId || !task) return;

    try {
      const response = await fetch(`/api/${userId}/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Task deleted successfully', 'success');
        router.push('/dashboard');
      } else {
        showToast('Failed to delete task', 'error');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Error deleting task', 'error');
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Fetching task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Oops! Task not found</h1>
        <p className="text-muted-foreground mb-8">The task you are looking for might have been deleted or moved.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-secondary/5 py-8">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Header Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link
            href="/dashboard"
            className="group flex flex-col items-start gap-0.5 hover:text-primary transition-all"
          >
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-bold uppercase tracking-wider">Dashboard</span>
            </div>
          </Link>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button asChild variant="outline" className="flex items-center gap-2 rounded-full h-10 px-6 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm">
              <Link href={`/tasks/edit/${task.id}`} className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold text-sm">Edit Task</span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl overflow-hidden border border-border/60 shadow-2xl shadow-primary/5"
        >
          <div className="p-8 md:p-10 space-y-6">
            {/* Header: Title & Status */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                      task.isCompleted
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : "bg-primary/10 text-primary border border-primary/20"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {task.isCompleted ? 'Completed' : 'Priority'}
                  </motion.div>
                </div>
                <h1 className={cn(
                  "text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight transition-all duration-500",
                  task.isCompleted && "text-muted-foreground/60 line-through decoration-border"
                )}>
                  {task.title}
                </h1>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleTask}
                className={cn(
                  "flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                  task.isCompleted
                    ? "bg-green-500 text-white shadow-green-500/20"
                    : "bg-background border-2 border-primary/20 text-muted-foreground hover:border-primary/50"
                )}
              >
                {task.isCompleted ? <CheckCircle2 className="h-8 w-8" /> : <Circle className="h-8 w-8" />}
              </motion.button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Description</h3>
              <div className="text-lg text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
                {task.description || <span className="italic text-muted-foreground/40 font-normal text-base">No description provided.</span>}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/40">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Created On</p>
                  <p className="text-sm font-semibold">
                    {new Date(task.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Last Updated</p>
                  <p className="text-sm font-semibold">
                    {new Date(task.updatedAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions Panel */}
          <div className="bg-secondary/10 p-5 md:px-10 flex items-center justify-center border-t border-border/40">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full max-w-xs">
              <Button
                variant="destructive"
                className="w-full flex items-center justify-center gap-2.5 rounded-xl h-12 shadow-lg shadow-destructive/5 hover:shadow-destructive/10 transition-all font-bold text-base"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-5 w-5" />
                <span>Delete Task</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal Overlay */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative glass-card p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-destructive/20"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Are you absolutely sure?</h3>
                <p className="text-muted-foreground mb-8">This action cannot be undone. This task will be permanently deleted from our servers.</p>
                <div className="flex flex-col gap-2">
                  <Button variant="destructive" size="lg" className="w-full rounded-2xl h-12" onClick={handleDeleteTask}>
                    Yes, Delete Task
                  </Button>
                  <Button variant="ghost" size="lg" className="w-full rounded-2xl h-12" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}