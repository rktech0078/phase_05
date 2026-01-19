# API Contracts: AI-Powered Todo Chatbot

## MCP Tools API

### createTodo
**Description**: Creates a new todo item in the database

**Request**:
```json
{
  "title": "string",
  "description": "string | null",
  "userId": "string (UUID)"
}
```

**Response**:
```json
{
  "success": "boolean",
  "todo": {
    "id": "string (UUID)",
    "title": "string",
    "description": "string | null",
    "completed": "boolean",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "userId": "string (UUID)"
  },
  "error": "string | null"
}
```

### updateTodo
**Description**: Updates an existing todo item

**Request**:
```json
{
  "id": "string (UUID)",
  "title": "string | null",
  "description": "string | null",
  "completed": "boolean | null",
  "userId": "string (UUID)"
}
```

**Response**:
```json
{
  "success": "boolean",
  "todo": {
    "id": "string (UUID)",
    "title": "string",
    "description": "string | null",
    "completed": "boolean",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "userId": "string (UUID)"
  },
  "error": "string | null"
}
```

### deleteTodo
**Description**: Deletes a todo item

**Request**:
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)"
}
```

**Response**:
```json
{
  "success": "boolean",
  "message": "string",
  "error": "string | null"
}
```

### listTodos
**Description**: Retrieves todos based on filters

**Request**:
```json
{
  "userId": "string (UUID)",
  "filter": "'all' | 'completed' | 'pending' | 'by_date'",
  "date": "string (ISO date) | null" // required if filter is 'by_date'
}
```

**Response**:
```json
{
  "success": "boolean",
  "todos": [
    {
      "id": "string (UUID)",
      "title": "string",
      "description": "string | null",
      "completed": "boolean",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "userId": "string (UUID)"
    }
  ],
  "error": "string | null"
}
```

### completeTodo
**Description**: Marks a todo as completed or incomplete

**Request**:
```json
{
  "id": "string (UUID)",
  "completed": "boolean",
  "userId": "string (UUID)"
}
```

**Response**:
```json
{
  "success": "boolean",
  "todo": {
    "id": "string (UUID)",
    "title": "string",
    "description": "string | null",
    "completed": "boolean",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "userId": "string (UUID)"
  },
  "error": "string | null"
}
```