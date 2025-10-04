// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult, param } from 'express-validator';
import { Types } from 'mongoose';

export const validarCampos = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            message: 'Errores de validación',
            errors: errors.mapped()
        });
    }

    next();
};

// ==========================================
// 🆔 MIDDLEWARE PARA VALIDAR ID MONGODB
// ==========================================

export const validarId = [
    param('id')
        .custom((value) => {
            if (!Types.ObjectId.isValid(value)) {
                throw new Error('ID de MongoDB inválido');
            }
            return true;
        }),
    validarCampos
];

// ==========================================
// 📝 VALIDACIONES ESPECÍFICAS PARA CURSOS
// ==========================================

export const validarCrearCurso = [
    // Validaciones básicas
    param('sigla')
        .notEmpty()
        .withMessage('La sigla es obligatoria')
        .isLength({ min: 3, max: 10 })
        .withMessage('La sigla debe tener entre 3 y 10 caracteres')
        .matches(/^[A-Z]{3,4}[0-9]{3,4}$/)
        .withMessage('Formato de sigla inválido (ej: MAT1610)'),

    param('nombre')
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 5, max: 100 })
        .withMessage('El nombre debe tener entre 5 y 100 caracteres'),

    param('descripcion')
        .notEmpty()
        .withMessage('La descripción es obligatoria')
        .isLength({ min: 20, max: 500 })
        .withMessage('La descripción debe tener entre 20 y 500 caracteres'),

    param('categoria')
        .notEmpty()
        .withMessage('La categoría es obligatoria')
        .isIn(['Cálculo', 'Álgebra', 'Estadística', 'Geometría', 'Análisis', 'Matemática Aplicada', 'Otros'])
        .withMessage('Categoría no válida'),

    param('creditos')
        .isInt({ min: 1, max: 12 })
        .withMessage('Los créditos deben ser un número entero entre 1 y 12'),

    param('semestre')
        .matches(/^20[0-9]{2}-[12]$/)
        .withMessage('Formato de semestre inválido (ej: 2024-1)'),

    param('año')
        .isInt({ min: 2020, max: 2030 })
        .withMessage('El año debe estar entre 2020 y 2030'),

    validarCampos
];

export const validarActualizarCurso = [
    // Validaciones opcionales para actualización
    param('sigla')
        .optional()
        .isLength({ min: 3, max: 10 })
        .withMessage('La sigla debe tener entre 3 y 10 caracteres')
        .matches(/^[A-Z]{3,4}[0-9]{3,4}$/)
        .withMessage('Formato de sigla inválido (ej: MAT1610)'),

    param('nombre')
        .optional()
        .isLength({ min: 5, max: 100 })
        .withMessage('El nombre debe tener entre 5 y 100 caracteres'),

    param('descripcion')
        .optional()
        .isLength({ min: 20, max: 500 })
        .withMessage('La descripción debe tener entre 20 y 500 caracteres'),

    param('categoria')
        .optional()
        .isIn(['Cálculo', 'Álgebra', 'Estadística', 'Geometría', 'Análisis', 'Matemática Aplicada', 'Otros'])
        .withMessage('Categoría no válida'),

    param('creditos')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage('Los créditos deben ser un número entero entre 1 y 12'),

    param('semestre')
        .optional()
        .matches(/^20[0-9]{2}-[12]$/)
        .withMessage('Formato de semestre inválido (ej: 2024-1)'),

    param('año')
        .optional()
        .isInt({ min: 2020, max: 2030 })
        .withMessage('El año debe estar entre 2020 y 2030'),

    param('activo')
        .optional()
        .isBoolean()
        .withMessage('activo debe ser un booleano'),

    param('publico')
        .optional()
        .isBoolean()
        .withMessage('publico debe ser un booleano'),

    validarCampos
];