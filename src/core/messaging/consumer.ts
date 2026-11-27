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

    await channel.assertQueue(queueName, {
        durable: true
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
