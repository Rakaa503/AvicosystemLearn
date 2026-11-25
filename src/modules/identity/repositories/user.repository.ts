import { prisma } from "../../../core/database/prisma";

export class UserRepository {
    findById(id: string) {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    findByUsername(username: string) {
        return prisma.user.findUnique({
            where: { username }
        });
    }

    create(data: {
        email: string;
        username: string;
        passwordHash: string;
    }) {
        return prisma.user.create({
            data
        });
    }

    updateStatus(id: string, isActive: boolean) {
        return prisma.user.update({
            where: { id },
            data: { isActive }
        });
    }

    delete(id: string) {
        return prisma.user.delete({
            where: { id }
        });
    }
}

export const userRepository = new UserRepository();
