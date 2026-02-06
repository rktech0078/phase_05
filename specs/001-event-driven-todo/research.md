# Research & Technology Decisions

**Feature**: Event-Driven Todo Chatbot Platform
**Date**: 2026-01-19
**Status**: Complete

## Overview

This document consolidates research findings and technology decisions for implementing the event-driven microservices architecture. All decisions align with the project constitution and support the performance, scalability, and reliability requirements defined in spec.md.

---

## 1. Dapr SDK Integration Patterns

### Decision
Use **@dapr/dapr** Node.js SDK with the following patterns:
- **Pub/Sub**: `DaprClient.pubsub.publish()` for event publishing, HTTP subscription endpoints for event handling
- **State Management**: `DaprClient.state.save()` and `DaprClient.state.get()` for distributed state
- **Service Invocation**: `DaprClient.invoker.invoke()` for synchronous service-to-service calls (rare)
- **Bindings**: Declarative YAML subscriptions for cron triggers

### Rationale
- Official Dapr SDK with TypeScript support and active maintenance
- HTTP-based subscriptions are simpler than gRPC for Node.js services
- Declarative subscriptions (YAML) separate concerns from application code
- Built-in retry, circuit breaker, and timeout policies via Dapr resiliency

### Implementation Recommendations

**Service Initialization**:
```typescript
import { DaprClient, DaprServer } from '@dapr/dapr';

const daprHost = process.env.DAPR_HOST || 'localhost';
const daprPort = process.env.DAPR_HTTP_PORT || '3500';
const appPort = process.env.APP_PORT || '3000';

const client = new DaprClient({ daprHost, daprPort });
const server = new DaprServer({ serverHost: '0.0.0.0', serverPort: appPort, clientOptions: { daprHost, daprPort } });
```

**Event Publishing**:
```typescript
await client.pubsub.publish('pubsub-kafka', 'task-events', {
  specversion: '1.0',
  type: 'com.todo.task.created',
  source: 'task-service',
  id: uuidv4(),
  time: new Date().toISOString(),
  datacontenttype: 'application/json',
  data: { taskId, userId, title, ... }
});
```

**Event Subscription** (HTTP endpoint):
```typescript
server.pubsub.subscribe('pubsub-kafka', 'task-events', async (data) => {
  const event = data as CloudEvent;
  if (event.type === 'com.todo.task.created') {
    await handleTaskCreated(event.data);
  }
});
```

**Error Handling**:
- Wrap all Dapr calls in try-catch blocks
- Log errors with correlation IDs
- Return appropriate HTTP status codes (200 = success, 500 = retry)
- Use Dapr resiliency policies for automatic retries

### Alternatives Considered
- **gRPC subscriptions**: More performant but complex setup in Node.js
- **Direct Kafka clients**: Violates constitution (Dapr-first mandate)
- **Custom event bus**: Reinventing the wheel, no operational benefits

---

## 2. Kafka Topic Design

### Decision
Use **3 Kafka topics** with CloudEvents format:
1. **task-events**: All task lifecycle events (created, updated, completed, deleted)
2. **reminders**: Reminder scheduling and delivery events
3. **task-updates**: Real-time sync events for WebSocket broadcast

**Partition Strategy**: Partition by `userId` to ensure ordering per user

**Event Schema**: CloudEvents 1.0 specification

### Rationale
- CloudEvents provides standardized event format with metadata (id, source, type, time)
- Partitioning by userId ensures all events for a user are ordered (critical for audit trail)
- 3 topics balance granularity (separate concerns) with operational simplicity (not too many topics)
- CloudEvents supports schema evolution via versioned event types

### Event Type Naming Convention
Format: `com.todo.<aggregate>.<action>`

Examples:
- `com.todo.task.created`
- `com.todo.task.updated`
- `com.todo.task.completed`
- `com.todo.task.deleted`
- `com.todo.reminder.scheduled`
- `com.todo.reminder.triggered`
- `com.todo.reminder.delivered`
- `com.todo.reminder.failed`
- `com.todo.recurring.generated`

### Partition Key Strategy
- **task-events**: `userId` (ensures ordering per user)
- **reminders**: `userId` (ensures ordering per user)
- **task-updates**: `userId` (ensures ordering per user)

### Schema Evolution
- Add new fields to event data without breaking consumers (backward compatible)
- Version event types when breaking changes needed: `com.todo.task.created.v2`
- Consumers ignore unknown fields (forward compatible)

