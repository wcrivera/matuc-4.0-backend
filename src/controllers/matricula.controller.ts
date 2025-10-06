// src/controllers/matricula.controller.ts (Backend)
// ==========================================
// 🎓 CONTROLADOR DE MATRÍCULA
// ==========================================

import { Request, Response } from 'express';
import Matricula from '../models/Matricula';
import { Types } from 'mongoose';

// ==========================================
// ➕ CREAR MATRÍCULA
// ==========================================

export const crearMatricula = async (req: Request, res: Response) => {
    try {
        const { uid, cid, rol, notas } = req.body;
        const matriculadoPor = req.uid; // Del middleware de auth

        // Verificar si ya existe una matrícula activa
        const matriculaExistente = await Matricula.findOne({
            uid: new Types.ObjectId(uid),
            cid: new Types.ObjectId(cid),
            activo: true
        });

        if (matriculaExistente) {
            return res.status(400).json({
                ok: false,
                message: 'El usuario ya está matriculado en este curso'
            });
        }

        // Crear nueva matrícula
        const nuevaMatricula = new Matricula({
            uid: new Types.ObjectId(uid),
            cid: new Types.ObjectId(cid),
            rol,
            matriculadoPor: matriculadoPor ? new Types.ObjectId(matriculadoPor) : undefined,
            notas,
            activo: true,
            fechaMatricula: new Date()
        });

        await nuevaMatricula.save();

        return res.status(201).json({
            ok: true,
            message: 'Matrícula creada exitosamente',
            matricula: nuevaMatricula
        });

    } catch (error: any) {
        console.error('Error al crear matrícula:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al crear la matrícula',
            error: error.message
        });
    }
};

// ==========================================
// 📋 OBTENER MATRÍCULAS (con filtros)
// ==========================================

export const obtenerMatriculas = async (req: Request, res: Response) => {
    try {
        const { uid, cid, rol, activo, page = 1, limit = 10 } = req.query;

        // Construir filtros
        const filtros: any = {};
        if (uid) filtros.uid = new Types.ObjectId(uid as string);
        if (cid) filtros.cid = new Types.ObjectId(cid as string);
        if (rol) filtros.rol = rol;
        if (activo !== undefined) filtros.activo = activo === 'true';

        // Paginación
        const skip = (Number(page) - 1) * Number(limit);

        // Consulta con populate
        const [matriculas, total] = await Promise.all([
            Matricula.find(filtros)
                .populate('uid', 'nombre apellido email avatar')
                .populate('cid', 'nombre sigla categoria semestre')
                .sort({ fechaMatricula: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Matricula.countDocuments(filtros)
        ]);

        return res.json({
            ok: true,
            matriculas,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });

    } catch (error: any) {
        console.error('Error al obtener matrículas:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener las matrículas',
            error: error.message
        });
    }
};

// ==========================================
// 📄 OBTENER MATRÍCULA POR ID
// ==========================================

export const obtenerMatriculaPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const matricula = await Matricula.findOne({ mid: new Types.ObjectId(id) })
            .populate('uid', 'nombre apellido email avatar')
            .populate('cid', 'nombre sigla categoria semestre descripcion')
            .populate('matriculadoPor', 'nombre apellido');

        if (!matricula) {
            return res.status(404).json({
                ok: false,
                message: 'Matrícula no encontrada'
            });
        }

        return res.json({
            ok: true,
            matricula
        });

    } catch (error: any) {
        console.error('Error al obtener matrícula:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener la matrícula',
            error: error.message
        });
    }
};

// ==========================================
// ✏️ ACTUALIZAR MATRÍCULA
// ==========================================

export const actualizarMatricula = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rol, activo, notas } = req.body;

        const matricula = await Matricula.findOne({ mid: new Types.ObjectId(id) });

        if (!matricula) {
            return res.status(404).json({
                ok: false,
                message: 'Matrícula no encontrada'
            });
        }

        // Actualizar campos
        if (rol !== undefined) matricula.rol = rol;
        if (activo !== undefined) {
            matricula.activo = activo;
            if (!activo) {
                matricula.fechaBaja = new Date();
            } else {
                matricula.fechaBaja = undefined;
            }
        }
        if (notas !== undefined) matricula.notas = notas;

        await matricula.save();

        return res.json({
            ok: true,
            message: 'Matrícula actualizada exitosamente',
            matricula
        });

    } catch (error: any) {
        console.error('Error al actualizar matrícula:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar la matrícula',
            error: error.message
        });
    }
};

