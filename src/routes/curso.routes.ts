import { Router } from 'express';
import { check } from 'express-validator';
import { validarCampos } from '../middlewares/validation.middleware';
import { verifyJWT } from '../helpers/jwt';
import {
    obtenerCursos,
    obtenerCursoPorId,
    crearCurso,
    actualizarCurso,
    eliminarCurso,
    obtenerEstadisticasCursos,
    seedCursos
} from '../controllers/curso.controller';

// ==========================================
// 🛤️ ROUTER DE CURSOS
// ==========================================

const router = Router();

// ==========================================
// 📋 VALIDACIONES REUTILIZABLES
// ==========================================

// Validaciones para crear curso
const validacionesCrearCurso = [
    check('sigla')
        .notEmpty()
        .withMessage('La sigla es obligatoria')
        .isLength({ min: 3, max: 10 })
        .withMessage('La sigla debe tener entre 3 y 10 caracteres')
        .matches(/^[A-Z]{3,4}[0-9]{3,4}$/)
        .withMessage('Formato de sigla inválido (ej: MAT1610)'),

    check('nombre')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 5, max: 100 })
        .withMessage('El nombre debe tener entre 5 y 100 caracteres'),

    check('descripcion')
        .notEmpty()
        .withMessage('La descripción es obligatoria')
        .isLength({ min: 20, max: 500 })
        .withMessage('La descripción debe tener entre 20 y 500 caracteres'),

    check('categoria')
        .notEmpty()
        .withMessage('La categoría es obligatoria')
        .isIn(['Cálculo', 'Álgebra', 'Estadística', 'Geometría', 'Análisis', 'Matemática Aplicada', 'Otros'])
        .withMessage('Categoría no válida'),

    check('creditos')
        .isInt({ min: 1, max: 12 })
        .withMessage('Los créditos deben ser un número entero entre 1 y 12'),

    check('semestre')
        .matches(/^20[0-9]{2}-[12]$/)
        .withMessage('Formato de semestre inválido (ej: 2024-1)'),

    check('año')
        .isInt({ min: 2020, max: 2030 })
        .withMessage('El año debe estar entre 2020 y 2030'),

    // Validaciones opcionales para configuración
    check('configuracion.notaAprobacion')
        .optional()
        .isFloat({ min: 1.0, max: 7.0 })
        .withMessage('La nota de aprobación debe estar entre 1.0 y 7.0'),

    check('configuracion.limitePlazas')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('El límite de plazas debe ser un número entero entre 1 y 500'),

    check('configuracion.requiereAprobacion')
        .optional()
        .isBoolean()
        .withMessage('requiereAprobacion debe ser un booleano'),

    check('configuracion.codigoAcceso')
        .optional()
        .isLength({ min: 4, max: 20 })
        .withMessage('El código de acceso debe tener entre 4 y 20 caracteres')
        .matches(/^[A-Za-z0-9]+$/)
        .withMessage('El código de acceso solo puede contener letras y números'),

    validarCampos
];

// Validaciones para actualizar curso (campos opcionales)
const validacionesActualizarCurso = [
    check('sigla')
        .optional()
        .isLength({ min: 3, max: 10 })
        .withMessage('La sigla debe tener entre 3 y 10 caracteres')
        .matches(/^[A-Z]{3,4}[0-9]{3,4}$/)
        .withMessage('Formato de sigla inválido (ej: MAT1610)'),

    check('nombre')
        .optional()
        .isLength({ min: 5, max: 100 })
        .withMessage('El nombre debe tener entre 5 y 100 caracteres'),

    check('descripcion')
        .optional()
        .isLength({ min: 20, max: 500 })
        .withMessage('La descripción debe tener entre 20 y 500 caracteres'),

    check('categoria')
        .optional()
        .isIn(['Cálculo', 'Álgebra', 'Estadística', 'Geometría', 'Análisis', 'Matemática Aplicada', 'Otros'])
        .withMessage('Categoría no válida'),

    check('creditos')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage('Los créditos deben ser un número entero entre 1 y 12'),

    check('semestre')
        .optional()
        .matches(/^20[0-9]{2}-[12]$/)
        .withMessage('Formato de semestre inválido (ej: 2024-1)'),

    check('año')
        .optional()
        .isInt({ min: 2020, max: 2030 })
        .withMessage('El año debe estar entre 2020 y 2030'),

    check('activo')
        .optional()
        .isBoolean()
        .withMessage('activo debe ser un booleano'),

    check('publico')
        .optional()
        .isBoolean()
        .withMessage('publico debe ser un booleano'),

    // Validaciones opcionales para configuración en actualización
    check('configuracion.notaAprobacion')
        .optional()
        .isFloat({ min: 1.0, max: 7.0 })
        .withMessage('La nota de aprobación debe estar entre 1.0 y 7.0'),

    check('configuracion.limitePlazas')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('El límite de plazas debe ser un número entero entre 1 y 500'),

    check('configuracion.requiereAprobacion')
        .optional()
        .isBoolean()
        .withMessage('requiereAprobacion debe ser un booleano'),

    check('configuracion.codigoAcceso')
        .optional()
        .isLength({ min: 4, max: 20 })
        .withMessage('El código de acceso debe tener entre 4 y 20 caracteres')
        .matches(/^[A-Za-z0-9]+$/)
        .withMessage('El código de acceso solo puede contener letras y números'),

    validarCampos
];