### Alternatives Considered
- **1 topic for all events**: Harder to manage, consumers receive irrelevant events
- **Topic per event type**: Too many topics (operational overhead)
- **Partition by taskId**: Breaks ordering for user's task list operations
- **Avro/Protobuf schemas**: Adds complexity, CloudEvents JSON is sufficient

---

## 3. WebSocket Scalability

### Decision
Use **Redis Pub/Sub for WebSocket broadcast** with sticky sessions disabled

**Architecture**:
1. Sync Service subscribes to `task-updates` Kafka topic
2. On receiving event, publishes to Redis channel: `user:{userId}:updates`
3. All Sync Service replicas subscribe to Redis channels for connected users
4. Each replica broadcasts to its local WebSocket connections

### Rationale
- Redis pub/sub enables horizontal scaling without sticky sessions
- Each replica handles subset of WebSocket connections
- Events are broadcast to all replicas, each replica forwards to its connections
- No shared state required between replicas (stateless design)
- Redis is already required for Dapr state store, no additional infrastructure

### Implementation Recommendations

**Connection Management**:
```typescript
// Map of userId -> Set of WebSocket connections
const connections = new Map<string, Set<WebSocket>>();

// Subscribe to Redis channel when user connects
wss.on('connection', (ws, req) => {
  const userId = authenticateWebSocket(req);
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
    redisSubscriber.subscribe(`user:${userId}:updates`);
  }
  connections.get(userId)!.add(ws);
});

// Unsubscribe when last connection for user closes
ws.on('close', () => {
  const userConnections = connections.get(userId);
  userConnections.delete(ws);
  if (userConnections.size === 0) {
    redisSubscriber.unsubscribe(`user:${userId}:updates`);
    connections.delete(userId);
  }
});
```

**Event Broadcasting**:
```typescript
// Kafka event handler
async function handleTaskUpdate(event: CloudEvent) {
  const { userId, taskId, ...data } = event.data;
  // Publish to Redis for all replicas
  await redisPublisher.publish(`user:${userId}:updates`, JSON.stringify({ taskId, ...data }));
}

// Redis subscriber
redisSubscriber.on('message', (channel, message) => {
  const userId = channel.split(':')[1];
  const userConnections = connections.get(userId);
  if (userConnections) {
    const data = JSON.parse(message);
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }
});
```

**Graceful Shutdown**:
- On SIGTERM, stop accepting new connections
- Send close frame to all connections with 1000 status (normal closure)
- Wait up to 30 seconds for connections to close
- Force close remaining connections

### Alternatives Considered
- **Sticky sessions**: Requires session affinity, complicates load balancing, not cloud-native
- **Shared state in database**: Too slow for real-time updates
- **Server-Sent Events (SSE)**: Unidirectional, WebSocket provides bidirectional capability for future features
- **Socket.io**: Adds abstraction layer, native WebSocket is sufficient

---

## 4. Dapr State Store Selection

### Decision
Use **Redis** as Dapr state store

### Rationale
- **Performance**: In-memory storage, <1ms latency for get/set operations
- **Simplicity**: Single Redis instance serves both state store and pub/sub needs
- **Consistency**: Strong consistency for single-key operations (sufficient for task metadata caching)
- **Operational**: Managed Redis available on most cloud providers (Oracle OCI, AWS, Azure)
- **Dapr Support**: First-class Dapr component with extensive documentation

### Use Cases for State Store
- **Task metadata caching**: Reduce database load for frequently accessed tasks
- **User session data**: Store temporary user preferences, filters
- **Rate limiting**: Track API request counts per user
- **Idempotency keys**: Prevent duplicate event processing

### Configuration
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
  version: v1
  metadata:
  - name: redisHost
    value: redis-master:6379
  - name: redisPassword
    secretKeyRef:
      name: redis-secret
      key: password
  - name: enableTLS
    value: "true"
  - name: maxRetries
    value: "3"
  - name: maxRetryBackoff
    value: "2s"
