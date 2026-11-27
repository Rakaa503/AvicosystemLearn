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
