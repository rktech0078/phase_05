import { NextRequest } from 'next/server';
import { auth } from '../../../../../lib/auth';
import { getTaskById, updateTask, deleteTask } from '../../../../../lib/tasks';
import { logger } from '../../../../../lib/error';

export async function GET(request: NextRequest, { params }: { params: Promise<{ user_id: string, id: string }> }) {
  const { user_id: userId, id: taskId } = await params;
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

    // Get the specific task
    const task = await getTaskById(taskId, userId);

    if (!task) {
      return new Response(
        JSON.stringify({ error: { message: 'Task not found' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(task),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error fetching task in API: ${message}`);
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ user_id: string, id: string }> }) {
  const { user_id: userId, id: taskId } = await params;
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
    const { title, description, isCompleted } = body;

    // Update task
    const updatedTask = await updateTask(taskId, userId, { title, description, isCompleted });

    return new Response(
      JSON.stringify(updatedTask),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error updating task in API: ${message}`);
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ user_id: string, id: string }> }) {
  const { user_id: userId, id: taskId } = await params;
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

    // Delete task
    await deleteTask(taskId, userId);

    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error deleting task in API: ${message}`);
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}