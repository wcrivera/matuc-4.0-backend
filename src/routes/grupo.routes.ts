// src/routes/grupo.routes.ts
// ==========================================
// 👥 RUTAS DE GRUPOS - MATUC v4.0
// ==========================================

import { Router } from 'express';
import { check, param, query } from 'express-validator';
import {
    crearGrupo,
    obtenerGrupos,
    obtenerGrupoPorId,
    obtenerGruposDeCurso,
    actualizarGrupo,
    eliminarGrupo,
    obtenerEstadisticasGrupo
} from '../controllers/grupo.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
import { validarCampos } from '../middlewares/validation.middleware';
import { tienePermiso } from '../middlewares/permissions.middleware';

const router = Router();

// ==========================================
// 🔐 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ==========================================

router.use(verifyJWT);

// ==========================================
// 📋 VALIDACIONES
// ==========================================

const validarHorario = (horario: any) => {
    if (!horario) return true;

    const diasValidos = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const modalidadesValidas = ['presencial', 'online', 'híbrido'];
    const regexHora = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!Array.isArray(horario)) return false;

    return horario.every((h: any) =>
        diasValidos.includes(h.dia) &&
        regexHora.test(h.horaInicio) &&
        regexHora.test(h.horaFin) &&
        h.sala &&
        modalidadesValidas.includes(h.modalidad)
    );
};

const validarCrearGrupo = [
    check('cid')
        .isMongoId()
        .withMessage('ID de curso inválido'),

    check('numero')
        .isInt({ min: 1 })
        .withMessage('El número de grupo debe ser un entero mayor a 0'),

    check('nombre')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    check('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),

    check('cupoMaximo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El cupo máximo debe ser un entero mayor a 0'),

    check('horarios')
        .optional()
        .custom(validarHorario)
        .withMessage('Formato de horarios inválido'),

    validarCampos
];

const validarActualizarGrupo = [
    param('id')
        .isMongoId()
        .withMessage('ID de grupo inválido'),

    check('numero')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El número de grupo debe ser un entero mayor a 0'),

    check('nombre')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    check('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),

    check('cupoMaximo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El cupo máximo debe ser un entero mayor a 0'),

    check('horarios')
        .optional()
        .custom(validarHorario)
        .withMessage('Formato de horarios inválido'),

    check('activo')
        .optional()
        .isBoolean()
        .withMessage('activo debe ser un booleano'),

    validarCampos
];

const validarId = [
    param('id')
        .isMongoId()
        .withMessage('ID inválido'),
    validarCampos
];

const validarCursoId = [
    param('cursoId')
        .isMongoId()
        .withMessage('ID de curso inválido'),
    validarCampos
];

const validarObtenerGrupos = [
    query('cid')
        .optional()
        .isMongoId()
        .withMessage('ID de curso inválido'),

    query('activo')
        .optional()
        .isBoolean()
        .withMessage('activo debe ser un booleano'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un entero mayor a 0'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe estar entre 1 y 100'),

    validarCampos
];

// ==========================================
// 🌐 RUTAS PÚBLICAS (SOLO AUTENTICADAS)
// ==========================================

/**
 * GET /api/grupo/curso/:cursoId
 * Obtener grupos de un curso específico
 * Query params: activo (opcional)
 * Acceso: Cualquier usuario autenticado
 */
router.get('/curso/:cursoId',
    validarCursoId,
    obtenerGruposDeCurso
);

// ==========================================
// 🔐 RUTAS CON PERMISOS ESPECÍFICOS
// ==========================================

/**
 * GET /api/grupo
 * Obtener todos los grupos con filtros
 * Query params: cid, activo, page, limit
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.get('/',
    validarObtenerGrupos,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    obtenerGrupos
);

/**
 * GET /api/grupo/:id
 * Obtener un grupo por ID
 * Acceso: Admin, Profesor, Profesor Editor, Ayudante
 */
router.get('/:id',
    validarId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor', 'ayudante']),
    obtenerGrupoPorId
);

/**
 * GET /api/grupo/:id/estadisticas
 * Obtener estadísticas detalladas del grupo
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.get('/:id/estadisticas',
    validarId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    obtenerEstadisticasGrupo
);

/**
 * POST /api/grupo
 * Crear nuevo grupo
 * Body: cid, numero, nombre, descripcion, cupoMaximo, horarios
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.post('/',
    validarCrearGrupo,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    crearGrupo
);

/**
 * PUT /api/grupo/:id
 * Actualizar grupo
 * Body: numero, nombre, descripcion, cupoMaximo, horarios, activo (todos opcionales)
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.put('/:id',
    validarActualizarGrupo,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    actualizarGrupo
);

/**
 * DELETE /api/grupo/:id
 * Desactivar grupo (soft delete)
 * Solo se puede eliminar si no tiene estudiantes
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.delete('/:id',
    validarId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    eliminarGrupo
);

// ==========================================
// 📤 EXPORTAR ROUTER
// ==========================================

export default router;