# AviCore-New — Continue Development From Current State

Yo, I'm building **AviCore-New**, the backend foundation for my AviCosystem. I want you to continue from my actual implementation, not rebuild everything from scratch.

I'm developing this step by step, focusing on backend architecture, modularity, infrastructure, and reliability. Keep things practical, don't overengineer, and don't make unnecessary changes to code that already works.

## Environment

- Project directory: `C:\Users\ASUS\Avicore-New`
- Windows 11
- PowerShell
- Bun 1.3.14
- TypeScript
- Fastify 5
- PostgreSQL 16
- Prisma 7.10
- RabbitMQ 4.4.1

---

## 1. Current Architecture

```text
src/
├── core/
│   ├── config/
│   │   └── env.ts
│   ├── database/
│   │   ├── prisma.ts
│   │   └── database.plugin.ts
│   ├── errors/
│   │   ├── app-error.ts
│   │   ├── error-codes.ts
│   │   └── error-handler.ts
│   ├── http/
│   │   └── api-response.ts
│   ├── logger/
│   │   └── index.ts
│   └── messaging/
│       ├── rabbitmq.ts
│       ├── messaging.plugin.ts
│       ├── publisher.ts
│       └── consumer.ts
├── modules/
│   ├── health/
│   │   └── health.module.ts
│   └── identity/
│       ├── identity.module.ts
│       ├── repositories/
│       │   ├── user.repository.ts
│       │   └── refresh-token.repository.ts
│       ├── services/
│       │   ├── identity.service.ts
│       │   └── token.service.ts
│       └── middleware/
│           ├── auth.middleware.ts
│           └── authorization.middleware.ts
├── routes/
│   └── index.ts
├── app.ts
└── server.ts
```

---

## 2. Identity System — Already Implemented

Implemented:
- Register.
- Login.
- Refresh token.
- Logout.
- JWT authentication.
- Refresh token rotation.
- Token hashing.
- Authentication middleware.
- RBAC.
- Roles: `USER`, `ADMIN`, `SUPER_ADMIN`.
- `/identity/me`.
- `/identity/admin`.
- `/identity/super-admin`.

The identity system uses a repository and service architecture. Don't rewrite it.

---

## 3. RabbitMQ Integration — Already Implemented

RabbitMQ 4.4.1 is installed locally and running as a Windows service.

Verified:
- RabbitMQ service is running.
- Port 5672 is reachable.
- Connection from AviCore works.
- Topic exchange is configured.
- Publisher works.
- Consumer works.
- Durable queue.
- Routing key.
- Message acknowledgment.
- Fastify plugin integration.
- Graceful shutdown.

### RabbitMQ structure

```text
src/core/messaging/
├── rabbitmq.ts
├── messaging.plugin.ts
├── publisher.ts
└── consumer.ts
```

### `rabbitmq.ts`

Current implementation:

```ts
import amqp from "amqplib";
import type { Channel, ChannelModel } from "amqplib";
import { env } from "../config/env";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const EXCHANGE_NAME = "avicore.events";

export async function connectRabbitMQ(): Promise<Channel> {
    if (channel) return channel;

    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", {
        durable: true
    });

    return channel;
}

export function getRabbitMQChannel(): Channel {
    if (!channel) {
        throw new Error("RabbitMQ channel is not initialized");
    }

    return channel;
}

export async function closeRabbitMQ(): Promise<void> {
    channel = null;

    if (connection) {
        await connection.close();
        connection = null;
    }
}

export const rabbitMQExchange = EXCHANGE_NAME;
```

### `messaging.plugin.ts`

```ts
import type { FastifyInstance } from "fastify";
import {
    connectRabbitMQ,
    closeRabbitMQ
} from "./rabbitmq";

export async function messagingPlugin(app: FastifyInstance) {
    try {
        await connectRabbitMQ();

        app.log.info("RabbitMQ connection established");

        app.addHook("onClose", async () => {
            await closeRabbitMQ();
            app.log.info("RabbitMQ connection closed");
        });
    } catch (error) {
        app.log.error(error, "RabbitMQ connection failed");
        throw error;
    }
}
```

### `publisher.ts`

```ts
import {
    getRabbitMQChannel,
    rabbitMQExchange
} from "./rabbitmq";

export async function publishEvent<T>(
    routingKey: string,
    payload: T
): Promise<boolean> {
    const channel = getRabbitMQChannel();

    return channel.publish(
        rabbitMQExchange,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
            persistent: true,
            contentType: "application/json"
        }
    );
}
```

### `consumer.ts`

Latest implementation:

