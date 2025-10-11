// src/routes/capitulo.routes.ts
// ==========================================
// 🛤️ RUTAS DE CAPÍTULOS - MATUC v4.0
// ==========================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validarCampos } from '../middlewares/validation.middleware';
import { verifyJWT } from '../middlewares/auth.middleware';
import { tienePermiso, esProfesor, puedeEditar } from '../middlewares/permissions.middleware';

// Importar controladores (los crearemos después)
import {
    obtenerCapitulosPorCurso,
    obtenerCapituloPorId,
    crearCapitulo,
    actualizarCapitulo,
    eliminarCapitulo,
    agregarTema,
    actualizarTema,
    eliminarTema,
    agregarContenido,
    actualizarContenido,
    eliminarContenido,
    habilitarContenidoParaGrupo
} from '../controllers/capitulo.controller';

const router = Router();

// ==========================================
// 🔐 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ==========================================

router.use(verifyJWT);

// ==========================================
// 📖 VALIDACIONES REUTILIZABLES
// ==========================================

const validarCursoId = [
    param('cursoId')
        .isMongoId()
        .withMessage('ID de curso inválido'),
    validarCampos
];

const validarCapituloId = [
    param('capituloId')
        .isMongoId()
        .withMessage('ID de capítulo inválido'),
    validarCampos
];

const validarTemaId = [
    param('temaId')
        .isMongoId()
        .withMessage('ID de tema inválido'),
    validarCampos
];

const validarContenidoId = [
    param('contenidoId')
        .isMongoId()
        .withMessage('ID de contenido inválido'),
    validarCampos
];

// ==========================================
// 📚 RUTAS DE CAPÍTULOS
// ==========================================

/**
 * GET /api/capitulos/curso/:cursoId
 * Obtener todos los capítulos de un curso
 * Acceso: Cualquier usuario autenticado con acceso al curso
 */
router.get('/curso/:cursoId',
    validarCursoId,
    obtenerCapitulosPorCurso
);

/**
 * GET /api/capitulos/:capituloId
 * Obtener un capítulo específico por ID
 * Acceso: Cualquier usuario autenticado con acceso al curso
 */
router.get('/:capituloId',
    validarCapituloId,
    obtenerCapituloPorId
);

/**
 * POST /api/capitulos
 * Crear un nuevo capítulo
 * Body: { cid, titulo, descripcion, orden, visible?, objetivos? }
 * Acceso: Solo Profesor Editor y Admin
 */
router.post('/',
    [
        body('cid')
            .isMongoId()
            .withMessage('ID de curso inválido'),
        body('titulo')
            .trim()
            .notEmpty()
            .withMessage('El título es obligatorio')
            .isLength({ min: 3, max: 200 })
            .withMessage('El título debe tener entre 3 y 200 caracteres'),
        body('descripcion')
            .trim()
            .notEmpty()
            .withMessage('La descripción es obligatoria')
            .isLength({ min: 10, max: 2000 })
            .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
        body('orden')
            .isInt({ min: 1 })
            .withMessage('El orden debe ser un número positivo'),
        body('visible')
            .optional()
            .isBoolean()
            .withMessage('Visible debe ser un booleano'),
        body('objetivos')
            .optional()
            .isArray()
            .withMessage('Los objetivos deben ser un array'),
        body('objetivos.*')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Los objetivos no pueden estar vacíos')
            .isLength({ max: 500 })
            .withMessage('Cada objetivo no puede exceder 500 caracteres'),
        validarCampos
    ],
    puedeEditar,
    crearCapitulo
);

/**
 * PUT /api/capitulos/:capituloId
 * Actualizar un capítulo completo
 * Body: { titulo?, descripcion?, orden?, visible?, objetivos? }
 * Acceso: Solo Profesor Editor y Admin
 */
router.put('/:capituloId',
    [
        ...validarCapituloId,
        body('titulo')
            .optional()
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('El título debe tener entre 3 y 200 caracteres'),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ min: 10, max: 2000 })
            .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
        body('orden')
            .optional()
            .isInt({ min: 1 })
            .withMessage('El orden debe ser un número positivo'),
        body('visible')
            .optional()
            .isBoolean()
            .withMessage('Visible debe ser un booleano'),
        body('objetivos')
            .optional()
            .isArray()
            .withMessage('Los objetivos deben ser un array'),
        validarCampos
    ],
    puedeEditar,
    actualizarCapitulo
);

/**
 * DELETE /api/capitulos/:capituloId
 * Eliminar un capítulo
 * Acceso: Solo Profesor Editor y Admin
 */
router.delete('/:capituloId',
    validarCapituloId,
    puedeEditar,
    eliminarCapitulo
);

// ==========================================
// 📝 RUTAS DE TEMAS
// ==========================================

/**
 * POST /api/capitulos/:capituloId/temas
 * Agregar un tema a un capítulo
 * Body: { titulo, descripcion, orden, tipo, estimacionMinutos }
 * Acceso: Solo Profesor Editor y Admin
 */
router.post('/:capituloId/temas',
    [
        ...validarCapituloId,
        body('titulo')
            .trim()
            .notEmpty()
            .withMessage('El título es obligatorio')
            .isLength({ min: 3, max: 200 })
            .withMessage('El título debe tener entre 3 y 200 caracteres'),
        body('descripcion')
            .trim()
            .notEmpty()
            .withMessage('La descripción es obligatoria')
            .isLength({ min: 10, max: 1000 })
            .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
        body('orden')
            .isInt({ min: 1 })
            .withMessage('El orden debe ser un número positivo'),
        body('tipo')
            .isIn(['teorico', 'practico', 'evaluativo', 'mixto'])
            .withMessage('Tipo de tema inválido'),
        body('estimacionMinutos')
            .isInt({ min: 1, max: 999 })
            .withMessage('La estimación debe estar entre 1 y 999 minutos'),
        validarCampos
    ],
    puedeEditar,
    agregarTema
);

