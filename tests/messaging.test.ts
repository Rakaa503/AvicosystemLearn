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
