const port = Number(Bun.env.APP_PORT ?? 3000);

const appEnv = Bun.env.APP_ENV ?? "development";

const allowedEnvironments = [
    "development",
    "test",
    "production"
] as const;

const jwtSecret = Bun.env.JWT_SECRET;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("APP_PORT must be between 1 and 65535");
}

if (!allowedEnvironments.includes(appEnv as typeof allowedEnvironments[number])) {
    throw new Error("APP_ENV must be development, test, or production");
}

if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
}

export const env = Object.freeze({
    APP_NAME: Bun.env.APP_NAME ?? "AviCore",
    APP_ENV: appEnv,
    APP_HOST: Bun.env.APP_HOST ?? "127.0.0.1",
    APP_PORT: port,
    APP_VERSION: Bun.env.APP_VERSION ?? "1.0.0",
    APP_CORS_ORIGIN: Bun.env.APP_CORS_ORIGIN ?? "http://localhost:3001",
    JWT_SECRET: jwtSecret,
    RABBITMQ_URL: Bun.env.RABBITMQ_URL ?? "amqp://localhost:5672"
});
