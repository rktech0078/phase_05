# Research: AI-Powered Todo Chatbot

## Overview
This document contains research findings for implementing the AI-Powered Todo Chatbot with stateless architecture, MCP tools, and OpenAI agents.

## Decision: Tech Stack Selection
**Rationale**: Selected the technology stack based on the project requirements for stateless architecture, AI integration, and MCP tools.
- **Frontend**: Next.js 14+ with App Router for modern React development
- **Backend**: Next.js API routes for unified stack
- **AI Framework**: OpenAI Agents SDK for natural language processing
- **MCP Server**: Official MCP SDK for tool integration
- **ORM**: SQLModel for type-safe database operations
- **Database**: Neon Serverless PostgreSQL for scalability
- **Authentication**: Better Auth for secure user management

## Decision: Stateless Architecture Implementation
**Rationale**: To ensure the server maintains zero in-memory state between requests as required by the constitution.
- All conversation history will be fetched from the database for each request
- User session data will be stored in encrypted cookies/tokens
- No server-side caching of user context between requests
- Each request will reconstruct the necessary context from the database

## Decision: MCP Tool Design
**Rationale**: MCP tools will serve as the interface between the AI agent and the database operations.
- **createTodo**: Creates a new todo item in the database
- **updateTodo**: Updates an existing todo item
- **deleteTodo**: Deletes a todo item
- **listTodos**: Retrieves todos based on filters (all, completed, pending, by date)
- **completeTodo**: Marks a todo as completed/incomplete

## Decision: Data Models
**Rationale**: Designed data models to support the required functionality while maintaining user data isolation.
- **Todo Model**: Contains id, title, description, completed status, timestamps, and user_id
- **Conversation Model**: Contains message history with role, content, timestamp, and user_id

## Decision: AI Agent Integration
**Rationale**: Using OpenAI Agents SDK to process natural language input and determine appropriate MCP tool calls.
- The agent will receive the full conversation history plus new user input
- Based on the input, the agent will decide which MCP tool(s) to call
- The agent will generate natural language responses based on tool results
- Error handling will be implemented to manage tool failures gracefully

## Decision: Authentication Approach
**Rationale**: Using Better Auth to handle user authentication and ensure data isolation.
- User authentication will be validated on each request
- User ID will be passed to all MCP tools to ensure data access is scoped correctly
- Session management will be handled by Better Auth with secure tokens