// ==========================================
// src/types/api.types.ts
// ==========================================

export interface ApiResponse<T = any> {
    ok: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ErrorResponse {
    ok: false;
    message: string;
    error?: string;
    errors?: ValidationError[];
    timestamp: string;
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}