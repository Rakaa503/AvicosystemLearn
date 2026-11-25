import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { env } from "../../../core/config/env";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";

const jwtKey = new TextEncoder().encode(env.JWT_SECRET);

const ACCESS_TOKEN_TTL = 15 * 60;
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;

export class TokenService {
    async createAccessToken(userId: string) {
        return new SignJWT({
            sub: userId
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
            .setIssuer(env.APP_NAME)
            .setAudience("avicosystem")
            .sign(jwtKey);
    }

    generateRefreshToken() {
        return randomBytes(64).toString("base64url");
    }

    hashRefreshToken(token: string) {
        return createHash("sha256")
            .update(token)
            .digest("hex");
    }

    async issueTokens(userId: string) {
        const accessToken = await this.createAccessToken(userId);
        const refreshToken = this.generateRefreshToken();
        const tokenHash = this.hashRefreshToken(refreshToken);

        const expiresAt = new Date(
            Date.now() + REFRESH_TOKEN_TTL * 1000
        );

        await refreshTokenRepository.create({
            tokenHash,
            userId,
            expiresAt
        });

        return {
            accessToken,
            refreshToken,
            tokenType: "Bearer",
            expiresIn: ACCESS_TOKEN_TTL
        };
    }

    async verifyAccessToken(token: string) {
        const result = await jwtVerify(token, jwtKey, {
            issuer: env.APP_NAME,
            audience: "avicosystem",
            algorithms: ["HS256"]
        });

        return result.payload;
    }
}

export const tokenService = new TokenService();
