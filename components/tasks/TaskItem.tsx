'use client';

import { useState } from 'react';
import { Check, X, Pencil, Trash2, Circle, CheckCircle2, Calendar, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskItem = ({ task, onToggle, onDelete, onEdit }: TaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  const handleSaveEdit = () => {
    onEdit({ ...task, title: editTitle, description: editDescription });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-300 h-full flex flex-col min-h-[160px] overflow-hidden",
        task.isCompleted
          ? "bg-muted/30 border-border/40"
          : "bg-card border-border/60 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Task title"
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-input bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder="Task description (optional)"
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveEdit} size="sm" className="gap-1.5 h-8">
                <Check className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="gap-1.5 h-8">
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-4 h-full relative"
          >
            {/* Confirmation Overlay */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm rounded-lg text-center p-4"
                >
                  <div className="mb-2 p-2 rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold mb-3">Delete this task?</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onDelete(task.id)}
                      variant="destructive"
                      size="sm"
                      className="h-8 px-4"
                    >
                      Delete
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-4 border border-input"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Checkbox Area */}
            <button
              onClick={() => onToggle(task.id, !task.isCompleted)}
              className={cn(
                "flex-shrink-0 mt-0.5 rounded-full transition-all duration-300",
                task.isCompleted
                  ? "text-green-500 scale-110"
                  : "text-muted-foreground hover:text-primary hover:scale-110"
              )}
            >
              {task.isCompleted ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </button>

            {/* Content Area */}
            <div className="flex-1 min-w-0 space-y-1">
              <Link href={`/tasks/${task.id}`}>
                <h3
                  className={cn(
                    "text-base font-semibold transition-all duration-300 hover:text-primary cursor-pointer",
                    task.isCompleted
                      ? "line-through text-muted-foreground decoration-border"
                      : "text-foreground"
                  )}
                >
                  {task.title}
                </h3>
              </Link>

              {task.description && (
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-all duration-300 line-clamp-4",
                    task.isCompleted
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground"
                  )}
                >
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-4 pt-1">
                <div className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  task.isCompleted ? "text-muted-foreground/40" : "text-muted-foreground/60"
                )}>
                  <Calendar className="h-3 w-3" />
                  {new Date(task.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 md:translate-x-2 group-hover:translate-x-0">
              <Link href={`/tasks/${task.id}`} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="View details">
                <Eye className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};