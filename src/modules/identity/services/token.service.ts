import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { env } from "../../../core/config/env";
import { AppError } from "../../../core/errors/app-error";
import { ERROR_CODES } from "../../../core/errors/error-codes";
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

    async refreshAccessToken(rawToken: string) {
        if (!rawToken || typeof rawToken !== "string") {
            throw new AppError(
                "Invalid refresh token",
                ERROR_CODES.UNAUTHORIZED,
                401
            );
        }

        const oldTokenHash = this.hashRefreshToken(rawToken);
        const storedToken =
            await refreshTokenRepository.findByHash(oldTokenHash);

        if (!storedToken) {
            throw new AppError(
                "Invalid refresh token",
                ERROR_CODES.UNAUTHORIZED,
                401
            );
        }

        if (storedToken.revokedAt) {
            await refreshTokenRepository.revokeAllForUser(
                storedToken.userId
            );

            throw new AppError(
                "Refresh token reuse detected",
                ERROR_CODES.UNAUTHORIZED,
                401
            );
        }

        if (storedToken.expiresAt <= new Date()) {
            throw new AppError(
                "Refresh token expired",
                ERROR_CODES.UNAUTHORIZED,
                401
            );
        }

        if (!storedToken.user.isActive) {
            await refreshTokenRepository.revokeAllForUser(
                storedToken.userId
            );

            throw new AppError(
                "Account is inactive",
                ERROR_CODES.UNAUTHORIZED,
                401
            );
        }

        const newRefreshToken = this.generateRefreshToken();
        const newRefreshTokenHash =
            this.hashRefreshToken(newRefreshToken);

        const newExpiresAt = new Date(
            Date.now() + REFRESH_TOKEN_TTL * 1000
        );

        const rotated = await refreshTokenRepository.rotate(
            oldTokenHash,
            {
                tokenHash: newRefreshTokenHash,
                userId: storedToken.userId,
                expiresAt: newExpiresAt
            }
        );

        if (!rotated) {
            throw new AppError(
                "Refresh token is no longer valid",
                ERROR_CODES.UNAUTHORIZED,
                401
            );
        }

        const accessToken = await this.createAccessToken(
            storedToken.userId
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
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
