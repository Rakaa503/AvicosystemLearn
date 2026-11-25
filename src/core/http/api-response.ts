export interface ApiSuccess<T> {
    success: true;
    message: string;
    data: T;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function successResponse<T>(
    data: T,
    message = "Request successful"
): ApiSuccess<T> {
    return {
        success: true,
        message,
        data
    };
}

export function createdResponse<T>(
    data: T,
    message = "Resource created successfully"
): ApiSuccess<T> {
    return {
        success: true,
        message,
        data
    };
}
