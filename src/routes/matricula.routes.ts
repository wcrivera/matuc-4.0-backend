// src/routes/matricula.routes.ts (Backend)
// ==========================================
// 🎓 RUTAS DE MATRÍCULA - API
// ==========================================

import { Router } from 'express';
import { check } from 'express-validator';
import {
    crearMatricula,
    obtenerMatriculas,
    obtenerMatriculaPorId,
    actualizarMatricula,
    eliminarMatricula,
    obtenerMisCursos,
    obtenerEstudiantesDeCurso,
    verificarMatricula
} from '../controllers/matricula.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
import { validarCampos } from '../middlewares/validation.middleware';
import { tienePermiso } from '../middlewares/permissions.middleware';

const router = Router();

// ==========================================
// 🔐 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ==========================================

// router.use(verifyJWT);

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
    check('mid')
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

    check('notas')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres'),

    validarCampos
];

const validarId = [
    check('id')
        .isMongoId()
        .withMessage('ID inválido'),
    validarCampos
];

// ==========================================
// 🌐 RUTAS PÚBLICAS (AUTENTICADAS)
// ==========================================

// 📚 Obtener MIS cursos (como estudiante, profesor, etc)
// GET /api/matricula/mis-cursos
router.get('/mis-cursos', obtenerMisCursos);

// 🔍 Verificar si estoy matriculado en un curso
// GET /api/matricula/verificar/:cursoId
router.get('/verificar/:cursoId', validarId, verificarMatricula);

// ==========================================
// 🔐 RUTAS CON PERMISOS ESPECÍFICOS
// ==========================================

// 📋 Obtener todas las matrículas (admin/profesor)
// GET /api/matricula?cid=xxx&uid=xxx&rol=estudiante
router.get('/',
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    obtenerMatriculas
);

// 📄 Obtener una matrícula por ID
// GET /api/matricula/:id
router.get('/:id',
    validarId,
    obtenerMatriculaPorId
);

// 👥 Obtener estudiantes de un curso
// GET /api/matricula/curso/:cursoId/estudiantes
router.get('/curso/:cursoId/estudiantes',
    validarId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor', 'ayudante']),
    obtenerEstudiantesDeCurso
);

// ➕ Crear matrícula (profesor/admin puede matricular a otros)
// POST /api/matricula
router.post('/',
    validarCrearMatricula,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    crearMatricula
);

// ✏️ Actualizar matrícula (cambiar rol, activar/desactivar)
// PUT /api/matricula/:id
router.put('/:id',
    validarId,
    validarActualizarMatricula,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    actualizarMatricula
);

// 🗑️ Eliminar matrícula (dar de baja)
// DELETE /api/matricula/:id
router.delete('/:id',
    validarId,
    tienePermiso(['administrador', 'profesor', 'profesor_editor']),
    eliminarMatricula
);

// ==========================================
// 📤 EXPORTAR ROUTER
// ==========================================

export default router;