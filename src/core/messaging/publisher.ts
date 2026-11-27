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
