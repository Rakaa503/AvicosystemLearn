import { describe, test, expect } from "bun:test";
import {
    connectRabbitMQ,
    getRabbitMQChannel,
    closeRabbitMQ
} from "../src/core/messaging/rabbitmq";
import { publishEvent } from "../src/core/messaging/publisher";
import { consumeEvent } from "../src/core/messaging/consumer";

describe("RabbitMQ Retry + Backoff", () => {
    test(
        "retries failed messages and succeeds on fourth attempt",
        async () => {
            await connectRabbitMQ();

            const channel = getRabbitMQChannel();

            const queueName = "avicore.retry-test";
            const routingKey = "test.retry";

            let attempts = 0;

            let resolveSuccess!: () => void;

            const success = new Promise<void>((resolve) => {
                resolveSuccess = resolve;
            });

            const startedAt = Date.now();

            try {
                await consumeEvent<{ message: string }>(
                    queueName,
                    routingKey,
                    async (payload) => {
                        attempts++;

                        console.log(
                            `[Retry Test] Attempt ${attempts}: ${payload.message}`
                        );

                        if (attempts < 4) {
                            throw new Error(
                                `Intentional failure on attempt ${attempts}`
                            );
                        }

                        resolveSuccess();
                    }
                );

                await publishEvent(routingKey, {
                    message: "Retry test"
                });

                await Promise.race([
                    success,
                    new Promise<void>((_, reject) => {
                        setTimeout(
                            () => reject(
                                new Error("Retry test timeout")
                            ),
                            30000
                        );
                    })
                ]);

                const elapsed = Date.now() - startedAt;

                expect(attempts).toBe(4);
                expect(elapsed).toBeGreaterThanOrEqual(20000);

                console.log(
                    `[Retry Test] Completed after ${elapsed}ms`
                );
            } finally {
                for (const queue of [
                    queueName,
                    `${queueName}.dead`,
                    `${queueName}.retry.1`,
                    `${queueName}.retry.2`,
                    `${queueName}.retry.3`
                ]) {
                    await channel.deleteQueue(queue);
                }

                await closeRabbitMQ();
            }
        },
        40000
    );
});