```

### Alternatives Considered
- **PostgreSQL**: Stronger consistency but 10-100x slower than Redis, overkill for caching
- **etcd**: Designed for configuration, not application state, limited Dapr support
- **Cosmos DB / DynamoDB**: Cloud-specific, violates cloud-agnostic requirement
- **In-memory (no state store)**: Loses state on pod restart, not production-ready

---

## 5. Recurring Task Scheduling

### Decision
Use **Dapr Cron Binding** for periodic reminder checks + **Event-Driven** for recurring task generation

**Architecture**:
1. **Reminder Scheduling**: Dapr cron binding triggers Notification Service every 1 minute to check for due reminders
2. **Recurring Task Generation**: Event-driven via `task-events` topic; Recurring Service listens for `task.completed` events with recurrence pattern

### Rationale
- **Cron for reminders**: Periodic checks are necessary (can't predict when reminders are due)
- **Events for recurring tasks**: Triggered by task completion, no polling needed
- **Dapr cron binding**: Declarative, no external cron service, scales with replicas (only one replica processes each trigger)
- **Separation of concerns**: Reminder scheduling vs recurring task generation are different workflows

### Implementation Recommendations

**Dapr Cron Binding** (Notification Service):
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: reminder-cron
spec:
  type: bindings.cron
  version: v1
  metadata:
  - name: schedule
    value: "@every 1m"  # Check every minute
  - name: direction
    value: "input"
```

**Cron Handler** (Notification Service):
```typescript
server.binding.receive('reminder-cron', async () => {
  const now = new Date();
  const dueReminders = await db.select()
    .from(reminders)
    .where(and(
      lte(reminders.reminderTime, now),
      eq(reminders.deliveryStatus, 'pending')
    ))
    .limit(100);  // Process in batches

  for (const reminder of dueReminders) {
    await sendNotification(reminder);
    await client.pubsub.publish('pubsub-kafka', 'reminders', {
      type: 'com.todo.reminder.triggered',
      data: { reminderId: reminder.id, taskId: reminder.taskId, userId: reminder.userId }
    });
  }
});
```

**Event-Driven Recurring Task Generation** (Recurring Service):
```typescript
server.pubsub.subscribe('pubsub-kafka', 'task-events', async (data) => {
  const event = data as CloudEvent;
  if (event.type === 'com.todo.task.completed') {
    const { taskId, userId, recurrencePattern } = event.data;
    if (recurrencePattern && recurrencePattern !== 'none') {
      const nextTask = await generateNextInstance(taskId, recurrencePattern);
      await client.pubsub.publish('pubsub-kafka', 'task-events', {
        type: 'com.todo.recurring.generated',
        data: nextTask
      });
    }
  }
});
```

### Alternatives Considered
- **Kubernetes CronJob**: Separate pods for each cron job, more operational overhead
- **Custom scheduler**: Reinventing the wheel, Dapr cron binding is sufficient
- **Polling for recurring tasks**: Inefficient, event-driven is more responsive
- **Quartz/Bull queue**: Adds dependency, Dapr cron binding is simpler

---

## 6. Observability Stack

### Decision
Use **Prometheus + Grafana + Jaeger** with Dapr integration

**Components**:
1. **Metrics**: Prometheus (scrapes /metrics endpoints), Grafana (dashboards)
2. **Tracing**: Jaeger (collects Dapr traces), Grafana (trace visualization)
3. **Logging**: Structured JSON logs to stdout, collected by Kubernetes (Fluentd/Loki optional)

### Rationale
- **Prometheus**: Industry standard for Kubernetes metrics, native Dapr support
- **Grafana**: Unified dashboards for metrics and traces
- **Jaeger**: OpenTelemetry-compatible, Dapr exports traces automatically
- **Structured logging**: JSON format enables log aggregation and querying
- **Cloud-agnostic**: All components run in Kubernetes, no cloud-specific services

### Metrics to Track

**Application Metrics** (via prom-client):
- `todo_tasks_created_total` (counter)
- `todo_tasks_completed_total` (counter)
- `todo_tasks_deleted_total` (counter)
- `todo_reminders_sent_total` (counter)
- `todo_reminders_failed_total` (counter)
- `todo_websocket_connections_active` (gauge)
- `todo_api_request_duration_seconds` (histogram)
- `todo_event_processing_duration_seconds` (histogram)

**Dapr Metrics** (automatic):
- `dapr_http_server_request_count`
- `dapr_http_server_request_duration_ms`
- `dapr_component_pubsub_ingress_count`
- `dapr_component_pubsub_egress_count`

### Implementation Recommendations

**Prometheus Configuration**:
```yaml
scrape_configs:
  - job_name: 'dapr-services'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_dapr_io_enabled]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_dapr_io_metrics_port]
        action: replace
        target_label: __address__
        regex: ([^:]+)(?::\d+)?
        replacement: $1:9090
```

