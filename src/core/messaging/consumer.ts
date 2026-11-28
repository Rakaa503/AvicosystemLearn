import {
    getRabbitMQChannel,
    rabbitMQExchange
} from "./rabbitmq";

const RETRY_EXCHANGE = "avicore.retry";
const DEAD_LETTER_EXCHANGE = "avicore.dead";

const RETRY_DELAYS = [
    1000,
    5000,
    15000
];

export async function consumeEvent<T>(
    queueName: string,
    routingKey: string,
    handler: (payload: T) => Promise<void>
): Promise<void> {
    const channel = getRabbitMQChannel();

    channel.prefetch(10);

    // Exchanges
    await channel.assertExchange(
        DEAD_LETTER_EXCHANGE,
        "topic",
        { durable: true }
    );

    await channel.assertExchange(
        RETRY_EXCHANGE,
        "topic",
        { durable: true }
    );

    // Dead Letter Queue
    const deadLetterQueue = `${queueName}.dead`;

    await channel.assertQueue(deadLetterQueue, {
        durable: true
    });

    await channel.bindQueue(
        deadLetterQueue,
        DEAD_LETTER_EXCHANGE,
        `${queueName}.dead`
    );

    // Main Queue
    await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": DEAD_LETTER_EXCHANGE,
            "x-dead-letter-routing-key": `${queueName}.dead`
        }
    });

    await channel.bindQueue(
        queueName,
        rabbitMQExchange,
        routingKey
    );

    // Retry Queues
    for (let i = 0; i < RETRY_DELAYS.length; i++) {
        const retryQueue = `${queueName}.retry.${i + 1}`;

        await channel.assertQueue(retryQueue, {
            durable: true,
            arguments: {
                "x-message-ttl": RETRY_DELAYS[i],
                "x-dead-letter-exchange": rabbitMQExchange,
                "x-dead-letter-routing-key": routingKey
            }
        });

        await channel.bindQueue(
            retryQueue,
            RETRY_EXCHANGE,
            retryQueue
        );
    }

    // Consumer
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

            const currentRetry = Number(
                message.properties.headers?.["x-avicore-retry"] ?? 0
            );

            if (currentRetry < RETRY_DELAYS.length) {
                const nextRetry = currentRetry + 1;

                const retryQueue =
                    `${queueName}.retry.${nextRetry}`;

                channel.publish(
                    RETRY_EXCHANGE,
                    retryQueue,
                    message.content,
                    {
                        persistent: true,
                        contentType: message.properties.contentType,
                        headers: {
                            ...message.properties.headers,
                            "x-avicore-retry": nextRetry
                        }
                    }
                );

                channel.ack(message);

                console.warn(
                    `[RabbitMQ] Message scheduled for retry ${nextRetry}/${RETRY_DELAYS.length} (${RETRY_DELAYS[nextRetry - 1]}ms)`
                );
            } else {
                channel.nack(message, false, false);

                console.error(
                    `[RabbitMQ] Retry exhausted for ${routingKey}`
                );
            }
        }
    });
}