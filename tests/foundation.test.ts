import { describe, expect, it } from "bun:test";
import { buildApp } from "../src/app";

describe("AviCore Foundation", () => {
    it("returns API information", async () => {
        const app = await buildApp();

        const response = await app.inject({
            method: "GET",
            url: "/"
        });

        // Root route will be added in the next iteration.
        expect(response.statusCode).toBe(404);

        await app.close();
    });

    it("returns healthy status", async () => {
        const app = await buildApp();

        const response = await app.inject({
            method: "GET",
            url: "/api/v1/health"
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data.status).toBe("healthy");

        await app.close();
    });
});
