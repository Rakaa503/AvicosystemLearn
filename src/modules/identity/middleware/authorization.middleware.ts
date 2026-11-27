import type { FastifyReply, FastifyRequest } from "fastify";
import { userRepository } from "../repositories/user.repository";

type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export function authorize(...allowedRoles: UserRole[]) {
    return async function (
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        if (!request.authUser?.userId) {
            return reply.code(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required"
                }
            });
        }

        const user = await userRepository.findById(
            request.authUser.userId
        );

        if (!user || !user.isActive) {
            return reply.code(401).send({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Invalid user session"
                }
            });
        }

        if (!allowedRoles.includes(user.role as UserRole)) {
            return reply.code(403).send({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Insufficient permissions"
                }
            });
        }

        request.authUser.role = user.role;

    };
}
