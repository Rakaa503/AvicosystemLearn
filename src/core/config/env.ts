const port = Number(Bun.env.APP_PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("APP_PORT must be between 1 and 65535");
}

export const env = Object.freeze({
    APP_NAME: Bun.env.APP_NAME ?? "AviCore",
    APP_ENV: Bun.env.APP_ENV ?? "development",
    APP_HOST: Bun.env.APP_HOST ?? "127.0.0.1",
    APP_PORT: port,
    APP_VERSION: Bun.env.APP_VERSION ?? "1.0.0",
    APP_CORS_ORIGIN:
        Bun.env.APP_CORS_ORIGIN ?? "http://localhost:3001"
});
