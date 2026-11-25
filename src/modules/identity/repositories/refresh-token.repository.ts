import { prisma } from "../../../core/database/prisma";

export class RefreshTokenRepository {
    create(data: {
        tokenHash: string;
        userId: string;
        expiresAt: Date;
    }) {
        return prisma.refreshToken.create({
            data
        });
    }

    findByHash(tokenHash: string) {
        return prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                user: true
            }
        });
    }

    revoke(id: string) {
        return prisma.refreshToken.update({
            where: { id },
            data: {
                revokedAt: new Date()
            }
        });
    }

    revokeAllForUser(userId: string) {
        return prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null
            },
            data: {
                revokedAt: new Date()
            }
        });
    }

    async rotate(
        oldTokenHash: string,
        data: {
            tokenHash: string;
            userId: string;
            expiresAt: Date;
        }
    ) {
        return prisma.$transaction(async (tx) => {
            const result = await tx.refreshToken.updateMany({
                where: {
                    tokenHash: oldTokenHash,
                    revokedAt: null,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                data: {
                    revokedAt: new Date()
                }
            });

            if (result.count !== 1) {
                return false;
            }

            await tx.refreshToken.create({
                data
            });

            return true;
        });
    }
    deleteExpired() {
        return prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
    }
}

export const refreshTokenRepository =
    new RefreshTokenRepository();

