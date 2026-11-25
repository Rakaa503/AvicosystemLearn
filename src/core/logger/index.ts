import type { FastifyBaseLogger } from "fastify";

export function createModuleLogger(
    logger: FastifyBaseLogger,
    moduleName: string
) {
    return logger.child({
        module: moduleName
    });
}
