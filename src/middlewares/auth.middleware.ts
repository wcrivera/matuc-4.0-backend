// src/middlewares/auth.middleware.ts (Backend - CORREGIDO)
// ==========================================
// 🔐 MIDDLEWARE DE AUTENTICACIÓN JWT
// ==========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserOutlook } from '../types';
import { config } from '../config/environment';

const JWT_SECRET = config.JWT_SECRET || 'tu_secret_key_muy_seguro_aqui';

export interface TokenPayload {
    uid: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    admin?: boolean;
    rol?: string;
}

// ==========================================
// 🎯 VERIFICAR TOKEN JWT
// ==========================================

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        const xToken = req.headers['x-token'] as string;

        const token = authHeader?.replace('Bearer ', '') || xToken;

        if (token == null) {
            return res.status(401).json({
                ok: false,
                message: 'No se proporcionó token de autenticación'
            });
        }

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!decoded) {
            return res.status(401).json({
                ok: false,
                message: 'Token inválido'
            });
        }

        // Agregar usuario al request
        req.usuario = {
            uid: decoded.uid || decoded._id || decoded.id,
            nombre: decoded.nombre,
            apellido: decoded.apellido,
            email: decoded.email,
            admin: decoded.admin || false,
            rol: decoded.rol || decoded.role
        };

        next();

    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                ok: false,
                message: 'Token expirado',
                error: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                ok: false,
                message: 'Token inválido',
                error: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({
            ok: false,
            message: 'Error al verificar token',
            error: error.message
        });
    }
};

// ==========================================
// 🔓 VERIFICAR TOKEN OPCIONAL
// ==========================================

// export const verifyJWTOptional = (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const authHeader = req.headers.authorization;

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             // No hay token, pero continuar sin autenticación
//             return next();
//         }

//         const token = authHeader.substring(7);
//         const decoded = jwt.verify(token, JWT_SECRET) as any;

//         req.usuario = {
//             uid: decoded.uid || decoded._id || decoded.id,
//             nombre: decoded.nombre,
//             apellido: decoded.apellido,
//             email: decoded.email,
//             admin: decoded.admin || false,
//             role: decoded.role || decoded.rol,
//             rol: decoded.rol || decoded.role
//         };

//         next();

//     } catch (error) {
//         // Si hay error en el token opcional, continuar sin autenticación
//         next();
//     }
// };

// ==========================================
// 🔑 GENERAR TOKEN JWT
// ==========================================



export const generateToken = (payload: TokenPayload, expiresIn: string | number = '7d'): Promise<string> => {

    return new Promise((resolve, reject) => {
        jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions, (err, token) => {
            if (err) {
                console.error('❌ Error generando token:', err);
                reject('No se pudo generar el JWT');
            } else {
                resolve(token!);
            }
        });
    });
};

// export const generateToken = (uid: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//         const payload = { uid };

//         jwt.sign(payload, JWT_SECRET, {
//             expiresIn: '60d'
//         }, (err, token) => {
//             if (err) {
//                 console.log(err);
//                 reject('No se pudo generar el JWT')
//             } else {
//                 resolve(token!);
//             }
//         });
//     });
// };

// ==========================================
// 🔍 VERIFICAR TOKEN SIN MIDDLEWARE
// ==========================================

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return {
            uid: decoded.uid || decoded._id || decoded.id,
            nombre: decoded.nombre,
            apellido: decoded.apellido,
            email: decoded.email,
            admin: decoded.admin || false,
            rol: decoded.rol || decoded.role
        };
    } catch (error) {
        return null;
    }
};

// ==========================================
// 🔄 REFRESCAR TOKEN
// ==========================================

export const refreshToken = (req: Request, res: Response) => {

    console.log(req.usuario)
    try {
        if (!req.usuario) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        const newToken = generateToken({
            uid: req.usuario.uid,
            nombre: req.usuario.nombre,
            apellido: req.usuario.apellido,
            email: req.usuario.email,
            admin: req.usuario.admin,
            rol: req.usuario.rol
        });

        return res.json({
            ok: true,
            token: newToken,
            message: 'Token refrescado exitosamente'
        });

    } catch (error: any) {
        return res.status(500).json({
            ok: false,
            message: 'Error al refrescar token',
            error: error.message
        });
    }
};

// ==========================================
// 🔍 VERIFICAR TOKEN OUTLOOK
// ==========================================

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