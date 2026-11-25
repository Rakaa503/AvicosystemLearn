import { buildApp } from "./app";
import { env } from "./core/config/env";

const app = await buildApp();

try {
    await app.listen({
        port: env.APP_PORT,
        host: env.APP_HOST
    });

    app.log.info(
        `${env.APP_NAME} ${env.APP_VERSION} running at http://${env.APP_HOST}:${env.APP_PORT}`
    );
} catch (error) {
    app.log.error(error);
    process.exit(1);
}