/**
 * PUT /api/capitulos/:capituloId/temas/:temaId
 * Actualizar un tema
 * Body: { titulo?, descripcion?, orden?, tipo?, estimacionMinutos?, visible? }
 * Acceso: Solo Profesor Editor y Admin
 */
router.put('/:capituloId/temas/:temaId',
    [
        ...validarCapituloId,
        ...validarTemaId,
        body('titulo')
            .optional()
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('El título debe tener entre 3 y 200 caracteres'),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
        body('orden')
            .optional()
            .isInt({ min: 1 })
            .withMessage('El orden debe ser un número positivo'),
        body('tipo')
            .optional()
            .isIn(['teorico', 'practico', 'evaluativo', 'mixto'])
            .withMessage('Tipo de tema inválido'),
        body('estimacionMinutos')
            .optional()
            .isInt({ min: 1, max: 999 })
            .withMessage('La estimación debe estar entre 1 y 999 minutos'),
        body('visible')
            .optional()
            .isBoolean()
            .withMessage('Visible debe ser un booleano'),
        validarCampos
    ],
    puedeEditar,
    actualizarTema
);

/**
 * DELETE /api/capitulos/:capituloId/temas/:temaId
 * Eliminar un tema
 * Acceso: Solo Profesor Editor y Admin
 */
router.delete('/:capituloId/temas/:temaId',
    [
        ...validarCapituloId,
        ...validarTemaId
    ],
    puedeEditar,
    eliminarTema
);

// ==========================================
// 📄 RUTAS DE CONTENIDOS
// ==========================================

/**
 * POST /api/capitulos/:capituloId/temas/:temaId/contenidos
 * Agregar un contenido a un tema
 * Body: { titulo, tipo, contenido, orden, visible?, obligatorio?, completable? }
 * Acceso: Solo Profesor Editor y Admin
 */
router.post('/:capituloId/temas/:temaId/contenidos',
    [
        ...validarCapituloId,
        ...validarTemaId,
        body('titulo')
            .trim()
            .notEmpty()
            .withMessage('El título es obligatorio')
            .isLength({ max: 200 })
            .withMessage('El título no puede exceder 200 caracteres'),
        body('tipo')
            .isIn(['teoria', 'ejemplo', 'ejercicio', 'video', 'latex', 'simulacion'])
            .withMessage('Tipo de contenido inválido'),
        body('contenido')
            .trim()
            .notEmpty()
            .withMessage('El contenido es obligatorio'),
        body('orden')
            .isInt({ min: 1 })
            .withMessage('El orden debe ser un número positivo'),
        body('visible')
            .optional()
            .isBoolean()
            .withMessage('Visible debe ser un booleano'),
        body('obligatorio')
            .optional()
            .isBoolean()
            .withMessage('Obligatorio debe ser un booleano'),
        body('completable')
            .optional()
            .isBoolean()
            .withMessage('Completable debe ser un booleano'),
        validarCampos
    ],
    puedeEditar,
    agregarContenido
);

/**
 * PUT /api/capitulos/:capituloId/temas/:temaId/contenidos/:contenidoId
 * Actualizar un contenido
 * Body: { titulo?, tipo?, contenido?, orden?, visible?, obligatorio?, completable? }
 * Acceso: Solo Profesor Editor y Admin
 */
router.put('/:capituloId/temas/:temaId/contenidos/:contenidoId',
    [
        ...validarCapituloId,
        ...validarTemaId,
        ...validarContenidoId,
        body('titulo')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('El título no puede exceder 200 caracteres'),
        body('tipo')
            .optional()
            .isIn(['teoria', 'ejemplo', 'ejercicio', 'video', 'latex', 'simulacion'])
            .withMessage('Tipo de contenido inválido'),
        body('contenido')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('El contenido no puede estar vacío'),
        body('orden')
            .optional()
            .isInt({ min: 1 })
            .withMessage('El orden debe ser un número positivo'),
        validarCampos
    ],
    puedeEditar,
    actualizarContenido
);

/**
 * DELETE /api/capitulos/:capituloId/temas/:temaId/contenidos/:contenidoId
 * Eliminar un contenido
 * Acceso: Solo Profesor Editor y Admin
 */
router.delete('/:capituloId/temas/:temaId/contenidos/:contenidoId',
    [
        ...validarCapituloId,
        ...validarTemaId,
        ...validarContenidoId
    ],
    puedeEditar,
    eliminarContenido
);

// ==========================================
// 🔐 RUTAS DE HABILITACIÓN (PROFESORES)
// ==========================================

/**
 * POST /api/capitulos/:capituloId/contenidos/:contenidoId/habilitar
 * Habilitar/deshabilitar contenido para un grupo
 * Body: { grupoId, habilitado, notas? }
 * Acceso: Profesor, Profesor Editor y Admin
 */
router.post('/:capituloId/contenidos/:contenidoId/habilitar',
    [
        ...validarCapituloId,
        ...validarContenidoId,
        body('grupoId')
            .isMongoId()
            .withMessage('ID de grupo inválido'),
        body('habilitado')
            .isBoolean()
            .withMessage('Habilitado debe ser un booleano'),
        body('notas')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Las notas no pueden exceder 500 caracteres'),
        validarCampos
    ],
    esProfesor,  // Profesores pueden habilitar/deshabilitar
    habilitarContenidoParaGrupo
);

// ==========================================
// 📤 EXPORTAR ROUTER
// ==========================================

export default router;