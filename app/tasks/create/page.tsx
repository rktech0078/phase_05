'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function CreateTask() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { showToast } = useNotification();
  const router = useRouter();

  const { data: sessionData, isPending: sessionLoading } = authClient.useSession();
  const userId = sessionData?.user?.id;
  const isAuthError = !sessionLoading && !sessionData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/${userId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (response.ok) {
        showToast('Task created successfully', 'success');
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        showToast(errorData.error?.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      showToast('Error creating task', 'error');
      console.error(err);
    }
  };

  if (isAuthError) return (
    <div className="container mx-auto p-4 text-center mt-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold">User not authenticated</h1>
      <Button onClick={() => router.push('/sign-in')} className="mt-4">Sign In</Button>
    </div>
  );

  if (!userId || sessionLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-2xl mt-10">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="What needs to be done?"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all min-h-[150px]"
            placeholder="Add some details..."
          />
        </div>

        <div className="flex gap-4 pt-2">
          <Button
            type="submit"
            size="lg"
            className="flex-1 rounded-xl h-12"
          >
            Create Task
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push('/dashboard')}
            className="flex-1 rounded-xl h-12"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}