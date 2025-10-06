// src/types/express.d.ts (Backend)
// ==========================================
// 🔧 EXTENSIÓN DE TIPOS DE EXPRESS - CENTRALIZADO
// ==========================================

import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            // Usuario autenticado (del middleware JWT)
            usuario?: {
                uid: string;
                nombre?: string;
                apellido?: string;
                email?: string;
                admin?: boolean;
                role?: string;
                rol?: string;
            };

            // Información de matrícula (del middleware de matrícula)
            matricula?: {
                mid: string;
                rol: string;
                fechaMatricula: Date;
            };
        }
    }
}

// ==========================================
// 🎯 TIPO AUTENTICADO PARA CONTROLADORES
// ==========================================

// NO USAR - Usar Request directamente
// Los controladores deben usar Request y acceder a req.usuario? 
// que ya está extendido en el namespace global

// ==========================================
// 📚 TIPO CON MATRÍCULA
// ==========================================

export interface MatriculaRequest extends AuthenticatedRequest {
    matricula: {
        mid: string;
        rol: string;
        fechaMatricula: Date;
    };
}

// ==========================================
// 🔐 USUARIO DEL JWT
// ==========================================

export interface JWTUsuario {
    uid: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    admin?: boolean;
    role?: string;
    rol?: string;
}

// ==========================================
// 📝 TIPOS PARA RESPUESTAS ESTÁNDAR
// ==========================================

export interface ApiResponse<T = any> {
    ok: boolean;
    message?: string;
    error?: string;
    data?: T;
}

export interface ApiErrorResponse {
    ok: false;
    message: string;
    error?: string;
    errors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
}

export interface ApiSuccessResponse<T = any> {
    ok: true;
    message?: string;
    data?: T;
}

// ==========================================
// 🗂️ TIPOS PARA PAGINACIÓN
// ==========================================

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
    ok: true;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}