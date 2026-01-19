import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connectivity
    await db.execute('SELECT 1');

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'todo-chatbot',
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        service: 'todo-chatbot',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