**Jaeger Configuration** (Dapr):
```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: tracing
spec:
  tracing:
    samplingRate: "1"  # 100% sampling for development, reduce in production
    zipkin:
      endpointAddress: "http://jaeger-collector:9411/api/v2/spans"
```

**Structured Logging** (winston):
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'task-service' },
  transports: [new winston.transports.Console()]
});

// Usage with correlation ID
logger.info('Task created', {
  correlationId: req.headers['x-correlation-id'],
  userId,
  taskId
});
```

### Alternatives Considered
- **ELK Stack**: More complex, Prometheus + Grafana is sufficient
- **Datadog / New Relic**: Cloud-specific, expensive, violates cloud-agnostic requirement
- **OpenTelemetry Collector**: Adds complexity, Dapr's built-in tracing is sufficient
- **CloudWatch / Azure Monitor**: Cloud-specific, not portable

---

## 7. Database Schema Migration Strategy

### Decision
Use **Drizzle ORM migrations** with **additive-only changes** for zero-downtime

**Migration Strategy**:
1. Add new columns with default values (nullable or with defaults)
2. Deploy new service version (reads new columns, writes to both old and new)
3. Backfill data if needed (background job)
4. Remove old columns in subsequent migration (after all services updated)

### Rationale
- Drizzle ORM has built-in migration support (`drizzle-kit generate`, `drizzle-kit push`)
- Additive-only changes ensure backward compatibility during rolling updates
- Zero-downtime migrations critical for 99.9% uptime requirement
- Rollback-friendly: can revert service deployment without schema rollback

### Migration Scripts

**001_add_task_fields.sql**:
```sql
-- Add new columns with defaults
ALTER TABLE tasks
  ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ADD COLUMN tags TEXT[] DEFAULT '{}',
  ADD COLUMN due_date TIMESTAMP,
  ADD COLUMN recurrence_pattern TEXT DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly'));

-- Create index for due date queries
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Create index for priority queries
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

**002_create_reminders.sql**:
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_due ON reminders(reminder_time, delivery_status) WHERE delivery_status = 'pending';
CREATE INDEX idx_reminders_user ON reminders(user_id);
```

**003_create_audit_logs.sql**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'completed', 'deleted')),
  changes JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  correlation_id TEXT
);

CREATE INDEX idx_audit_logs_task ON audit_logs(task_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

### Drizzle ORM Schema Updates

**schemas/index.ts**:
```typescript
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  tags: text('tags').array().default([]).notNull(),
  dueDate: timestamp('due_date'),
  recurrencePattern: text('recurrence_pattern', { enum: ['none', 'daily', 'weekly', 'monthly'] }).default('none').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

### Rollback Procedures
1. Revert service deployment to previous version
2. If data corruption, restore from backup (Neon PostgreSQL has point-in-time recovery)
3. Do NOT rollback schema changes (forward-only migrations)
4. If schema rollback absolutely necessary, create new migration to remove columns

### Alternatives Considered
- **Flyway / Liquibase**: Java-based, overkill for Node.js project
- **Knex migrations**: Drizzle ORM is already in use, no need for additional tool
- **Manual SQL scripts**: Error-prone, Drizzle ORM provides type safety
- **Blue-green database**: Complex, not necessary for additive-only changes

---

## 8. Oracle OKE Deployment

### Decision
Use **Oracle Kubernetes Engine (OKE) Always Free tier** with the following configuration:
- **Cluster**: 1 node pool with 2 ARM-based Ampere A1 instances (4 OCPU, 24 GB RAM total)
- **Load Balancer**: OCI Load Balancer (Always Free: 1 instance, 10 Mbps)
- **Storage**: OCI Block Volume (Always Free: 200 GB total)
- **Networking**: VCN with public subnet for load balancer, private subnet for nodes

### Rationale
- **Cost**: Always Free tier provides sufficient resources for hackathon demo
- **ARM Architecture**: Ampere A1 instances are powerful and free (4 OCPU = 4 cores)
- **Kubernetes Native**: OKE is managed Kubernetes, same deployment as Minikube
- **Dapr Compatible**: Dapr runs on ARM architecture without issues

### Resource Allocation

**Per Service** (6 services total):
- **Requests**: 200m CPU, 256Mi RAM
- **Limits**: 500m CPU, 512Mi RAM
- **Total**: ~1.2 CPU, ~1.5 GB RAM for all services
- **Remaining**: ~2.8 CPU, ~22.5 GB RAM for Redis, Dapr sidecars, system pods

