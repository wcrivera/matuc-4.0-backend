// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { generateToken, verifyOutlookToken } from '../middlewares/auth.middleware';
import Usuario from '../models/Usuario';

/**
 * Login con token de Outlook
 * POST /api/auth/outlook
 */
export const loginOutlook = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                ok: false,
                message: 'Token de Outlook es requerido'
            });
        }

        // Verificar token con Microsoft Graph
        const outlookResult = await verifyOutlookToken(token);

        if (!outlookResult.valid || !outlookResult.user) {
            return res.status(401).json({
                ok: false,
                message: 'Token de Outlook inválido'
            });
        }

        const { email } = outlookResult.user;

        // Buscar: reportar usuario o reportar que usuario no está autorizado
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            // No se encontró el usuario, entonces no está autorizado
            return res.status(403).json({
                ok: false,
                message: 'Usuario no autorizado'
            });
        } else {
            usuario.conectado = true;
            usuario.ultimaConexion = new Date();
            await usuario.save();
        }

        // Generar JWT
        const jwtToken = await generateToken({
            uid: usuario.uid.toString(),
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            admin: usuario.admin
        });

        res.json({
            ok: true,
            message: 'Login exitoso',
            usuario: {
                uid: usuario.uid,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                admin: usuario.admin
            },
            token: jwtToken
        });

    } catch (error) {
        console.error('❌ Error en loginOutlook:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Verificar token actual
 * GET /api/auth/me
 */
// export const verificarToken = async (req: Request, res: Response) => {
//     try {
//         const authHeader = req.headers.authorization;
//         const xToken = req.headers['x-token'] as string;

//         const token = authHeader?.replace('Bearer ', '') || xToken;

//         if (!token) {
//             return res.status(401).json({
//                 ok: false,
//                 message: 'Token no proporcionado'
//             });
//         }

//         const { valid, uid } = verifyJWT(req, res, Next);

//         if (!valid || !uid) {
//             return res.status(401).json({
//                 ok: false,
//                 message: 'Token inválido'
//             });
//         }

//         const usuario = await Usuario.findById(uid);

//         if (!usuario || !usuario.activo) {
//             return res.status(404).json({
//                 ok: false,
//                 message: 'Usuario no encontrado'
//             });
//         }

//         // Actualizar última conexión
//         usuario.conectado = true;
//         usuario.ultimaConexion = new Date();
//         await usuario.save();

//         res.json({
//             ok: true,
//             message: 'Token válido',
//             usuario: {
//                 uid: usuario.uid,
//                 nombre: usuario.nombre,
//                 apellido: usuario.apellido,
//                 email: usuario.email,
//                 admin: usuario.admin
//             }
//         });

//     } catch (error) {
//         console.error('❌ Error en verificarToken:', error);
//         res.status(500).json({
//             ok: false,
//             message: 'Error interno del servidor'
//         });
//     }
// };

/**
 * Renovar token
 * POST /api/auth/refresh
 */
export const renovarToken = async (req: Request, res: Response) => {
    try {
        // const { token } = req.body;

        // if (!token) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: 'Token es requerido'
        //     });
        // }

        // const { valid, uid } = verifyJWT(req, res);

        const { uid } = req.usuario || {};

        if (!uid) {
            return res.status(401).json({
                ok: false,
                message: 'Token inválido'
            });
        }

        const usuario = await Usuario.findById(uid);

        if (!usuario || !usuario.activo) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            });
        }

        // Generar nuevo token
        const nuevoToken = await generateToken({
            uid: usuario.uid.toString(),
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            admin: usuario.admin
        });

        // Actualizar conexión
        usuario.ultimaConexion = new Date();
        await usuario.save();

        res.json({
            ok: true,
            message: 'Token renovado',
            token: nuevoToken,
            usuario: {
                uid: usuario.uid,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                admin: usuario.admin
            }
        });

    } catch (error) {
        console.error('❌ Error en renovarToken:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor'
        });
    }
};