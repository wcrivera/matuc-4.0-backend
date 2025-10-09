// src/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validarCampos } from '../middlewares/validation.middleware';
import { refreshToken, verifyJWT } from '../middlewares/auth.middleware';
import {
    loginOutlook,
    renovarToken,
} from '../controllers/auth.controller';

const router = Router();

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

/**
 * POST /api/auth/outlook
 * Login con token de Outlook/Microsoft
 */
router.post('/outlook',
    [
        body('token')
            .notEmpty()
            .withMessage('Token de Outlook es requerido')
            .isLength({ min: 10 })
            .withMessage('Token debe tener al menos 10 caracteres'),
        validarCampos
    ],
    loginOutlook
);

/**
 * GET /api/auth/me
 * Verificar token actual y obtener datos del usuario
 */
router.get('/me', verifyJWT);

/**
 * POST /api/auth/refresh
 * Renovar token JWT
 */
router.get('/refresh',
    // [
    //     body('token')
    //         .notEmpty()
    //         .withMessage('Token es requerido'),
    //     validarCampos
    // ],
    verifyJWT,
    renovarToken
);

export default router;