// Validación para parámetros ID
const validarId = [
    check('id')
        .isMongoId()
        .withMessage('ID de curso inválido'),

    validarCampos
];

// ==========================================
// 🌐 RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ==========================================

// 🔍 Obtener cursos públicos (sin autenticación requerida para algunos casos)
// Esta ruta podría ser útil para mostrar cursos públicos en landing page
router.get('/publicos', obtenerCursos);

// ==========================================
// 🔐 RUTAS PROTEGIDAS (CON AUTENTICACIÓN)
// ==========================================

// 📋 Obtener todos los cursos (con filtros y paginación)
// GET /api/curso?categoria=Cálculo&activo=true&page=1&limit=10&search=calculo
router.get('/',
    verifyJWT,
    obtenerCursos
);

// 📄 Obtener curso específico por ID
// GET /api/curso/658f56b795ce81274b56d3f2
router.get('/:id',
    verifyJWT,
    validarId,
    obtenerCursoPorId
);

// ➕ Crear nuevo curso (solo admin por ahora)
// POST /api/curso
router.post('/',
    verifyJWT,
    validacionesCrearCurso,
    crearCurso
);

// ✏️ Actualizar curso existente (admin y profesor_editor)
// PUT /api/curso/658f56b795ce81274b56d3f2
router.put('/:id',
    verifyJWT,
    validarId,
    validacionesActualizarCurso,
    actualizarCurso
);

// 🗑️ Eliminar curso (solo admin)
// DELETE /api/curso/658f56b795ce81274b56d3f2
router.delete('/:id',
    verifyJWT,
    validarId,
    eliminarCurso
);

// ==========================================
// 📊 RUTAS ADMINISTRATIVAS
// ==========================================

// 📈 Obtener estadísticas de cursos (solo admin)
// GET /api/curso/admin/stats
router.get('/admin/stats',
    verifyJWT,
    obtenerEstadisticasCursos
);

// ==========================================
// 🌱 RUTAS DE DESARROLLO
// ==========================================

// 🔧 Seed de datos (solo desarrollo y admin)
// POST /api/curso/dev/seed
router.post('/dev/seed',
    verifyJWT,
    seedCursos
);

// ==========================================
// 🎯 RUTAS ESPECÍFICAS POR ROL (FUTURAS)
// ==========================================

// TODO: Implementar rutas específicas para cada rol

// 👨‍🏫 Rutas para profesores
// GET /api/curso/profesor/mis-cursos - Cursos donde el usuario es profesor
// router.get('/profesor/mis-cursos', verifyJWT, obtenerMisCursos);

// 🎓 Rutas para estudiantes  
// GET /api/curso/estudiante/matriculados - Cursos donde el usuario está matriculado
// router.get('/estudiante/matriculados', verifyJWT, obtenerCursosMatriculados);

// ✏️ Rutas para profesor_editor
// GET /api/curso/editor/editables - Cursos que el usuario puede editar
// router.get('/editor/editables', verifyJWT, obtenerCursosEditables);

// 🔄 Rutas de estado (activar/desactivar, publicar/despublicar)
// PATCH /api/curso/:id/toggle-activo - Cambiar estado activo
// router.patch('/:id/toggle-activo', verifyJWT, validarId, toggleActivo);

// PATCH /api/curso/:id/toggle-publico - Cambiar estado público
// router.patch('/:id/toggle-publico', verifyJWT, validarId, togglePublico);

// ==========================================
// 📤 EXPORT ROUTER
// ==========================================

export default router;

// ==========================================
// 📋 DOCUMENTACIÓN DE ENDPOINTS
// ==========================================

/*
🌐 ENDPOINTS DISPONIBLES:

PÚBLICOS:
  GET    /api/curso/publicos           - Cursos públicos (sin auth)

AUTENTICADOS:
  GET    /api/curso                    - Listar cursos (filtros, paginación)
  GET    /api/curso/:id                - Obtener curso específico
  POST   /api/curso                    - Crear curso (admin)
  PUT    /api/curso/:id                - Actualizar curso (admin/profesor_editor)
  DELETE /api/curso/:id                - Eliminar curso (admin)

ADMINISTRATIVOS:
  GET    /api/curso/admin/stats        - Estadísticas (admin)

DESARROLLO:
  POST   /api/curso/dev/seed           - Seed datos (desarrollo + admin)

📋 PARÁMETROS DE CONSULTA (Query Params):
  ?categoria=Cálculo                   - Filtrar por categoría
  ?activo=true                         - Filtrar por estado activo
  ?publico=true                        - Filtrar por estado público
  ?semestre=2024-1                     - Filtrar por semestre
  ?año=2024                            - Filtrar por año
  ?search=calculo                      - Búsqueda por texto
  ?page=1                              - Página (paginación)
  ?limit=10                            - Elementos por página

🔐 PERMISOS POR ENDPOINT:
  GET (listar):     Todos los roles autenticados
  GET (específico): Todos los roles (según curso)
  POST (crear):     Admin (TODO: + profesores)
  PUT (editar):     Admin (TODO: + profesor_editor)
  DELETE:           Solo Admin
  Stats:            Solo Admin
  Seed:             Solo Admin + desarrollo

🎯 VALIDACIONES:
  - Todos los campos obligatorios validados
  - Formatos específicos (sigla, semestre, etc.)
  - Rangos numéricos apropiados
  - ObjectId válidos para parámetros
  - JWT válido para rutas protegidas
*/