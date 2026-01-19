# API Contract: Task Management

## Overview
This document defines the API contract for task management operations in the Todo Full-Stack Web Application.

## Base Path
`/api/{user_id}/tasks`

## Authentication
All endpoints require authentication. The user ID in the path must match the authenticated user's ID.

## Endpoints

### GET /api/{user_id}/tasks
**Description**: List all tasks for a specific user

**Request**:
- Method: GET
- Path: `/api/{user_id}/tasks`
- Headers: 
  - `Authorization: Bearer {token}` (required)
- Query Parameters:
  - `completed` (optional): Filter by completion status (true/false)
  - `limit` (optional): Number of tasks to return (default: 20, max: 100)
  - `offset` (optional): Number of tasks to skip (for pagination)

**Response**:
- Success: 200 OK
- Body:
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "is_completed": "boolean",
      "user_id": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "total": "number",
  "limit": "number",
  "offset": "number"
}
```
- Error: 401 Unauthorized (if not authenticated)
- Error: 403 Forbidden (if user_id doesn't match authenticated user)
- Error: 404 Not Found (if user doesn't exist)

---

### POST /api/{user_id}/tasks
**Description**: Create a new task for a specific user

**Request**:
- Method: POST
- Path: `/api/{user_id}/tasks`
- Headers:
  - `Authorization: Bearer {token}` (required)
  - `Content-Type: application/json`
- Body:
```json
{
  "title": "string",
  "description": "string"
}
```

**Response**:
- Success: 201 Created
- Body:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "is_completed": "boolean",
  "user_id": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
- Error: 400 Bad Request (if validation fails)
- Error: 401 Unauthorized (if not authenticated)
- Error: 403 Forbidden (if user_id doesn't match authenticated user)

---

### GET /api/{user_id}/tasks/{id}
**Description**: Get details of a specific task

**Request**:
- Method: GET
- Path: `/api/{user_id}/tasks/{id}`
- Headers:
  - `Authorization: Bearer {token}` (required)

**Response**:
- Success: 200 OK
- Body:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "is_completed": "boolean",
  "user_id": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
- Error: 401 Unauthorized (if not authenticated)
- Error: 403 Forbidden (if user_id doesn't match authenticated user)
- Error: 404 Not Found (if task doesn't exist)

---

### PUT /api/{user_id}/tasks/{id}
**Description**: Update a specific task

**Request**:
- Method: PUT
- Path: `/api/{user_id}/tasks/{id}`
- Headers:
  - `Authorization: Bearer {token}` (required)
  - `Content-Type: application/json`
- Body:
```json
{
  "title": "string",
  "description": "string",
  "is_completed": "boolean"
}
```

**Response**:
- Success: 200 OK
- Body:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "is_completed": "boolean",
  "user_id": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
- Error: 400 Bad Request (if validation fails)
- Error: 401 Unauthorized (if not authenticated)
- Error: 403 Forbidden (if user_id doesn't match authenticated user)
- Error: 404 Not Found (if task doesn't exist)

---

### DELETE /api/{user_id}/tasks/{id}
**Description**: Delete a specific task

**Request**:
- Method: DELETE
- Path: `/api/{user_id}/tasks/{id}`
- Headers:
  - `Authorization: Bearer {token}` (required)

**Response**:
- Success: 204 No Content
- Error: 401 Unauthorized (if not authenticated)
- Error: 403 Forbidden (if user_id doesn't match authenticated user)
- Error: 404 Not Found (if task doesn't exist)

---

### PATCH /api/{user_id}/tasks/{id}/complete
**Description**: Toggle completion status of a task

**Request**:
- Method: PATCH
- Path: `/api/{user_id}/tasks/{id}/complete`
- Headers:
  - `Authorization: Bearer {token}` (required)
  - `Content-Type: application/json`
- Body:
```json
{
  "is_completed": "boolean"
}
```

**Response**:
- Success: 200 OK
- Body:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "is_completed": "boolean",
  "user_id": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
- Error: 400 Bad Request (if validation fails)
- Error: 401 Unauthorized (if not authenticated)
- Error: 403 Forbidden (if user_id doesn't match authenticated user)
- Error: 404 Not Found (if task doesn't exist)