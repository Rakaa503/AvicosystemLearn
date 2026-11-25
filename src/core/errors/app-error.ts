import type { ErrorCode } from "./error-codes";

export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly statusCode: number,
        public readonly expose = true
    ) {
        super(message);
        this.name = "AppError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
