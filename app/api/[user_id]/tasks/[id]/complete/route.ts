import { NextRequest } from 'next/server';
import { auth } from '../../../../../../lib/auth';
import { toggleTaskCompletion } from '../../../../../../lib/tasks';
import { logger } from '../../../../../../lib/error';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ user_id: string, id: string }> }) {
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
    const { isCompleted } = body;

    if (typeof isCompleted !== 'boolean') {
      return new Response(
        JSON.stringify({ error: { message: 'isCompleted must be a boolean' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle task completion status
    const updatedTask = await toggleTaskCompletion(taskId, userId, isCompleted);

    return new Response(
      JSON.stringify(updatedTask),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error toggling task completion in API: ${message}`);
    return new Response(
      JSON.stringify({ error: { message } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}