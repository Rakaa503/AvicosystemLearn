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
