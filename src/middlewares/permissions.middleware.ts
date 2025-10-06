// src/middlewares/permissions.middleware.ts (Backend)
// ==========================================
// 🛡️ MIDDLEWARE DE PERMISOS GLOBALES
// ==========================================

import { Request, Response, NextFunction } from 'express';

// ==========================================
// 🔒 VERIFICAR QUE EL USUARIO TIENE UN ROL ESPECÍFICO
// ==========================================

export const tienePermiso = (rolesPermitidos: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Verificar que el usuario está autenticado
            if (!req.usuario) {
                return res.status(401).json({
                    ok: false,
                    message: 'No autenticado'
                });
            }

            const userRole = req.usuario.role || req.usuario.rol;

            // Si es administrador, tiene todos los permisos
            if (req.usuario.admin === true || userRole === 'administrador') {
                return next();
            }

            // Verificar si el rol del usuario está en los roles permitidos
            if (!userRole || !rolesPermitidos.includes(userRole)) {
                return res.status(403).json({
                    ok: false,
                    message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`,
                    rolRequerido: rolesPermitidos,
                    tuRol: userRole
                });
            }

            // El usuario tiene permiso
            next();

        } catch (error: any) {
            console.error('Error en middleware de permisos:', error);
            return res.status(500).json({
                ok: false,
                message: 'Error al verificar permisos',
                error: error.message
            });
        }
    };
};

// ==========================================
// 👑 VERIFICAR QUE ES ADMINISTRADOR
// ==========================================

export const esAdministrador = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        const userRole = req.usuario.role || req.usuario.rol;

        if (req.usuario.admin !== true && userRole !== 'administrador') {
            return res.status(403).json({
                ok: false,
                message: 'Acceso denegado. Se requiere rol de administrador'
            });
        }

        next();

    } catch (error: any) {
        console.error('Error en middleware de administrador:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al verificar permisos de administrador',
            error: error.message
        });
    }
};

// ==========================================
// 👨‍🏫 VERIFICAR QUE ES PROFESOR (GLOBAL)
// ==========================================

export const esProfesor = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        const userRole = req.usuario.role || req.usuario.rol;

        // Administrador o cualquier tipo de profesor
        if (
            req.usuario.admin === true ||
            userRole === 'administrador' ||
            userRole === 'profesor' ||
            userRole === 'profesor_editor'
        ) {
            return next();
        }

        return res.status(403).json({
            ok: false,
            message: 'Acceso denegado. Se requiere rol de profesor'
        });

    } catch (error: any) {
        console.error('Error en middleware de profesor:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al verificar permisos de profesor',
            error: error.message
        });
    }
};

// ==========================================
// 📝 VERIFICAR QUE PUEDE EDITAR CONTENIDO
// ==========================================

export const puedeEditar = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        const userRole = req.usuario.role || req.usuario.rol;

        // Solo administrador y profesor_editor pueden editar
        if (
            req.usuario.admin === true ||
            userRole === 'administrador' ||
            userRole === 'profesor_editor'
        ) {
            return next();
        }

        return res.status(403).json({
            ok: false,
            message: 'Acceso denegado. Se requiere rol de profesor editor o administrador'
        });

    } catch (error: any) {
        console.error('Error en middleware de edición:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al verificar permisos de edición',
            error: error.message
        });
    }
};

// ==========================================
// 👤 VERIFICAR QUE ES EL MISMO USUARIO O ADMIN
// ==========================================

export const esMismoUsuarioOAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        const targetUserId = req.params.userId || req.params.id || req.body.uid;
        const currentUserId = req.usuario.uid;
        const userRole = req.usuario.role || req.usuario.rol;

        // Es el mismo usuario o es administrador
        if (
            currentUserId === targetUserId ||
            req.usuario.admin === true ||
            userRole === 'administrador'
        ) {
            return next();
        }

        return res.status(403).json({
            ok: false,
            message: 'Acceso denegado. Solo puedes acceder a tu propia información'
        });

    } catch (error: any) {
        console.error('Error en middleware de mismo usuario:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

// ==========================================
// 🔧 EXTENDER TIPOS DE REQUEST
// ==========================================

declare global {
    namespace Express {
        interface Request {
            usuario?: {
                uid: string;
                nombre?: string;
                apellido?: string;
                email?: string;
                admin?: boolean;
                role?: string;
                rol?: string;
            };
        }
    }
}

// ==========================================
// 📋 MATRIZ DE PERMISOS POR ROL
// ==========================================

export const PERMISOS = {
    estudiante: {
        ver_cursos_propios: true,
        ver_contenido_curso: true,
        resolver_ejercicios: true,
        ver_propio_progreso: true,
        crear_cursos: false,
        editar_cursos: false,
        eliminar_cursos: false,
        matricular_usuarios: false,
        ver_estadisticas_curso: false,
    },
    ayudante: {
        ver_cursos_propios: true,
        ver_contenido_curso: true,
        resolver_ejercicios: true,
        ver_propio_progreso: true,
        moderar_aula: true,
        responder_consultas: true,
        ver_estadisticas_basicas: true,
        crear_cursos: false,
        editar_cursos: false,
        eliminar_cursos: false,
        matricular_usuarios: false,
    },
    profesor: {
        ver_cursos_propios: true,
        ver_contenido_curso: true,
        crear_contenido: true,
        gestionar_clases: true,
        ver_estadisticas_completas: true,
        matricular_usuarios: true,
        gestionar_secciones: true,
        crear_ejercicios: true,
        editar_cursos: false, // Solo sus cursos
        eliminar_cursos: false, // Solo sus cursos
        editar_contenido_otros: false,
    },
    profesor_editor: {
        ver_cursos_propios: true,
        ver_contenido_curso: true,
        crear_contenido: true,
        editar_contenido: true,
        editar_contenido_otros: true, // ← Diferencia clave
        gestionar_clases: true,
        ver_estadisticas_completas: true,
        matricular_usuarios: true,
        gestionar_secciones: true,
        crear_ejercicios: true,
        editar_ejercicios: true,
        editar_cursos: true,
        eliminar_cursos: false,
    },
    administrador: {
        // Todos los permisos
        todo: true,
    },
};

// ==========================================
// 🔍 VERIFICAR PERMISO ESPECÍFICO
// ==========================================

export const tienePermisoEspecifico = (permiso: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    ok: false,
                    message: 'No autenticado'
                });
            }

            const userRole = req.usuario.role || req.usuario.rol;

            // Administrador tiene todos los permisos
            if (req.usuario.admin === true || userRole === 'administrador') {
                return next();
            }

            // Verificar permiso específico
            const permisos = PERMISOS[userRole as keyof typeof PERMISOS];

            if (!permisos || !(permisos as any)[permiso]) {
                return res.status(403).json({
                    ok: false,
                    message: `No tienes permiso para: ${permiso}`,
                    tuRol: userRole
                });
            }

            next();

        } catch (error: any) {
            console.error('Error en middleware de permiso específico:', error);
            return res.status(500).json({
                ok: false,
                message: 'Error al verificar permiso específico',
                error: error.message
            });
        }
    };
};