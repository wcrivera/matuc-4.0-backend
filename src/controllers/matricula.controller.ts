// src/controllers/matricula.controller.ts
// ==========================================
// 🎓 CONTROLADOR DE MATRÍCULA - MATUC v4.0
// ==========================================

import { Request, Response } from 'express';
import Matricula from '../models/Matricula';
import Grupo from '../models/Grupo';
import { Types } from 'mongoose';



// ==========================================
// ➕ CREAR MATRÍCULA
// ==========================================

export const crearMatricula = async (req: Request, res: Response) => {

    try {
        const { uid, cid, gid, rol, notas } = req.body;
        const matriculadoPor = req.usuario?.uid; // Del middleware de auth

        // Verificar si ya existe una matrícula activa
        const matriculaExistente = await Matricula.findOne({
            uid: Types.ObjectId.createFromHexString(uid),
            cid: Types.ObjectId.createFromHexString(cid),
            activo: true
        });

        if (matriculaExistente) {
            return res.status(400).json({
                ok: false,
                message: 'El usuario ya está matriculado en este curso'
            });
        }

        // Si se especifica un grupo, verificar que existe y tiene cupo
        if (gid) {
            const grupo = await Grupo.findById(gid);

            if (!grupo) {
                return res.status(404).json({
                    ok: false,
                    message: 'El grupo especificado no existe'
                });
            }

            if (!grupo.activo) {
                return res.status(400).json({
                    ok: false,
                    message: 'El grupo no está activo'
                });
            }

            // Verificar si el grupo pertenece al curso
            if (grupo.cid.toString() !== cid) {
                return res.status(400).json({
                    ok: false,
                    message: 'El grupo no pertenece al curso especificado'
                });
            }

            // Verificar cupo disponible
            const tieneCupo = await Grupo.tieneCupoDisponible(gid);
            if (!tieneCupo) {
                return res.status(400).json({
                    ok: false,
                    message: 'El grupo no tiene cupo disponible'
                });
            }
        }

        // Crear nueva matrícula
        const nuevaMatricula = new Matricula({
            uid: Types.ObjectId.createFromHexString(uid),
            cid: Types.ObjectId.createFromHexString(cid),
            gid: gid ? Types.ObjectId.createFromHexString(gid) : undefined,
            rol,
            matriculadoPor: matriculadoPor ? Types.ObjectId.createFromHexString(matriculadoPor) : undefined,
            notas,
            activo: true,
            fechaMatricula: new Date()
        });

        await nuevaMatricula.save();

        // Poblar datos para respuesta
        await nuevaMatricula.populate([
            { path: 'uid', select: 'nombre apellido email avatar' },
            { path: 'cid', select: 'nombre sigla categoria semestre' },
            { path: 'gid', select: 'numero nombre' }
        ]);

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
// 📋 OBTENER MATRÍCULAS (con filtros y paginación)
// ==========================================

export const obtenerMatriculas = async (req: Request, res: Response) => {
    try {
        const { uid, cid, gid, rol, activo, page = 1, limit = 10 } = req.query;

        // Construir filtros
        const filtros: any = {};
        if (uid) filtros.uid = new Types.ObjectId(uid as string);
        if (cid) filtros.cid = new Types.ObjectId(cid as string);
        if (gid) filtros.gid = new Types.ObjectId(gid as string);
        if (rol) filtros.rol = rol;
        if (activo !== undefined) filtros.activo = activo === 'true';

        // Paginación
        const skip = (Number(page) - 1) * Number(limit);

        // Consulta con populate
        const [matriculas, total] = await Promise.all([
            Matricula.find(filtros)
                .populate('uid', 'nombre apellido email avatar')
                .populate('cid', 'nombre sigla categoria semestre')
                .populate('gid', 'numero nombre')
                .populate('matriculadoPor', 'nombre apellido')
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
            .populate('gid', 'numero nombre descripcion cupoMaximo')
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
        const { rol, activo, notas, gid } = req.body;

        const matricula = await Matricula.findOne({ mid: new Types.ObjectId(id) });

        if (!matricula) {
            return res.status(404).json({
                ok: false,
                message: 'Matrícula no encontrada'
            });
        }

        // Actualizar rol
        if (rol !== undefined) {
            matricula.rol = rol;
        }

        // Actualizar estado activo
        if (activo !== undefined) {
            if (activo && !matricula.activo) {
                // Reactivar
                await matricula.reactivar();
            } else if (!activo && matricula.activo) {
                // Dar de baja
                await matricula.darDeBaja();
            }
        }

        // Actualizar notas
        if (notas !== undefined) {
            matricula.notas = notas;
        }

        // Cambiar grupo
        if (gid !== undefined) {
            if (gid === null) {
                matricula.gid = undefined;
            } else {
                const grupo = await Grupo.findOne({ gid: new Types.ObjectId(gid) });

                if (!grupo) {
                    return res.status(404).json({
                        ok: false,
                        message: 'El grupo especificado no existe'
                    });
                }

                if (grupo.cid.toString() !== matricula.cid.toString()) {
                    return res.status(400).json({
                        ok: false,
                        message: 'El grupo no pertenece al curso de la matrícula'
                    });
                }

                const tieneCupo = await Grupo.tieneCupoDisponible(gid);
                if (!tieneCupo) {
                    return res.status(400).json({
                        ok: false,
                        message: 'El grupo no tiene cupo disponible'
                    });
                }

                matricula.gid = new Types.ObjectId(gid);
            }
        }

        await matricula.save();

        // Poblar datos para respuesta
        await matricula.populate([
            { path: 'uid', select: 'nombre apellido email avatar' },
            { path: 'cid', select: 'nombre sigla categoria semestre' },
            { path: 'gid', select: 'numero nombre' }
        ]);

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
// 🗑️ ELIMINAR MATRÍCULA (Soft Delete)
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

        // Dar de baja (soft delete)
        await matricula.darDeBaja();

        return res.json({
            ok: true,
            message: 'Matrícula dada de baja exitosamente',
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
// 📚 OBTENER MIS CURSOS (Usuario autenticado)
// ==========================================

export const obtenerMisCursos = async (req: Request, res: Response) => {

    try {
        const uid = req.usuario?.uid; // Del middleware de auth

        if (!uid) {
            return res.status(401).json({
                ok: false,
                message: 'Usuario no autenticado'
            });
        }

        const matriculas = await Matricula.aggregate([
            {
                $match: {
                    uid: new Types.ObjectId(uid),
                    activo: true
                }
            },
            {
                $lookup: {
                    from: 'cursos',  // Nombre de la colección en MongoDB
                    localField: 'cid',
                    foreignField: '_id',
                    as: 'curso'
                }
            },
            {
                $lookup: {
                    from: 'grupos',  // Nombre de la colección en MongoDB
                    localField: 'gid',
                    foreignField: '_id',
                    as: 'grupo'
                }
            },
            {
                $unwind: {
                    path: '$curso',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$grupo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,  // No incluir el _id raíz
                    // Objeto curso
                    curso: {
                        cid: '$curso._id',
                        nombre: '$curso.nombre',
                        sigla: '$curso.sigla',
                        categoria: '$curso.categoria',
                        semestre: '$curso.semestre',
                        año: '$curso.año',
                        descripcion: '$curso.descripcion',
                        activo: '$curso.activo'
                    },
                    // Objeto grupo
                    grupo: {
                        gid: '$grupo._id',
                        numero: '$grupo.numero',
                        nombre: '$grupo.nombre'
                    },
                    // Objeto matrícula
                    matricula: {
                        mid: '$_id',
                        uid: '$uid',
                        cid: '$cid',
                        gid: '$gid',
                        rol: '$rol',
                        activo: '$activo',
                        fechaMatricula: '$fechaMatricula',
                        fechaBaja: '$fechaBaja',
                        matriculadoPor: '$matriculadoPor',
                        notas: '$notas'
                    }
                }
            },
            {
                $sort: { 'matricula.fechaMatricula': -1 }
            }
        ]);

        return res.json({
            ok: true,
            cursos: matriculas,
            total: matriculas.length
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
        const { gid, activo = 'true' } = req.query;

        const filtros: any = {
            cid: new Types.ObjectId(cursoId),
            rol: 'estudiante',
            activo: activo === 'true'
        };

        if (gid) {
            filtros.gid = new Types.ObjectId(gid as string);
        }

        const estudiantes = await Matricula.find(filtros)
            .populate('uid', 'nombre apellido email avatar')
            .populate('gid', 'numero nombre')
            .sort({ 'uid.apellido': 1, 'uid.nombre': 1 });

        return res.json({
            ok: true,
            estudiantes,
            total: estudiantes.length
        });

    } catch (error: any) {
        console.error('Error al obtener estudiantes:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener los estudiantes',
            error: error.message
        });
    }
};

// ==========================================
// 🔍 VERIFICAR MATRÍCULA EN CURSO
// ==========================================

export const verificarMatricula = async (req: Request, res: Response) => {
    try {
        const { cursoId } = req.params;
        const uid = req.usuario?.uid; // Del middleware de auth

        if (!uid) {
            return res.status(401).json({
                ok: false,
                message: 'Usuario no autenticado'
            });
        }

        const matricula = await Matricula.findOne({
            uid: new Types.ObjectId(uid),
            cid: new Types.ObjectId(cursoId),
            activo: true
        })
            .populate('gid', 'numero nombre');

        if (!matricula) {
            return res.json({
                ok: true,
                matriculado: false,
                matricula: null
            });
        }

        return res.json({
            ok: true,
            matriculado: true,
            matricula
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

// ==========================================
// 🔄 CAMBIAR ESTUDIANTE DE GRUPO
// ==========================================

export const cambiarGrupo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { gid } = req.body;

        const matricula = await Matricula.findOne({ mid: new Types.ObjectId(id) });

        if (!matricula) {
            return res.status(404).json({
                ok: false,
                message: 'Matrícula no encontrada'
            });
        }

        if (!gid) {
            return res.status(400).json({
                ok: false,
                message: 'El ID del grupo es requerido'
            });
        }

        const grupo = await Grupo.findOne({ gid: new Types.ObjectId(gid) });

        if (!grupo) {
            return res.status(404).json({
                ok: false,
                message: 'El grupo especificado no existe'
            });
        }

        if (grupo.cid.toString() !== matricula.cid.toString()) {
            return res.status(400).json({
                ok: false,
                message: 'El grupo no pertenece al curso de la matrícula'
            });
        }

        const tieneCupo = await Grupo.tieneCupoDisponible(gid);
        if (!tieneCupo) {
            return res.status(400).json({
                ok: false,
                message: 'El grupo no tiene cupo disponible'
            });
        }

        matricula.gid = new Types.ObjectId(gid);
        await matricula.save();

        await matricula.populate([
            { path: 'uid', select: 'nombre apellido email' },
            { path: 'gid', select: 'numero nombre' }
        ]);

        return res.json({
            ok: true,
            message: 'Grupo actualizado exitosamente',
            matricula
        });

    } catch (error: any) {
        console.error('Error al cambiar grupo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al cambiar el grupo',
            error: error.message
        });
    }
};

// ==========================================
// 👥 OBTENER ESTUDIANTES DE UN GRUPO
// ==========================================

export const obtenerEstudiantesDeGrupo = async (req: Request, res: Response) => {
    try {
        const { grupoId } = req.params;

        const estudiantes = await Matricula.find({
            gid: new Types.ObjectId(grupoId),
            rol: 'estudiante',
            activo: true
        })
            .populate('uid', 'nombre apellido email avatar')
            .sort({ 'uid.apellido': 1, 'uid.nombre': 1 });

        return res.json({
            ok: true,
            estudiantes,
            total: estudiantes.length
        });

    } catch (error: any) {
        console.error('Error al obtener estudiantes del grupo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener los estudiantes del grupo',
            error: error.message
        });
    }
};