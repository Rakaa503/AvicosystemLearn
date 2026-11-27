import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import { env } from "./core/config/env";
import { registerRoutes } from "./routes";
import { databasePlugin } from "./core/database/database.plugin";
import { registerErrorHandler } from "./core/errors/error-handler";
import { messagingPlugin } from "./core/messaging/messaging.plugin";

export async function buildApp() {
    const app = Fastify({
        logger: {
            level: env.APP_ENV === "production" ? "info" : "debug",
            redact: [
                "req.headers.authorization",
                "req.headers.cookie",
                "req.body.password",
                "req.body.refreshToken"
            ]
        },
        trustProxy: false
    }).withTypeProvider<TypeBoxTypeProvider>();

    await app.register(cors, {
        origin: env.APP_CORS_ORIGIN,
        credentials: true
    });

    await app.register(helmet, {
        contentSecurityPolicy: false
    });

    await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute"
    });

    await app.register(swagger, {
        openapi: {
            info: {
                title: "AviCore API",
                description: "Central backend foundation for AviCosystem",
                version: env.APP_VERSION
            },
            tags: [
                { name: "System", description: "System endpoints" },
                { name: "Identity", description: "Identity management" }
            ]
        }
    });

    await app.register(swaggerUI, {
        routePrefix: "/docs"
    });

    registerErrorHandler(app);


    await app.register(databasePlugin);
    await app.register(messagingPlugin);
    await app.register(registerRoutes);

    return app;
}




