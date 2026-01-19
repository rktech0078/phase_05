# Data Models: AI-Powered Todo Chatbot

## Todo Model
Represents a user task with the following attributes:

- **id**: string (UUID) - Unique identifier for the todo
- **title**: string - Title of the todo (required, max 255 characters)
- **description**: string | null - Optional description of the todo (max 1000 characters)
- **completed**: boolean - Whether the todo is completed (default: false)
- **created_at**: datetime - Timestamp when the todo was created
- **updated_at**: datetime - Timestamp when the todo was last updated
- **user_id**: string (UUID) - Foreign key to the user who owns this todo

### Validation Rules
- Title must not be empty
- Title must be less than 255 characters
- Description, if provided, must be less than 1000 characters
- user_id must reference an existing user
- completed status can be toggled by the owner

### State Transitions
- A todo can transition from incomplete to complete
- A todo can transition from complete back to incomplete
- A todo cannot be deleted by other users

## Conversation Model
Represents a message in the conversation history:

- **id**: string (UUID) - Unique identifier for the message
- **conversation_id**: string (UUID) - Identifier grouping related messages
- **role**: "user" | "assistant" - Role of the message sender
- **content**: string - Content of the message
- **timestamp**: datetime - When the message was created
- **user_id**: string (UUID) - Foreign key to the user who owns this conversation

### Validation Rules
- Role must be either "user" or "assistant"
- Content must not be empty
- Content must be less than 5000 characters
- user_id must reference an existing user
- conversation_id should group messages from the same session

## Relationships
- Todo belongs to one User (user_id → users.id)
- Conversation belongs to one User (user_id → users.id)
- One User can have many Todos
- One User can have many Conversations