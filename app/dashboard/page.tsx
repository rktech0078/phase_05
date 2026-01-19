'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Circle, ListTodo, Loader2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, triggerConfetti } = useNotification();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: sessionData, isPending: sessionLoading, error: sessionError } = authClient.useSession();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const fetchTasks = useCallback(async (currentUserId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${currentUserId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      } else {
        showToast('Failed to fetch tasks', 'error');
      }
    } catch (err) {
      showToast('Error fetching tasks', 'error');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (sessionData?.user) {
      if (sessionData.user.id !== userId) {
        setUserId(sessionData.user.id);
        fetchTasks(sessionData.user.id);
      }
    }
  }, [sessionData, sessionLoading, userId, fetchTasks]);

  useEffect(() => {
    if (sessionError) {
      showToast('Error getting session', 'error');
      console.error(sessionError);
    }
  }, [sessionError, showToast]);

  const handleManualRefresh = () => {
    if (userId) {
      setIsRefreshing(true);
      fetchTasks(userId);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newTaskTitle.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/${userId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks([newTask, ...tasks]);
        setNewTaskTitle('');
        setNewTaskDescription('');
        showToast('Task created successfully', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.error?.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      showToast('Error creating task', 'error');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    if (!userId) return;

    // Optimistic update
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, isCompleted: completed } : task
    ));

    try {
      const response = await fetch(`/api/${userId}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: completed }),
      });

      if (!response.ok) {
        // Revert on error
        setTasks(tasks.map(task =>
          task.id === id ? { ...task, isCompleted: !completed } : task
        ));
        showToast("Failed to update status", "error");
      } else {
        if (completed) triggerConfetti();
        showToast(completed ? "Task completed" : "Task marked incomplete", "success");
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, isCompleted: !completed } : task
      ));
      showToast("Error updating task", "error");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!userId) return;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.filter(task => task.id !== id));

    try {
      const response = await fetch(`/api/${userId}/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setTasks(previousTasks);
        showToast("Failed to delete task", "error");
      } else {
        showToast("Task deleted", "success");
      }
    } catch (err) {
      console.error(err);
      setTasks(previousTasks);
      showToast("Error deleting task", "error");
    }
  };

  const handleEditTask = async (task: Task) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/${userId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
        showToast("Task updated", "success");
      } else {
        showToast("Failed to update task", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating task", "error");
    }
  };

  // Stats
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const pendingCount = tasks.filter(t => !t.isCompleted).length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium">Session error occurred</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background to-secondary/10">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {greeting}, <span className="text-primary">{sessionData?.user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            You have {pendingCount} pending task{pendingCount !== 1 ? 's' : ''} to complete today.
          </p>
        </motion.div>

        {/* Stats Cards with Staggered Animation */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <motion.div variants={item} className="glass-card rounded-xl p-5 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <ListTodo className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{tasks.length}</p>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
            </div>
          </motion.div>
          <motion.div variants={item} className="glass-card rounded-xl p-5 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{completedCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
            </div>
          </motion.div>
          <motion.div variants={item} className="glass-card rounded-xl p-5 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-600 shadow-sm">
              <Circle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Create Task Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="relative group mb-10"
          >
            <div className="relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-4 shadow-sm transition-all duration-300 group-focus-within:border-primary/50 group-focus-within:shadow-lg group-focus-within:shadow-primary/5">
              <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row items-end gap-3">
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-3 bg-secondary/30 rounded-xl px-4 py-3 focus-within:bg-secondary/50 transition-colors">
                    <ListTodo className="h-5 w-5 text-primary/60 shrink-0" />
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full text-base font-medium bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/40 text-foreground"
                      required
                    />
                  </div>
                  <div className="bg-secondary/20 rounded-xl px-4 py-2 focus-within:bg-secondary/40 transition-colors">
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => {
                        setNewTaskDescription(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder="Add description (optional)"
                      className="w-full text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30 text-muted-foreground resize-none min-h-[28px] max-h-[150px] overflow-hidden leading-relaxed"
                      rows={1}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isCreating || !newTaskTitle.trim()}
                  className={cn(
                    "w-full md:w-12 h-12 rounded-xl shadow-md transition-all duration-200 transform active:scale-95 flex items-center justify-center shrink-0",
                    newTaskTitle.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Task List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">Your Tasks</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-secondary"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                {tasks.length > 0 ? `${Math.round((completedCount / tasks.length) * 100)}% Done` : '0% Done'}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-xl p-16 text-center border-dashed border-2 bg-transparent"
                >
                  <div className="mx-auto h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <ListTodo className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Your list is empty. Add a task above to start your productive day!
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}