import type { FastifyInstance } from "fastify";
import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";
import { env } from "../config/env";

export function registerErrorHandler(app: FastifyInstance) {
    app.setNotFoundHandler(async (_request, reply) => {
        return reply.code(404).send({
            success: false,
            error: {
                code: ERROR_CODES.ROUTE_NOT_FOUND,
                message: "Route not found"
            }
        });
    });

    app.setErrorHandler((error: unknown, request, reply) => {
        request.log.error({ err: error }, "Request failed");

        if (error instanceof AppError) {
            return reply.code(error.statusCode).send({
                success: false,
                error: {
                    code: error.code,
                    message: error.expose
                        ? error.message
                        : "Internal server error"
                }
            });
        }

        if (
            typeof error === "object" &&
            error !== null &&
            "validation" in error
        ) {
            return reply.code(400).send({
                success: false,
                error: {
                    code: ERROR_CODES.VALIDATION_ERROR,
                    message: "Request validation failed"
                }
            });
        }

        return reply.code(500).send({
            success: false,
            error: {
                code: ERROR_CODES.INTERNAL_SERVER_ERROR,
                message:
                    env.APP_ENV === "development" && error instanceof Error
                        ? error.message
                        : "Internal server error"
            }
        });
    });
}
