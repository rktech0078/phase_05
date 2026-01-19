import { NextRequest } from 'next/server';
import { auth } from '../../../../lib/auth';
import { createTask, getUserTasks } from '../../../../lib/tasks';
import { logger } from '../../../../lib/error';

export async function GET(request: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const { user_id: userId } = await params;
  try {
    // Extract user_id from the URL
    const url = new URL(request.url);

    // Verify that the authenticated user matches the requested user_id
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || session.user.id !== userId) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const completedParam = url.searchParams.get('completed');
    let completed: boolean | undefined;

    if (completedParam !== null) {
      completed = completedParam === 'true';
    }

    // Get user tasks
    const tasks = await getUserTasks(userId, completed) as unknown[];

    return new Response(
      JSON.stringify({ tasks, total: tasks.length, limit: 20, offset: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error fetching tasks: ${message}`);
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const { user_id: userId } = await params;
  try {
    // Verify that the authenticated user matches the requested user_id
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || session.user.id !== userId) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description } = body;

    // Create task
    const newTask = await createTask(userId, { title, description });

    return new Response(
      JSON.stringify(newTask),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error creating task: ${message}`);
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}