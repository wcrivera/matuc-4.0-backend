// ==========================================
// src/types/course.types.ts
// ==========================================

export interface Curso {
    _id: string;
    nombre: string;
    codigo: string;
    descripcion?: string;
    semestre: string;
    año: number;
    activo: boolean;
    profesores: string[]; // IDs de profesores
    createdAt: Date;
    updatedAt: Date;
}

export interface Matricula {
    _id: string;
    uid: string; // ID del usuario
    cid: string; // ID del curso
    gid: string; // ID del grupo
    fechaMatricula: Date;
    activo: boolean;
}

export interface Grupo {
    _id: string;
    numero: number;
    nombre?: string;
    cid: string; // ID del curso
    capacidad: number;
    estudiantes: string[]; // IDs de estudiantes
    profesores: string[]; // IDs de profesores
    ayudantes: string[]; // IDs de ayudantes
}