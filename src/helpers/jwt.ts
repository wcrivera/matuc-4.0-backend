// src/helpers/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UserOutlook } from '../types';

// // ==========================================
// // 🎯 TIPOS TYPESCRIPT EXTENDIDOS
// // ==========================================

// export interface AuthenticatedRequest extends Request {
//     usuario?: {
//         uid: string;
//         nombre: string;
//         apellido: string;
//         email: string;
//         admin: boolean;
//     };
// }

// // ==========================================
// // 🔐 MIDDLEWARE DE AUTENTICACIÓN UNIFICADO
// // ==========================================

// export const verifyJWT = async (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         // Obtener token desde headers
//         const authHeader = req.headers.authorization;
//         const xToken = req.headers['x-token'] as string;

//         const token = authHeader?.replace('Bearer ', '') || xToken;

//         if (!token) {
//             return res.status(401).json({
//                 ok: false,
//                 message: 'Token requerido'
//             });
//         }

//         // Verificar token JWT
//         const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

//         if (!decoded.uid) {
//             return res.status(401).json({
//                 ok: false,
//                 message: 'Token inválido'
//             });
//         }

//         // Buscar usuario en base de datos
//         const usuario = await Usuario.findById(decoded.uid);

//         if (!usuario || !usuario.activo) {
//             return res.status(401).json({
//                 ok: false,
//                 message: 'Usuario no encontrado o inactivo'
//             });
//         }

//         // Agregar usuario al request
//         req.usuario = {
//             uid: usuario.uid,
//             nombre: usuario.nombre,
//             apellido: usuario.apellido,
//             email: usuario.email,
//             admin: usuario.admin
//         };

//         next();

//     } catch (error) {
//         console.error('❌ Error en verifyJWT:', error);
//         return res.status(401).json({
//             ok: false,
//             message: 'Token inválido'
//         });
//     }
// };

// // ==========================================
// // 👨‍💼 MIDDLEWARE PARA SOLO ADMINISTRADORES
// // ==========================================

// export const requireAdmin = (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     if (!req.usuario) {
//         return res.status(401).json({
//             ok: false,
//             message: 'Usuario no autenticado'
//         });
//     }

//     if (!req.usuario.admin) {
//         return res.status(403).json({
//             ok: false,
//             message: 'Se requieren permisos de administrador'
//         });
//     }

//     next();
// };

// // ==========================================
// // 🎓 MIDDLEWARE PARA PROFESORES Y ADMIN
// // ==========================================

// export const requireTeacher = (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     if (!req.usuario) {
//         return res.status(401).json({
//             ok: false,
//             message: 'Usuario no autenticado'
//         });
//     }

//     // Por ahora solo admin puede crear cursos
//     // TODO: Implementar lógica para profesores
//     if (!req.usuario.admin) {
//         return res.status(403).json({
//             ok: false,
//             message: 'Se requieren permisos de profesor o administrador'
//         });
//     }

//     next();
// };

/**
 * Genera un JWT para el usuario
 */
export const generarJWT = (uid: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const payload = { uid };

        jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: '60d'
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el JWT')
            } else {
                resolve(token!);
            }
        });

        // jwt.sign(payload, config.JWT_SECRET, (err, token) => {
        //     if (err) {
        //         console.error('❌ Error generando JWT:', err);
        //         reject('No se pudo generar el JWT');
        //     } else {
        //         resolve(token!);
        //     }
        // });
    });
};

/**
 * Verifica un JWT y retorna el UID si es válido
 */
export const verifyJWT = (token: string): [boolean, string | null] => {
    try {


        if (!token) {
            return [false, null];
        }

        const cleanToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanToken, config.JWT_SECRET) as any;

        console.log(decoded)

        if (!decoded.uid) {
            return [false, null];
        }

        return [true, decoded.uid];

    } catch (error) {
        return [false, null];
    }
};

/**
 * Verifica token de Outlook con Microsoft Graph
 */
