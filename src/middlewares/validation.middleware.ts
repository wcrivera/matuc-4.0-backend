// src/middlewares/validation.middleware.ts (Backend)
// ==========================================
// ✅ MIDDLEWARE DE VALIDACIÓN CON EXPRESS-VALIDATOR
// ==========================================

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// ==========================================
// 🔍 VALIDAR CAMPOS DEL REQUEST
// ==========================================

export const validarCampos = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            message: 'Errores de validación',
            errors: errors.array().map(err => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg,
                value: err.type === 'field' ? err.value : undefined
            }))
        });
    }

    next();
};

// ==========================================
// 📋 VALIDAR SOLO ALGUNOS CAMPOS (PARCIAL)
// ==========================================

export const validarCamposParcial = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // En validación parcial, solo mostramos advertencias pero dejamos continuar
        console.warn('Advertencias de validación:', errors.array());
    }

    next();
};

// ==========================================
// 🔒 VALIDAR QUE EXISTEN CAMPOS REQUERIDOS
// ==========================================

export const camposRequeridos = (campos: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const camposFaltantes: string[] = [];

        campos.forEach(campo => {
            const valor = req.body[campo];
            if (valor === undefined || valor === null || valor === '') {
                camposFaltantes.push(campo);
            }
        });

        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                ok: false,
                message: 'Faltan campos requeridos',
                camposFaltantes
            });
        }

        next();
    };
};

// ==========================================
// 📧 VALIDAR FORMATO DE EMAIL
// ==========================================

export const validarEmail = (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({
            ok: false,
            message: 'El email es requerido'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            ok: false,
            message: 'Formato de email inválido'
        });
    }

    next();
};

// ==========================================
// 🔐 VALIDAR FORMATO DE MONGODB ID
// ==========================================

export const validarMongoId = (paramName: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[paramName];

        if (!id) {
            return res.status(400).json({
                ok: false,
                message: `El parámetro ${paramName} es requerido`
            });
        }

        // Validar formato de MongoDB ObjectId (24 caracteres hexadecimales)
        const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

        if (!mongoIdRegex.test(id)) {
            return res.status(400).json({
                ok: false,
                message: `El ${paramName} proporcionado no es válido`,
                id
            });
        }

        next();
    };
};

// ==========================================
// 📅 VALIDAR FORMATO DE FECHA
// ==========================================

export const validarFecha = (campo: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const fecha = req.body[campo];

        if (!fecha) {
            return next(); // Continuar si no está presente (puede ser opcional)
        }

        const fechaObj = new Date(fecha);

        if (isNaN(fechaObj.getTime())) {
            return res.status(400).json({
                ok: false,
                message: `El campo ${campo} no es una fecha válida`,
                valor: fecha
            });
        }

        next();
    };
};

// ==========================================
// 🔢 VALIDAR RANGO NUMÉRICO
// ==========================================

export const validarRango = (campo: string, min: number, max: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const valor = req.body[campo];

        if (valor === undefined || valor === null) {
            return next(); // Continuar si no está presente
        }

        const numero = Number(valor);

        if (isNaN(numero)) {
            return res.status(400).json({
                ok: false,
                message: `El campo ${campo} debe ser un número`,
                valor
            });
        }

        if (numero < min || numero > max) {
            return res.status(400).json({
                ok: false,
                message: `El campo ${campo} debe estar entre ${min} y ${max}`,
                valor: numero
            });
        }

        next();
    };
};

// ==========================================
// 📏 VALIDAR LONGITUD DE STRING
// ==========================================

export const validarLongitud = (campo: string, min: number, max: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const valor = req.body[campo];

        if (!valor) {
            return next(); // Continuar si no está presente
        }

        const longitud = String(valor).length;

        if (longitud < min || longitud > max) {
            return res.status(400).json({
                ok: false,
                message: `El campo ${campo} debe tener entre ${min} y ${max} caracteres`,
                longitud
            });
        }

        next();
    };
};

// ==========================================
// 🎯 VALIDAR VALORES PERMITIDOS (ENUM)
// ==========================================

export const validarEnum = (campo: string, valoresPermitidos: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const valor = req.body[campo];

        if (!valor) {
            return next(); // Continuar si no está presente
        }

        if (!valoresPermitidos.includes(valor)) {
            return res.status(400).json({
                ok: false,
                message: `El campo ${campo} debe ser uno de: ${valoresPermitidos.join(', ')}`,
                valor,
                valoresPermitidos
            });
        }

        next();
    };
};

// ==========================================
// 🧹 SANITIZAR Y LIMPIAR DATOS
// ==========================================

export const sanitizarDatos = (req: Request, res: Response, next: NextFunction) => {
    // Eliminar campos vacíos
    Object.keys(req.body).forEach(key => {
        if (req.body[key] === '' || req.body[key] === null) {
            delete req.body[key];
        }

        // Trim strings
        if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].trim();
        }
    });

    next();
};

// ==========================================
// 🔒 VALIDAR QUE NO EXISTEN CAMPOS EXTRA
// ==========================================

export const validarCamposPermitidos = (camposPermitidos: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const camposRecibidos = Object.keys(req.body);
        const camposExtra = camposRecibidos.filter(campo => !camposPermitidos.includes(campo));

        if (camposExtra.length > 0) {
            return res.status(400).json({
                ok: false,
                message: 'Se enviaron campos no permitidos',
                camposExtra,
                camposPermitidos
            });
        }

        next();
    };
};