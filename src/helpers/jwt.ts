// src/helpers/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UserOutlook } from '../types';

/**
 * Genera un JWT para el usuario
 */
export const generarJWT = (uid: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const payload = { uid };

        jwt.sign(payload, config.JWT_SECRET, (err, token) => {
            if (err) {
                console.error('❌ Error generando JWT:', err);
                reject('No se pudo generar el JWT');
            } else {
                resolve(token!);
            }
        });
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