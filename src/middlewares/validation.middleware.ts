import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

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