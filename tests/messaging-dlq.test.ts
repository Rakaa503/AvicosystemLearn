import { describe, test, expect } from "bun:test";
import {
    connectRabbitMQ,
    getRabbitMQChannel,
    closeRabbitMQ
} from "../src/core/messaging/rabbitmq";
import { publishEvent } from "../src/core/messaging/publisher";
import { consumeEvent } from "../src/core/messaging/consumer";

describe("RabbitMQ DLQ", () => {
    test("routes failed messages into dead-letter queue", async () => {
        await connectRabbitMQ();

        const channel = getRabbitMQChannel();

        const queueName = "avicore.dlq-test";
        const deadQueue = `${queueName}.dead`;
        const routingKey = "test.dlq";

        await channel.assertQueue(deadQueue, { durable: true });

        let resolveDeadLetter!: (payload: unknown) => void;

        const deadLetterReceived = new Promise<unknown>((resolve) => {
            resolveDeadLetter = resolve;
        });

        const dlqConsumer = await channel.consume(
            deadQueue,
            (message) => {
                if (!message) return;

                const payload = JSON.parse(
                    message.content.toString()
                );

                channel.ack(message);
                resolveDeadLetter(payload);
            }
        );

        await consumeEvent<{ fail: boolean }>(
            queueName,
            routingKey,
            async () => {
                throw new Error("Intentional test failure");
            }
        );

        await publishEvent(routingKey, { fail: true });

        const payload = await Promise.race([
            deadLetterReceived,
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("DLQ message timeout")),
                    5000
                )
            )
        ]);

        expect(payload).toEqual({ fail: true });

        await channel.cancel(dlqConsumer.consumerTag);
        await channel.deleteQueue(queueName);
        await channel.deleteQueue(deadQueue);

        await closeRabbitMQ();
    });
});
