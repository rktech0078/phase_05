'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ChevronRight,
  Save,
  X,
  Loader2,
  Type,
  AlignLeft,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function EditTask() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useNotification();
  const [userId, setUserId] = useState<string | null>(null);
  const { data: sessionData, isPending: sessionLoading } = authClient.useSession();

  useEffect(() => {
    if (sessionData?.user) {
      const taskId = Array.isArray(id) ? id[0] : id;
      if (taskId) {
        setUserId(sessionData.user.id);
        fetchTask(sessionData.user.id, taskId);
      }
    }
  }, [sessionData, sessionLoading, id]);

  const fetchTask = async (currentUserId: string, taskId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${currentUserId}/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
        setTitle(data.title);
        setDescription(data.description || '');
      } else {
        showToast('Failed to fetch task', 'error');
      }
    } catch (err) {
      showToast('Error fetching task', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !task) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/${userId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        showToast('Task updated successfully', 'success');
        router.push(`/tasks/${task.id}`);
      } else {
        const errorData = await response.json();
        showToast(errorData.error?.message || 'Failed to update task', 'error');
      }
    } catch (err) {
      showToast('Error updating task', 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">Preparing edit workspace...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2 text-destructive">Error Loading Task</h1>
        <p className="text-muted-foreground mb-8">Task context lost.</p>
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-secondary/10 py-12">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
        >
          <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          <Link href={`/tasks/${task.id}`} className="hover:text-primary transition-colors truncate max-w-[150px]">{task.title}</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          <span className="text-foreground/60 font-medium">Edit</span>
        </motion.div>

        {/* Edit Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl overflow-hidden border border-border/60 shadow-2xl shadow-primary/5"
        >
          <div className="p-8 md:p-10 space-y-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Refinement Mode
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Edit Task</h1>
              <p className="text-muted-foreground">Modify your task details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Title Input */}
                <div className="space-y-2 group">
                  <label htmlFor="title" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                    <Type className="h-4 w-4" />
                    Task Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-secondary/30 border border-border/40 focus:border-primary focus:bg-background transition-all outline-none font-bold placeholder:text-muted-foreground/30 shadow-sm focus:shadow-xl focus:shadow-primary/5"
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                {/* Description Textarea */}
                <div className="space-y-2 group">
                  <label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                    <AlignLeft className="h-4 w-4" />
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onFocus={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    className="w-full min-h-[160px] p-5 rounded-2xl bg-secondary/30 border border-border/40 focus:border-primary focus:bg-background transition-all outline-none font-medium placeholder:text-muted-foreground/30 resize-none leading-relaxed shadow-sm focus:shadow-xl focus:shadow-primary/5 overflow-hidden"
                    placeholder="Add more details about this task..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-border/40">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:flex-1 h-14 rounded-2xl font-bold gap-2 text-lg shadow-xl shadow-primary/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl font-semibold gap-2 transition-all"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}