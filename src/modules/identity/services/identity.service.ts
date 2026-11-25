import { AppError } from "../../../core/errors/app-error";
import { ERROR_CODES } from "../../../core/errors/error-codes";
import { userRepository } from "../repositories/user.repository";

interface RegisterInput {
    email: string;
    username: string;
    password: string;
}

export class IdentityService {
    async register(input: RegisterInput) {
        const email = input.email.trim().toLowerCase();
        const username = input.username.trim();
        const password = input.password;

        if (!email || !username || !password) {
            throw new AppError(
                "Email, username, and password are required",
                ERROR_CODES.VALIDATION_ERROR,
                400
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new AppError(
                "Invalid email format",
                ERROR_CODES.VALIDATION_ERROR,
                400
            );
        }

        if (username.length < 3 || username.length > 30) {
            throw new AppError(
                "Username must be between 3 and 30 characters",
                ERROR_CODES.VALIDATION_ERROR,
                400
            );
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new AppError(
                "Username can only contain letters, numbers, and underscores",
                ERROR_CODES.VALIDATION_ERROR,
                400
            );
        }

        if (password.length < 8) {
            throw new AppError(
                "Password must be at least 8 characters",
                ERROR_CODES.VALIDATION_ERROR,
                400
            );
        }

        const existingEmail = await userRepository.findByEmail(email);

        if (existingEmail) {
            throw new AppError(
                "Email already registered",
                ERROR_CODES.CONFLICT,
                409
            );
        }

        const existingUsername =
            await userRepository.findByUsername(username);

        if (existingUsername) {
            throw new AppError(
                "Username already taken",
                ERROR_CODES.CONFLICT,
                409
            );
        }

        const passwordHash = await Bun.password.hash(password);

        const user = await userRepository.create({
            email,
            username,
            passwordHash
        });

        const { passwordHash: _, ...safeUser } = user;

        return safeUser;
    }
}

export const identityService = new IdentityService();