**Helm Values** (values-oke.yaml):
```yaml
replicaCount: 1  # Single replica per service (Always Free limitation)

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

service:
  type: LoadBalancer  # OCI Load Balancer
  annotations:
    service.beta.kubernetes.io/oci-load-balancer-shape: "flexible"
    service.beta.kubernetes.io/oci-load-balancer-shape-flex-min: "10"
    service.beta.kubernetes.io/oci-load-balancer-shape-flex-max: "10"

persistence:
  enabled: true
  storageClass: "oci-bv"  # OCI Block Volume
  size: 10Gi

redis:
  enabled: true
  architecture: standalone
  master:
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 200m
        memory: 256Mi
```

### Deployment Steps

1. **Create OKE Cluster** (via OCI Console or Terraform):
   - Region: Choose closest region
   - Kubernetes Version: 1.28+
   - Node Pool: 2x Ampere A1 (VM.Standard.A1.Flex, 2 OCPU, 12 GB RAM each)
   - VCN: Auto-create with public and private subnets

2. **Install Dapr**:
   ```bash
   dapr init --kubernetes --wait
   ```

3. **Deploy Redis**:
   ```bash
   helm install redis bitnami/redis -f values-redis-oke.yaml
   ```

4. **Deploy Application**:
   ```bash
   helm install todo-platform ./infrastructure/helm/todo-platform -f values-oke.yaml
   ```

5. **Configure DNS** (optional):
   - Get LoadBalancer external IP: `kubectl get svc frontend`
   - Create A record pointing to external IP

### Limitations & Workarounds

**Limitations**:
- **Single replica**: Always Free tier has limited resources, can't run multiple replicas
- **No autoscaling**: HPA requires metrics server and sufficient resources
- **10 Mbps bandwidth**: Load balancer bandwidth limited to 10 Mbps

**Workarounds**:
- **Single replica**: Acceptable for demo, production would use paid tier with multiple replicas
- **No autoscaling**: Manual scaling via `kubectl scale` if needed
- **Bandwidth**: Sufficient for hackathon demo (1000 concurrent users unlikely)

### Monitoring on OKE

**OCI Native Monitoring**:
- OCI Monitoring: Cluster metrics (CPU, memory, network)
- OCI Logging: Container logs (optional, not in Always Free)

**In-Cluster Monitoring**:
- Deploy Prometheus + Grafana in cluster (uses cluster resources)
- Jaeger for distributed tracing

### Alternatives Considered
- **AWS EKS Free Tier**: Only control plane free, worker nodes cost money
- **Azure AKS Free Tier**: Same as EKS, worker nodes cost money
- **Google GKE Free Tier**: $300 credit, not truly free
- **Minikube on VM**: Not production-grade, no load balancer

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Dapr SDK** | @dapr/dapr with HTTP subscriptions | Official SDK, TypeScript support, simple setup |
| **Event Format** | CloudEvents 1.0 | Standardized, schema evolution support |
| **Topics** | 3 topics (task-events, reminders, task-updates) | Balance granularity and simplicity |
| **Partitioning** | By userId | Ensures ordering per user |
| **WebSocket Scaling** | Redis pub/sub for broadcast | Horizontal scaling without sticky sessions |
| **State Store** | Redis | Performance, simplicity, dual-use (pub/sub) |
| **Reminder Scheduling** | Dapr cron binding (1 min interval) | Declarative, scales with replicas |
| **Recurring Tasks** | Event-driven (task.completed events) | Responsive, no polling |
| **Metrics** | Prometheus + Grafana | Industry standard, Dapr integration |
| **Tracing** | Jaeger | OpenTelemetry-compatible, Dapr support |
| **Logging** | Structured JSON (winston) | Aggregation-friendly, queryable |
| **Migrations** | Drizzle ORM, additive-only | Zero-downtime, rollback-friendly |
| **Cloud Platform** | Oracle OKE Always Free | Cost-effective, ARM-based, managed K8s |

---

## Next Steps

1. ✅ Research complete - All technology decisions documented
2. ⏭️ Create data-model.md with entity definitions and relationships
3. ⏭️ Create contracts/ directory with event schemas and API specifications
4. ⏭️ Create quickstart.md with local deployment guide
5. ⏭️ Update CLAUDE.md with new technologies and architecture patterns
6. ⏭️ Generate tasks.md via `/sp.tasks` command
7. ⏭️ Implement via `/sp.implement` command
