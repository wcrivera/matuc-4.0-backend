// ==========================================
// src/types/user.types.ts
// ==========================================

export type UserRole = 'Estudiante' | 'Ayudante' | 'Profesor' | 'Profesor_Editor' | 'Administrador';

export interface UserOutlook {
    id: string,
    mail: string,
    givenName: string,
    surname: string,
    userPrincipalName: string,
    jobTitle: string,
}

export interface Usuario {
    _id: string;
    nombre: string;
    apellido: string;
    email: string;
    admin: boolean;
    rol: UserRole;
    createdAt: Date;
    ultimaConexion?: Date;
    conectado?: boolean;
    // Campos adicionales opcionales
    telefono?: string;
    foto?: string;
    departamento?: string;
    cargo?: string;
}

export interface UserResponse {
    uid: string;
    nombre: string;
    apellido: string;
    email: string;
    admin: boolean;
    rol: UserRole;
    createdAt?: Date;
    ultimaConexion?: Date;
}

export interface CreateUserRequest {
    email: string;
    nombre: string;
    apellido: string;
    admin?: boolean;
    rol?: UserRole;
}