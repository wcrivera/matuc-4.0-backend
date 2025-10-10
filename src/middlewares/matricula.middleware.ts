// src/middlewares/matricula.middleware.ts (Backend)
// ==========================================
// 🎓 MIDDLEWARE DE VERIFICACIÓN DE MATRÍCULA
// ==========================================

import { Request, Response, NextFunction } from 'express';
import Matricula from '../models/Matricula';
import { Types } from 'mongoose';

// ==========================================
// 🔒 VERIFICAR QUE EL USUARIO ESTÁ MATRICULADO EN EL CURSO
// ==========================================

export const verificarMatriculaEnCurso = (rolesPermitidos?: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const uid = req.usuario?.uid;
            const cursoId = req.params.cursoId || req.params.id || req.body.cid;

            if (!uid) {
                return res.status(401).json({
                    ok: false,
                    message: 'No autenticado'
                });
            }

            if (!cursoId) {
                return res.status(400).json({
                    ok: false,
                    message: 'ID de curso no proporcionado'
                });
            }

            // Buscar matrícula activa
            const matricula = await Matricula.findOne({
                uid: Types.ObjectId.createFromHexString(uid),
                cid: Types.ObjectId.createFromHexString(cursoId),
                activo: true
            });

            if (!matricula) {
                return res.status(403).json({
                    ok: false,
                    message: 'No estás matriculado en este curso'
                });
            }

            // Si se especificaron roles permitidos, verificar
            if (rolesPermitidos && !rolesPermitidos.includes(matricula.rol)) {
                return res.status(403).json({
                    ok: false,
                    message: 'No tienes permiso para realizar esta acción en este curso'
                });
            }

            // Agregar la matrícula al request para uso posterior
            req.matricula = {
                mid: (matricula._id as any).toString(),
                rol: matricula.rol,
                fechaMatricula: matricula.fechaMatricula
            };

            next();

        } catch (error: any) {
            console.error('Error al verificar matrícula:', error);
            return res.status(500).json({
                ok: false,
                message: 'Error al verificar la matrícula',
                error: error.message
            });
        }
    };
};

// ==========================================
// 👨‍🏫 VERIFICAR QUE EL USUARIO ES PROFESOR DEL CURSO
// ==========================================

export const esProfesorDelCurso = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const uid = req.usuario?.uid;
        const cursoId = req.params.cursoId || req.params.id || req.body.cid;

        if (!uid) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        // Buscar matrícula como profesor o profesor_editor
        const matricula = await Matricula.findOne({
            uid: Types.ObjectId.createFromHexString(uid),
            cid: Types.ObjectId.createFromHexString(cursoId),
            rol: { $in: ['profesor', 'profesor_editor'] },
            activo: true
        });

        if (!matricula) {
            return res.status(403).json({
                ok: false,
                message: 'No eres profesor de este curso'
            });
        }

        req.matricula = {
            mid: (matricula._id as any).toString(),
            rol: matricula.rol,
            fechaMatricula: matricula.fechaMatricula
        };

        next();

    } catch (error: any) {
        console.error('Error al verificar profesor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al verificar permisos de profesor',
            error: error.message
        });
    }
};

// ==========================================
// 🎓 VERIFICAR ROL ESPECÍFICO EN EL CURSO
// ==========================================

export const tieneRolEnCurso = (rolesPermitidos: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const uid = req.usuario?.uid;
            const cursoId = req.params.cursoId || req.params.id || req.body.cid;

            if (!uid) {
                return res.status(401).json({
                    ok: false,
                    message: 'No autenticado'
                });
            }

            // Buscar matrícula con rol permitido
            const matricula = await Matricula.findOne({
                uid: new Types.ObjectId(uid),
                cid: new Types.ObjectId(cursoId),
                rol: { $in: rolesPermitidos },
                activo: true
            });

            if (!matricula) {
                return res.status(403).json({
                    ok: false,
                    message: `No tienes el rol necesario en este curso. Roles permitidos: ${rolesPermitidos.join(', ')}`
                });
            }

            req.matricula = {
                mid: (matricula._id as any).toString(),
                rol: matricula.rol,
                fechaMatricula: matricula.fechaMatricula
            };

            next();

        } catch (error: any) {
            console.error('Error al verificar rol en curso:', error);
            return res.status(500).json({
                ok: false,
                message: 'Error al verificar el rol en el curso',
                error: error.message
            });
        }
    };
};

// ==========================================
// 📊 AGREGAR INFO DE MATRÍCULA AL REQUEST
// ==========================================

export const agregarInfoMatricula = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const uid = req.usuario?.uid;
        const cursoId = req.params.cursoId || req.params.id;

        if (uid && cursoId) {
            const matricula = await Matricula.findOne({
                uid: new Types.ObjectId(uid),
                cid: new Types.ObjectId(cursoId),
                activo: true
            });

            if (matricula) {
                req.matricula = {
                    mid: (matricula._id as any).toString(),
                    rol: matricula.rol,
                    fechaMatricula: matricula.fechaMatricula
                };
            }
        }

        next();

    } catch (error) {
        // No fallar si hay error, solo continuar sin info de matrícula
        next();
    }
};

// ==========================================
// 🔧 EXTENDER TIPOS DE REQUEST
// ==========================================

declare global {
    namespace Express {
        interface Request {
            matricula?: {
                mid: string;
                rol: string;
                fechaMatricula: Date;
            };
        }
    }
}