// ==========================================
// 🗑️ ELIMINAR MATRÍCULA (dar de baja)
// ==========================================

export const eliminarMatricula = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const matricula = await Matricula.findOne({ mid: new Types.ObjectId(id) });

        if (!matricula) {
            return res.status(404).json({
                ok: false,
                message: 'Matrícula no encontrada'
            });
        }

        // Dar de baja (no eliminar físicamente)
        matricula.activo = false;
        matricula.fechaBaja = new Date();
        await matricula.save();

        return res.json({
            ok: true,
            message: 'Matrícula eliminada exitosamente',
            matricula
        });

    } catch (error: any) {
        console.error('Error al eliminar matrícula:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar la matrícula',
            error: error.message
        });
    }
};

// ==========================================
// 📚 OBTENER MIS CURSOS
// ==========================================

export const obtenerMisCursos = async (req: Request, res: Response) => {
    try {
        const uid = req.uid;

        if (!uid) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        const { activo = 'true' } = req.query;

        // Filtros
        const filtros: any = { uid: new Types.ObjectId(uid) };
        if (activo !== undefined) filtros.activo = activo === 'true';

        // Obtener matrículas con datos del curso
        const matriculas = await Matricula.find(filtros)
            .populate('cid', 'nombre sigla categoria semestre año descripcion activo publico estadisticas')
            .sort({ fechaMatricula: -1 });

        // Transformar para incluir el rol
        const cursos = matriculas.map(m => ({
            ...m.cid,
            rol: m.rol,
            fechaMatricula: m.fechaMatricula,
            mid: m.mid
        }));

        return res.json({
            ok: true,
            cursos,
            total: cursos.length
        });

    } catch (error: any) {
        console.error('Error al obtener mis cursos:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener los cursos',
            error: error.message
        });
    }
};

// ==========================================
// 👥 OBTENER ESTUDIANTES DE UN CURSO
// ==========================================

export const obtenerEstudiantesDeCurso = async (req: Request, res: Response) => {
    try {
        const { cursoId } = req.params;
        const { rol, activo = 'true' } = req.query;

        // Construir filtros
        const filtros: any = {
            cid: new Types.ObjectId(cursoId),
            activo: activo === 'true'
        };

        if (rol) {
            filtros.rol = rol;
        }

        // Obtener matrículas con datos del usuario
        const matriculas = await Matricula.find(filtros)
            .populate('uid', 'nombre apellido email avatar ultimaConexion')
            .sort({ rol: 1, fechaMatricula: 1 });

        // Agrupar por rol
        const porRol = {
            estudiantes: matriculas.filter(m => m.rol === 'estudiante'),
            ayudantes: matriculas.filter(m => m.rol === 'ayudante'),
            profesores: matriculas.filter(m => m.rol === 'profesor' || m.rol === 'profesor_editor')
        };

        return res.json({
            ok: true,
            matriculas,
            porRol,
            total: matriculas.length,
            totales: {
                estudiantes: porRol.estudiantes.length,
                ayudantes: porRol.ayudantes.length,
                profesores: porRol.profesores.length
            }
        });

    } catch (error: any) {
        console.error('Error al obtener estudiantes del curso:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener los estudiantes',
            error: error.message
        });
    }
};

// ==========================================
// 🔍 VERIFICAR MATRÍCULA
// ==========================================

export const verificarMatricula = async (req: Request, res: Response) => {
    try {
        const { cursoId } = req.params;
        const uid = req.uid;

        if (!uid) {
            return res.status(401).json({
                ok: false,
                message: 'No autenticado'
            });
        }

        // Buscar matrícula activa
        const matricula = await Matricula.findOne({
            uid: new Types.ObjectId(uid),
            cid: new Types.ObjectId(cursoId),
            activo: true
        });

        if (!matricula) {
            return res.json({
                ok: true,
                matriculado: false,
                rol: null
            });
        }

        return res.json({
            ok: true,
            matriculado: true,
            rol: matricula.rol,
            mid: matricula.mid,
            fechaMatricula: matricula.fechaMatricula
        });

    } catch (error: any) {
        console.error('Error al verificar matrícula:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al verificar la matrícula',
            error: error.message
        });
    }
};