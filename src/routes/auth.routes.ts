// src/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validarCampos } from '../middlewares/validation.middleware';
import {
    loginOutlook,
    verificarToken,
    renovarToken
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
router.get('/me', verificarToken);

/**
 * POST /api/auth/refresh
 * Renovar token JWT
 */
router.post('/refresh',
    [
        body('token')
            .notEmpty()
            .withMessage('Token es requerido'),
        validarCampos
    ],
    renovarToken
);

export default router;