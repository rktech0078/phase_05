---
description: Build AI agents with OpenAI Agents SDK for TypeScript - multi-agent workflows, handoffs, guardrails, and tracing
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This skill helps you build agentic AI applications using the OpenAI Agents SDK for TypeScript/JavaScript. The SDK provides lightweight primitives for creating multi-agent workflows with agents, handoffs, guardrails, and built-in tracing.

## Core Concepts

### Agents
Agents are LLMs equipped with instructions and tools. Each agent has:
- **Name**: Identifier for the agent
- **Instructions**: System prompt defining behavior
- **Tools**: Functions the agent can call
- **Handoff Description**: How other agents should transfer to this agent

### Handoffs
Handoffs allow agents to delegate tasks to specialized agents dynamically during execution.

### Guardrails
Guardrails validate agent inputs before processing, ensuring quality and safety.

### Tracing
Built-in tracing for debugging and monitoring agent execution in the OpenAI dashboard.

## Common Patterns

### 1. Multi-Agent Workflow with Handoffs

```typescript
import { Agent, run } from '@openai/agents';
import { z } from 'zod';

// Create specialized agents
const billingAgent = new Agent({
  name: 'Billing Specialist',
  instructions: 'You handle billing inquiries, payment issues, and invoice questions.',
  handoffDescription: 'Transfer here for billing, payments, and invoice questions',
  tools: [checkInvoiceTool, processRefundTool],
});

const technicalAgent = new Agent({
  name: 'Technical Support',
  instructions: 'You help with technical issues, bugs, and feature questions.',
  handoffDescription: 'Transfer here for technical problems and feature support',
  tools: [checkSystemStatusTool, createTicketTool],
});

// Create triage agent
const triageAgent = Agent.create({
  name: 'Customer Service Triage',
  instructions: 'Route customers to the appropriate specialist based on their needs.',
  handoffs: [billingAgent, technicalAgent],
});

// Run the workflow
const result = await run(
  triageAgent,
  'I was charged twice for my subscription last month'
);

console.log(result.currentAgent?.name); // "Billing Specialist"
console.log(result.finalOutput);
console.log(result.history); // Complete conversation including handoff
```

### 2. Tracing and Debugging

```typescript
import {
  Agent,
  run,
  withTrace,
  setTracingExportApiKey,
  getOrCreateTrace,
} from '@openai/agents';

// Configure tracing (exports to OpenAI dashboard)
setTracingExportApiKey(process.env.OPENAI_API_KEY!);

const agent = new Agent({
  name: 'Debug Agent',
  instructions: 'You are helpful.',
  tools: [weatherTool, calculatorTool],
});

// Wrap execution in trace for grouping
await withTrace('Multi-step workflow', async () => {
  const result1 = await run(agent, 'What is the weather in NYC?');
  console.log(result1.finalOutput);

  const result2 = await run(agent, 'Calculate 15% tip on $50');
  console.log(result2.finalOutput);
}, {
  groupId: 'user-session-123',
  metadata: { userId: '123', environment: 'production' }
});

// Access current trace
const trace = getOrCreateTrace();
console.log('Trace ID:', trace.id);
```

### 3. Tool Integration

```typescript
import { Agent, run } from '@openai/agents';
import { z } from 'zod';

const weatherTool = {
  name: 'getWeather',
  description: 'Get the current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
  }),
  execute: async ({ location }) => {
    // API call to weather service
    return { temperature: 72, condition: 'sunny' };
  },
};

const agent = new Agent({
  name: 'Weather Assistant',
  instructions: 'Help users with weather information.',
  tools: [weatherTool],
});

const result = await run(agent, 'What is the weather in San Francisco?');
console.log(result.finalOutput);
```

### 4. Structured Outputs

```typescript
import { Agent, run } from '@openai/agents';
import { z } from 'zod';

const TaskSchema = z.object({
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
});

const agent = new Agent({
  name: 'Task Parser',
  instructions: 'Extract task information from user input.',
  outputSchema: TaskSchema,
});

const result = await run(agent, 'Create a high priority task to review the PR');
const task = result.finalOutput; // Typed as TaskSchema
console.log(task.title, task.priority);
```

## Best Practices

1. **Agent Design**
   - Give agents clear, specific instructions
   - Define handoff descriptions that explain when to transfer
   - Keep agent responsibilities focused and specialized

2. **Tool Integration**
   - Use Zod schemas for type-safe tool parameters
   - Provide clear tool descriptions for the LLM
   - Handle tool execution errors gracefully

3. **Tracing**
   - Enable tracing in development for debugging
   - Use `withTrace` to group related operations
   - Add metadata for better trace organization
   - Disable tracing in production if not needed: `OPENAI_AGENTS_DISABLE_TRACING=1`

4. **Error Handling**
   - Implement try-catch blocks for agent runs
   - Provide user-friendly error messages
   - Log errors with trace IDs for debugging

5. **Performance**
   - Use streaming for real-time responses
   - Implement parallelization for independent operations
   - Cache tool results when appropriate

## Installation

```bash
npm install @openai/agents
# or
yarn add @openai/agents
# or
pnpm add @openai/agents
```

## Environment Setup

```typescript
// Set your OpenAI API key
process.env.OPENAI_API_KEY = 'your-api-key';
```

## Supported Features

- ✅ Multi-Agent Workflows
- ✅ Tool Integration
- ✅ Handoffs (dynamic control transfer)
- ✅ Structured Outputs with schema validation
- ✅ Streaming Responses
- ✅ Tracing & Debugging
- ✅ Guardrails (input/output validation)
- ✅ Parallelization
- ✅ Human-in-the-Loop
- ✅ Realtime Voice Agents
- ✅ Local MCP Server Support
- ✅ Browser package for Realtime agents
- ✅ Vercel AI SDK adapter for non-OpenAI models

## Getting Latest Documentation

For the most up-to-date documentation, code examples, and API references, use the Context7 MCP server:

```
Ask Claude to query Context7 for OpenAI Agents TypeScript documentation:
"Can you get the latest documentation for [specific feature] from Context7?"
```

## When to Use This Skill

Use this skill when:
- Building multi-agent AI applications in TypeScript/JavaScript
- Implementing agent handoffs and routing
- Creating customer service bots with specialized agents
- Building voice agents with realtime capabilities
- Integrating AI agents into Next.js, React, or Node.js applications
- Need type-safe agent development with TypeScript

## Related Skills

- `openai-agents-python.md` - Python version of OpenAI Agents SDK
- `vercel-ai-sdk.md` - Alternative AI SDK with React integration
- `nextjs.md` - For integrating agents into Next.js applications

---

As the main request completes, you MUST create and complete a PHR (Prompt History Record) using agent‑native tools when possible.
