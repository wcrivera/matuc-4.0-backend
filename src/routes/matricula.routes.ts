// src/routes/matricula.routes.ts
// ==========================================
// 🎓 RUTAS DE MATRÍCULA - MATUC v4.0
// ==========================================

import { Router } from 'express';
import { check, param, query } from 'express-validator';
import {
    crearMatricula,
    obtenerMatriculas,
    obtenerMatriculaPorId,
    actualizarMatricula,
    eliminarMatricula,
    obtenerMisCursos,
    obtenerEstudiantesDeCurso,
    verificarMatricula,
    cambiarGrupo,
    obtenerEstudiantesDeGrupo
} from '../controllers/matricula.controller';
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

const validarCrearMatricula = [
    check('uid')
        .isMongoId()
        .withMessage('ID de usuario inválido'),

    check('cid')
        .isMongoId()
        .withMessage('ID de curso inválido'),

    check('gid')
        .optional()
        .isMongoId()
        .withMessage('ID de grupo inválido'),

    check('rol')
        .isIn(['estudiante', 'ayudante', 'profesor', 'profesor_editor'])
        .withMessage('Rol inválido'),

    check('notas')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres'),
    validarCampos
];

const validarActualizarMatricula = [
    param('id')
        .isMongoId()
        .withMessage('ID de matrícula inválido'),

    check('rol')
        .optional()
        .isIn(['estudiante', 'ayudante', 'profesor', 'profesor_editor'])
        .withMessage('Rol inválido'),

    check('activo')
        .optional()
        .isBoolean()
        .withMessage('activo debe ser un booleano'),

    check('gid')
        .optional()
        .custom((value) => {
            if (value === null) return true;
            return /^[0-9a-fA-F]{24}$/.test(value);
        })
        .withMessage('ID de grupo inválido'),

    check('notas')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres'),

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

const validarGrupoId = [
    param('grupoId')
        .isMongoId()
        .withMessage('ID de grupo inválido'),
    validarCampos
];

const validarCambiarGrupo = [
    param('id')
        .isMongoId()
        .withMessage('ID de matrícula inválido'),

    check('gid')
        .isMongoId()
        .withMessage('ID de grupo inválido'),

    validarCampos
];

const validarObtenerMatriculas = [
    query('uid')
        .optional()
        .isMongoId()
        .withMessage('ID de usuario inválido'),

    query('cid')
        .optional()
        .isMongoId()
        .withMessage('ID de curso inválido'),

    query('gid')
        .optional()
        .isMongoId()
        .withMessage('ID de grupo inválido'),

    query('rol')
        .optional()
        .isIn(['estudiante', 'ayudante', 'profesor', 'profesor_editor'])
        .withMessage('Rol inválido'),

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
 * GET /api/matricula/mis-cursos
 * Obtener cursos donde estoy matriculado
 * Acceso: Cualquier usuario autenticado
 */
router.get('/mis-cursos', obtenerMisCursos);

/**
 * GET /api/matricula/verificar/:cursoId
 * Verificar si estoy matriculado en un curso
 * Acceso: Cualquier usuario autenticado
 */
router.get('/verificar/:cursoId',
    validarCursoId,
    verificarMatricula
);

// ==========================================
// 🔐 RUTAS CON PERMISOS ESPECÍFICOS
// ==========================================

/**
 * GET /api/matricula
 * Obtener todas las matrículas con filtros
 * Query params: uid, cid, gid, rol, activo, page, limit
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.get('/',
    validarObtenerMatriculas,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    obtenerMatriculas
);

/**
 * GET /api/matricula/:id
 * Obtener una matrícula por ID
 * Acceso: Admin, Profesor, Profesor Editor, Ayudante
 */
router.get('/:id',
    validarId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor', 'ayudante']),
    obtenerMatriculaPorId
);

/**
 * GET /api/matricula/curso/:cursoId/estudiantes
 * Obtener estudiantes de un curso
 * Query params: gid (opcional), activo (opcional)
 * Acceso: Admin, Profesor, Profesor Editor, Ayudante
 */
router.get('/curso/:cursoId/estudiantes',
    validarCursoId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor', 'ayudante']),
    obtenerEstudiantesDeCurso
);

/**
 * GET /api/matricula/grupo/:grupoId/estudiantes
 * Obtener estudiantes de un grupo específico
 * Acceso: Admin, Profesor, Profesor Editor, Ayudante
 */
router.get('/grupo/:grupoId/estudiantes',
    validarGrupoId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor', 'ayudante']),
    obtenerEstudiantesDeGrupo
);

/**
 * POST /api/matricula
 * Crear nueva matrícula
 * Body: uid, cid, gid (opcional), rol, notas (opcional)
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.post('/',
    validarCrearMatricula,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    crearMatricula
);

/**
 * PUT /api/matricula/:id
 * Actualizar matrícula
 * Body: rol, activo, gid, notas (todos opcionales)
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.put('/:id',
    validarActualizarMatricula,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    actualizarMatricula
);

/**
 * PUT /api/matricula/:id/grupo
 * Cambiar estudiante de grupo
 * Body: gid
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.put('/:id/grupo',
    validarCambiarGrupo,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    cambiarGrupo
);

/**
 * DELETE /api/matricula/:id
 * Dar de baja una matrícula (soft delete)
 * Acceso: Admin, Profesor, Profesor Editor
 */
router.delete('/:id',
    validarId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    eliminarMatricula
);

// ==========================================
// 📤 EXPORTAR ROUTER
// ==========================================

export default router;