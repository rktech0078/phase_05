/**
 * API request and response types
 */

// Task API Types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  dueDate?: string;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  dueDate?: string;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: string;
  recurrencePattern: 'none' | 'daily' | 'weekly' | 'monthly';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTasksQuery {
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  isCompleted?: boolean;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: boolean;
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchTasksQuery {
  query: string;
  limit?: number;
  offset?: number;
}

// Audit API Types
export interface AuditLogResponse {
  id: string;
  taskId?: string;
  userId: string;
  action: 'created' | 'updated' | 'completed' | 'deleted';
  changes?: Record<string, any>;
  timestamp: string;
  correlationId?: string;
}

export interface GetAuditLogsQuery {
  taskId?: string;
  userId?: string;
  action?: 'created' | 'updated' | 'completed' | 'deleted';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Common API Types
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
