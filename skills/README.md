# Reusable Skills Documentation

This directory contains comprehensive skill documentation extracted from the AI-powered Todo Management System. These skills represent reusable patterns, best practices, and implementation strategies that can be applied to similar projects.

## Overview

Each skill document captures a specific aspect of the project architecture and provides:
- **Conceptual Understanding**: What the pattern is and why it matters
- **Implementation Details**: Code examples and patterns
- **Best Practices**: Dos and don'ts
- **Common Pitfalls**: What to avoid
- **Testing Strategies**: How to verify correctness
- **References**: Links to actual implementation files

## Available Skills

### 1. AI Agent Development with Function Calling
**File**: `01-ai-agent-development.md`

Learn how to build AI agents that use function calling (tool use) to interact with application data and services.

**Key Topics:**
- Agent architecture and execution loops
- Function tool definition patterns
- OpenRouter integration
- Multi-turn conversations
- Fuzzy search and ambiguity resolution
- Error handling in agent systems

**Use When:**
- Building chatbots with tool access
- Implementing natural language interfaces
- Creating AI assistants for applications
- Integrating OpenAI/Anthropic function calling

---

### 2. MCP Server Setup and Tool Development
**File**: `02-mcp-server-setup.md`

Master the Model Context Protocol (MCP) for exposing application functionality as standardized tools that AI agents can discover and use.

**Key Topics:**
- MCP server architecture
- Tool definition with Zod schemas
- Request handling patterns
- Service layer integration
- Authentication and authorization
- Deployment strategies

**Use When:**
- Building MCP-compatible servers
- Exposing APIs to AI agents
- Creating reusable tool libraries
- Implementing standardized AI interfaces

---

### 3. Spec-Kit Plus Workflow
**File**: `03-spec-kit-plus-workflow.md`

Implement a documentation-driven development methodology that ensures clear requirements, structured planning, and comprehensive tracking of all development decisions.

**Key Topics:**
- Four-phase workflow (Spec → Plan → Tasks → Implementation)
- Constitution-based development
- Prompt History Records (PHR)
- Architecture Decision Records (ADR)
- Template system
- AI-friendly documentation

**Use When:**
- Starting new projects
- Working with AI coding assistants
- Need clear requirements before coding
- Building complex features
- Maintaining project history

---

### 4. Conversation Management Pattern
**File**: `04-conversation-management.md`

Build persistent conversation management systems for AI chatbots with message storage, conversation history, and multi-session support.

**Key Topics:**
- Database schema for conversations and messages
- Service layer implementation
- API routes for conversation CRUD
- Frontend integration patterns
- Auto-title generation
- Message search and export

**Use When:**
- Building AI chatbots
- Implementing chat interfaces
- Managing conversation history
- Creating multi-session chat apps
- Persisting AI interactions

---

### 5. Service Layer Pattern
**File**: `05-service-layer-pattern.md`

Encapsulate business logic in reusable service classes that separate concerns between API routes, database operations, and business rules.

**Key Topics:**
- Service class structure
- Static method patterns
- Input validation
- Ownership verification
- Transaction support
- Pagination and caching
- Error handling strategies

**Use When:**
- Building any application with business logic
- Need reusable data operations
- Want to separate concerns
- Testing business logic independently
- Sharing logic across API routes and agents

---

### 6. Stateless Architecture
**File**: `06-stateless-architecture.md`

Design systems where the server maintains zero in-memory state between requests, enabling horizontal scalability and reliability.

**Key Topics:**
- Stateless vs stateful comparison
- Database-backed sessions
- External caching with Redis
- Serverless compatibility
- Performance optimization
- Common pitfalls and solutions

**Use When:**
- Building scalable applications
- Deploying to serverless platforms
- Need horizontal scaling
- Want predictable resource usage
- Working with containers/cloud-native

---

## Quick Reference Guide

### By Use Case

**Building an AI Chatbot:**
1. Start with **Conversation Management** for persistence
2. Use **AI Agent Development** for the agent logic
3. Apply **Service Layer Pattern** for business logic
4. Follow **Stateless Architecture** for scalability

**Creating an MCP Server:**
1. Read **MCP Server Setup** for core implementation
2. Use **Service Layer Pattern** for tool logic
3. Apply **Stateless Architecture** principles

**Starting a New Project:**
1. Begin with **Spec-Kit Plus Workflow** for planning
2. Apply **Service Layer Pattern** for architecture
3. Follow **Stateless Architecture** from the start

**Integrating AI into Existing App:**
1. Study **AI Agent Development** for agent patterns
2. Use **MCP Server Setup** to expose existing APIs
3. Add **Conversation Management** if needed