```ts
import {
    getRabbitMQChannel,
    rabbitMQExchange
} from "./rabbitmq";

export async function consumeEvent<T>(
    queueName: string,
    routingKey: string,
    handler: (payload: T) => Promise<void>
): Promise<void> {
    const channel = getRabbitMQChannel();

    channel.prefetch(10);

    const deadLetterExchange = "avicore.dead";

    await channel.assertExchange(deadLetterExchange, "topic", {
        durable: true
    });

    const deadLetterQueue = `${queueName}.dead`;

    await channel.assertQueue(deadLetterQueue, {
        durable: true
    });

    await channel.bindQueue(
        deadLetterQueue,
        deadLetterExchange,
        `${queueName}.dead`
    );

    await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": deadLetterExchange,
            "x-dead-letter-routing-key": `${queueName}.dead`
        }
    });

    await channel.bindQueue(
        queueName,
        rabbitMQExchange,
        routingKey
    );

    await channel.consume(queueName, async (message) => {
        if (!message) return;

        try {
            const payload = JSON.parse(
                message.content.toString()
            ) as T;

            await handler(payload);

            channel.ack(message);
        } catch (error) {
            console.error(
                `[RabbitMQ] Failed processing ${routingKey}`,
                error
            );

            channel.nack(message, false, false);
        }
    });
}
```

This is the latest consumer implementation, but its DLQ behavior still needs to be verified. Don't blindly assume the code is correct. Check the implementation and test it before building more on top of it.

---

## 4. RabbitMQ Integration Test

The integration test previously used this implementation:

```ts
import { describe, test, expect } from "bun:test";
import {
    connectRabbitMQ,
    getRabbitMQChannel
} from "../src/core/messaging/rabbitmq";
import { publishEvent } from "../src/core/messaging/publisher";
import { consumeEvent } from "../src/core/messaging/consumer";

describe("RabbitMQ integration", () => {
    test("publishes and consumes an event", async () => {
        await connectRabbitMQ();

        const queueName = "avicore.integration-test";

        let resolveReceived!: (payload: { message: string }) => void;

        const received = new Promise<{ message: string }>((resolve) => {
            resolveReceived = resolve;
        });

        await consumeEvent<{ message: string }>(
            queueName,
            "test.integration",
            async (payload) => {
                resolveReceived(payload);
            }
        );

        await publishEvent("test.integration", {
            message: "RabbitMQ works"
        });

        const payload = await received;

        expect(payload.message).toBe("RabbitMQ works");

        await getRabbitMQChannel().deleteQueue(queueName);
    });
});
```

Test results previously confirmed:

```text
RabbitMQ integration test: PASS
Foundation tests: PASS

3 pass
0 fail
4 expect() calls
```

The latest DLQ changes haven't yet been confirmed by a new test run.

---

## 5. Fastify Integration

RabbitMQ is registered in the application through:

```ts
await app.register(databasePlugin);
await app.register(messagingPlugin);
await app.register(registerRoutes);
```

The messaging plugin manages the RabbitMQ lifecycle with Fastify.

---

## 6. Current Development Focus

I want to continue working on RabbitMQ reliability before connecting it to other modules.

Focus on:
- Proper DLQ verification.
- Retry handling.
- Retry limits.
- Backoff.
- Message durability.
- Publisher reliability.
- Consumer reliability.
- Connection resilience.
- Messaging observability.

Don't immediately connect RabbitMQ to Identity or other AviCosystem modules. Make sure the core messaging infrastructure is solid first.

---

## 7. Development Rules

- Only work inside `C:\Users\ASUS\Avicore-New`.
- Never touch `C:\Users\ASUS\Avicore` or `C:\Users\ASUS\avicore-v2`.
- Use PowerShell.
- Never expose `.env`, JWT secrets, credentials, access tokens, or refresh tokens.
- Don't unnecessarily rewrite existing code.
- Don't integrate AVSS Lite unless I explicitly ask.
- Don't invent test results.
- Request actual file contents when needed.
- Keep explanations short and practical.
- Provide complete file implementations when changes are needed.
- Give exact PowerShell commands.
- Verify changes with typecheck and tests.
- No generic AI-style filler.

---

## 8. Final Security Phase

The security engineering phase is intentionally planned for the end of development:

- OWASP ZAP.
- MITRE ATT&CK.
- NIST SSDF.

Don't implement these yet. I want to finish the core backend, modules, and infrastructure first.

---

Pick up from the current RabbitMQ implementation. Start by verifying the latest code and test results, then continue incrementally with actual implementation and testing.
TAMBAHIN DISINI BROK MAKSUD NYA