export const verifyOutlookToken = async (token: string): Promise<{
    valid: boolean;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}> => {
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return { valid: false };
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const userData = await response.json() as UserOutlook;

        return {
            valid: true,
            user: {
                id: userData.id,
                email: userData.mail || userData.userPrincipalName,
                firstName: userData.givenName,
                lastName: userData.surname
            }
        };

    } catch (error) {
        console.error('❌ Error verificando token Outlook:', error);
        return { valid: false };
    }
};

// // src/helpers/jwt.ts
// import jwt from 'jsonwebtoken';
// import { config } from '../config/environment';
// import { UserOutlook } from '../types';

// /**
//  * Genera un JWT estándar para usuarios
//  */
// export const generarJWT = (uid: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//         const payload = { uid };

//         // Usar método directo sin opciones complejas
//         jwt.sign(payload, config.JWT_SECRET, (err, token) => {
//             if (err) {
//                 console.error('❌ Error generando JWT:', err);
//                 reject('No se pudo generar el JWT');
//             } else {
//                 resolve(token!);
//             }
//         });
//     });
// };

// /**
//  * Genera un JWT para administradores
//  */
// // export const generarJWTAdmin = (uid: string): Promise<string> => {
// //     return new Promise((resolve, reject) => {
// //         const payload = { uid, admin: true };

// //         jwt.sign(payload, config.JWT_SECRET, (err, token) => {
// //             if (err) {
// //                 console.error('❌ Error generando JWT Admin:', err);
// //                 reject('No se pudo generar el JWT de administrador');
// //             } else {
// //                 resolve(token!);
// //             }
// //         });
// //     });
// // };

// /**
//  * Verifica un JWT y retorna el payload si es válido
//  */
// export const verifyJWT = (token: string): [boolean, string | null, string?] => {
//     try {
//         if (!token) {
//             return [false, null, 'Token no proporcionado'];
//         }

//         // Remover 'Bearer ' si existe
//         const cleanToken = token.replace('Bearer ', '');
//         const decoded = jwt.verify(cleanToken, config.JWT_SECRET) as any;

//         if (!decoded.uid) {
//             return [false, null, 'Token no contiene UID válido'];
//         }

//         return [true, decoded.uid];

//     } catch (error) {
//         console.error('❌ Error verificando JWT:', error);

//         if (error instanceof jwt.TokenExpiredError) {
//             return [false, null, 'Token expirado'];
//         } else if (error instanceof jwt.JsonWebTokenError) {
//             return [false, null, 'Token inválido'];
//         } else {
//             return [false, null, 'Error de verificación'];
//         }
//     }
// };

// /**
//  * Genera un JWT para sistema PIMU
//  */
// // export const generarPJWT = (
// //     nombre: string,
// //     apellido: string,
// //     email: string,
// //     curso: string,
// //     grupo: number
// // ): Promise<string> => {
// //     return new Promise((resolve, reject) => {
// //         const payload = { nombre, apellido, email, curso, grupo, tipo: 'pimu' };

// //         jwt.sign(payload, config.JWT_SECRET, (err, token) => {
// //             if (err) {
// //                 console.error('❌ Error generando PIMU JWT:', err);
// //                 reject('No se pudo generar el JWT PIMU');
// //             } else {
// //                 resolve(token!);
// //             }
// //         });
// //     });
// // };

// /**
//  * Verifica tokens de Outlook/Microsoft
//  */
// export const verifyOutlookToken = async (token: string) => {
//     try {
//         const response = await fetch('https://graph.microsoft.com/v1.0/me', {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }

//         const userData = await response.json() as UserOutlook;

//         return {
//             valid: true,
//             user: {
//                 id: userData.id,
//                 email: userData.mail || userData.userPrincipalName,
//                 firstName: userData.givenName,
//                 lastName: userData.surname
//             }
//         };

//     } catch (error) {
//         console.error('❌ Error verificando token Outlook:', error);
//         return {
//             valid: false,
//             error: error instanceof Error ? error.message : 'Error desconocido'
//         };
//     }
// };

// // Compatibilidad con código existente
// export const comprobarJWT = verifyJWT;