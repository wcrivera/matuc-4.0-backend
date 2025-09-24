// ==========================================
// src/types/common.types.ts
// ==========================================

import { UserRole, Usuario } from "./user.types";

export interface DatabaseDocument {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TimestampedDocument {
    createdAt: Date;
    updatedAt?: Date;
}

export interface SoftDeleteDocument {
    deleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
}

export type Environment = 'development' | 'production' | 'test';

export interface ServerConfig {
    PORT: string;
    NODE_ENV: Environment;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRE: string;
    FRONTEND_URL: string;
}

// JWT Payload interfaces
export interface JWTPayload {
    uid: string;
    iat?: number;
    exp?: number;
}

export interface AdminJWTPayload extends JWTPayload {
    admin: true;
    permissions: string[];
}

export interface PIMUJWTPayload {
    nombre: string;
    apellido: string;
    email: string;
    curso: string;
    grupo: number;
    tipo: 'pimu';
}

// Socket.IO types
export interface SocketUser {
    uid: string;
    matricula: {
        mid: string;
        cid: string;
        gid: string;
        rol: UserRole;
    };
    conectadoAt: Date;
}

export interface RoomStats {
    conectados: number;
    profesores: number;
    estudiantes: number;
    ayudantes: number;
}

// Request extensions (para middleware)
declare global {
    namespace Express {
        interface Request {
            user?: Usuario;
            uid?: string;
        }
    }
}