### By Technology

**Next.js / React:**
- Service Layer Pattern
- Stateless Architecture
- Conversation Management (frontend)

**AI / LLMs:**
- AI Agent Development
- MCP Server Setup
- Conversation Management

**Database / ORM:**
- Service Layer Pattern
- Stateless Architecture
- Conversation Management (backend)

**Documentation / Process:**
- Spec-Kit Plus Workflow

## How to Use These Skills

### 1. Learning Mode
Read through skills sequentially to understand the full architecture:
1. Spec-Kit Plus Workflow (process)
2. Stateless Architecture (principles)
3. Service Layer Pattern (structure)
4. Conversation Management (feature)
5. AI Agent Development (AI integration)
6. MCP Server Setup (standardization)

### 2. Reference Mode
Jump to specific skills when you need to implement a particular pattern:
- Need to add AI? → AI Agent Development
- Building an API? → Service Layer Pattern
- Adding chat? → Conversation Management
- Exposing tools? → MCP Server Setup

### 3. Implementation Mode
Follow the code examples and adapt them to your project:
1. Copy relevant code snippets
2. Adjust for your domain (todos → your entities)
3. Follow the best practices
4. Avoid the common pitfalls
5. Test using the testing strategies

## Project Context

These skills are extracted from a production-ready AI-powered todo management application that demonstrates:

**Technology Stack:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Drizzle ORM + PostgreSQL
- Better Auth
- OpenRouter (AI)
- MCP SDK
- Tailwind CSS

**Key Features:**
- Traditional CRUD interface
- AI chatbot with natural language
- Persistent conversations
- MCP tool integration
- Stateless architecture
- Comprehensive documentation

**Constitutional Principles:**
1. Statelessness (zero in-memory state)
2. Agent-centric control (AI makes decisions)
3. MCP tool integration (standardized interfaces)
4. Spec-driven development (documentation first)

## File Structure

```
skills/
├── README.md                           # This file
├── 01-ai-agent-development.md          # AI agents with function calling
├── 02-mcp-server-setup.md              # Model Context Protocol servers
├── 03-spec-kit-plus-workflow.md        # Documentation-driven development
├── 04-conversation-management.md       # Chat persistence patterns
├── 05-service-layer-pattern.md         # Business logic encapsulation
└── 06-stateless-architecture.md        # Scalable system design
```

## Contributing

To add new skills to this collection:

1. **Identify a Reusable Pattern**: Look for patterns used multiple times in the codebase
2. **Create Skill Document**: Use the existing format:
   - Overview
   - Core concepts
   - Implementation patterns
   - Best practices
   - Common pitfalls
   - Testing strategies
   - References
3. **Add to README**: Update this file with the new skill
4. **Link to Implementation**: Reference actual code files

## Related Documentation

- **Constitution**: `.specify/memory/constitution.md` - Project principles
- **Specifications**: `specs/` - Feature specifications
- **Templates**: `.specify/templates/` - Document templates
- **Prompt History**: `history/prompts/` - AI interaction records

## Learning Path

### Beginner
Start here if you're new to these concepts:
1. **Service Layer Pattern** - Fundamental architecture
2. **Stateless Architecture** - Core principle
3. **Spec-Kit Plus Workflow** - Development process

### Intermediate
Build on the basics:
4. **Conversation Management** - Feature implementation
5. **AI Agent Development** - AI integration basics

### Advanced
Master the full stack:
6. **MCP Server Setup** - Standardized tool interfaces

## Real-World Applications

These skills have been successfully applied in:

✅ **AI-Powered Todo App** (this project)
- Natural language task management
- Persistent chat conversations
- Multi-user support
- Serverless deployment

**Potential Applications:**
- Customer support chatbots
- AI-powered CRM systems
- Documentation assistants
- Code generation tools
- Data analysis platforms
- Educational tutoring systems

## Success Metrics

Projects using these skills should achieve:
- ✅ **Scalability**: Horizontal scaling without code changes
- ✅ **Reliability**: No data loss on server restarts
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Testability**: High test coverage (>80%)
- ✅ **Documentation**: Complete audit trail
- ✅ **AI Integration**: Natural language interfaces
- ✅ **Standardization**: MCP-compatible tools

## Support

For questions or issues:
1. Review the relevant skill document
2. Check the referenced implementation files
3. Consult the project constitution
4. Review prompt history for similar problems

## License

These skills are documented from an open-source project. Use them freely in your own projects.

---

**Last Updated**: 2026-01-11
**Project**: AI-Powered Todo Management System
**Version**: 1.0.0
