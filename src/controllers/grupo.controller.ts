// src/controllers/grupo.controller.ts
// ==========================================
// 👥 CONTROLADOR DE GRUPOS - MATUC v4.0
// ==========================================

import { Request, Response } from 'express';
import Grupo from '../models/Grupo';
import Matricula from '../models/Matricula';
import { Types } from 'mongoose';

// ==========================================
// ➕ CREAR GRUPO
// ==========================================

export const crearGrupo = async (req: Request, res: Response) => {
    try {
        const { cid, numero, nombre, descripcion, cupoMaximo, horarios } = req.body;

        // Verificar que no exista un grupo activo con el mismo número en el curso
        const grupoExistente = await Grupo.findOne({
            cid: new Types.ObjectId(cid),
            numero,
            activo: true
        });

        if (grupoExistente) {
            return res.status(400).json({
                ok: false,
                message: `Ya existe un grupo ${numero} activo en este curso`
            });
        }

        // Crear nuevo grupo
        const nuevoGrupo = new Grupo({
            cid: new Types.ObjectId(cid),
            numero,
            nombre,
            descripcion,
            cupoMaximo,
            horarios: horarios || [],
            activo: true
        });

        await nuevoGrupo.save();

        // Poblar datos del curso
        await nuevoGrupo.populate('cid', 'nombre sigla semestre');

        return res.status(201).json({
            ok: true,
            message: 'Grupo creado exitosamente',
            grupo: nuevoGrupo
        });

    } catch (error: any) {
        console.error('Error al crear grupo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al crear el grupo',
            error: error.message
        });
    }
};

// ==========================================
// 📋 OBTENER GRUPOS (con filtros y paginación)
// ==========================================

export const obtenerGrupos = async (req: Request, res: Response) => {
    try {
        const { cid, activo, page = 1, limit = 10 } = req.query;

        // Construir filtros
        const filtros: any = {};
        if (cid) filtros.cid = new Types.ObjectId(cid as string);
        if (activo !== undefined) filtros.activo = activo === 'true';

        // Paginación
        const skip = (Number(page) - 1) * Number(limit);

        // Consulta con populate
        const [grupos, total] = await Promise.all([
            Grupo.find(filtros)
                .populate('cid', 'nombre sigla categoria semestre')
                .sort({ cid: 1, numero: 1 })
                .skip(skip)
                .limit(Number(limit)),
            Grupo.countDocuments(filtros)
        ]);

        // Agregar cantidad de estudiantes a cada grupo
        const gruposConEstadisticas = await Promise.all(
            grupos.map(async (grupo) => {
                const cantidadEstudiantes = await Grupo.contarEstudiantes(grupo.gid.toString());
                return {
                    ...grupo.toJSON(),
                    cantidadEstudiantes
                };
            })
        );

        return res.json({
            ok: true,
            grupos: gruposConEstadisticas,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });

    } catch (error: any) {
        console.error('Error al obtener grupos:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener los grupos',
            error: error.message
        });
    }
};

// ==========================================
// 📄 OBTENER GRUPO POR ID
// ==========================================

export const obtenerGrupoPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const grupo = await Grupo.findOne({ gid: new Types.ObjectId(id) })
            .populate('cid', 'nombre sigla categoria semestre descripcion');

        if (!grupo) {
            return res.status(404).json({
                ok: false,
                message: 'Grupo no encontrado'
            });
        }

        // Obtener cantidad de estudiantes
        const cantidadEstudiantes = await Grupo.contarEstudiantes(id);

        // Verificar si está lleno
        const estaLleno = await grupo.estaLleno();

        return res.json({
            ok: true,
            grupo: {
                ...grupo.toJSON(),
                cantidadEstudiantes,
                estaLleno
            }
        });

    } catch (error: any) {
        console.error('Error al obtener grupo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el grupo',
            error: error.message
        });
    }
};

// ==========================================
// 📚 OBTENER GRUPOS DE UN CURSO
// ==========================================

export const obtenerGruposDeCurso = async (req: Request, res: Response) => {
    try {
        const { cursoId } = req.params;
        const { activo = 'true' } = req.query;

        const filtros: any = {
            cid: new Types.ObjectId(cursoId)
        };

        if (activo !== undefined) {
            filtros.activo = activo === 'true';
        }

        const grupos = await Grupo.find(filtros)
            .sort({ numero: 1 });

        // Agregar estadísticas a cada grupo
        const gruposConEstadisticas = await Promise.all(
            grupos.map(async (grupo) => {
                const cantidadEstudiantes = await Grupo.contarEstudiantes(grupo.gid.toString());
                const estaLleno = await grupo.estaLleno();

                return {
                    ...grupo.toJSON(),
                    cantidadEstudiantes,
                    estaLleno,
                    cupoDisponible: grupo.cupoMaximo ? grupo.cupoMaximo - cantidadEstudiantes : null
                };
            })
        );

        return res.json({
            ok: true,
            grupos: gruposConEstadisticas,
            total: grupos.length
        });

    } catch (error: any) {
        console.error('Error al obtener grupos del curso:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener los grupos del curso',
            error: error.message
        });
    }
};

// ==========================================
// ✏️ ACTUALIZAR GRUPO
// ==========================================

export const actualizarGrupo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { numero, nombre, descripcion, cupoMaximo, horarios, activo } = req.body;

        const grupo = await Grupo.findOne({ gid: new Types.ObjectId(id) });

        if (!grupo) {
            return res.status(404).json({
                ok: false,
                message: 'Grupo no encontrado'
            });
        }

        // Si se cambia el número, verificar que no exista otro grupo con ese número
        if (numero !== undefined && numero !== grupo.numero) {
            const grupoConMismoNumero = await Grupo.findOne({
                cid: grupo.cid,
                numero,
                activo: true,
                gid: { $ne: grupo.gid }
            });

            if (grupoConMismoNumero) {
                return res.status(400).json({
                    ok: false,
                    message: `Ya existe un grupo ${numero} activo en este curso`
                });
            }

            grupo.numero = numero;
        }

        // Actualizar campos
        if (nombre !== undefined) grupo.nombre = nombre;
        if (descripcion !== undefined) grupo.descripcion = descripcion;
        if (cupoMaximo !== undefined) grupo.cupoMaximo = cupoMaximo;
        if (horarios !== undefined) grupo.horarios = horarios;
        if (activo !== undefined) grupo.activo = activo;

        await grupo.save();

        // Poblar datos del curso
        await grupo.populate('cid', 'nombre sigla semestre');

        return res.json({
            ok: true,
            message: 'Grupo actualizado exitosamente',
            grupo
        });

    } catch (error: any) {
        console.error('Error al actualizar grupo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar el grupo',
            error: error.message
        });
    }
};

// ==========================================
// 🗑️ ELIMINAR GRUPO (Soft Delete)
// ==========================================

export const eliminarGrupo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const grupo = await Grupo.findOne({ gid: new Types.ObjectId(id) });

        if (!grupo) {
            return res.status(404).json({
                ok: false,
                message: 'Grupo no encontrado'
            });
        }

        // Verificar si hay estudiantes matriculados
        const cantidadEstudiantes = await Grupo.contarEstudiantes(id);

        if (cantidadEstudiantes > 0) {
            return res.status(400).json({
                ok: false,
                message: `No se puede eliminar el grupo porque tiene ${cantidadEstudiantes} estudiante(s) matriculado(s)`,
                cantidadEstudiantes
            });
        }

        // Desactivar grupo (soft delete)
        grupo.activo = false;
        await grupo.save();

        return res.json({
            ok: true,
            message: 'Grupo desactivado exitosamente',
            grupo
        });

    } catch (error: any) {
        console.error('Error al eliminar grupo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar el grupo',
            error: error.message
        });
    }
};

// ==========================================
// 📊 OBTENER ESTADÍSTICAS DEL GRUPO
// ==========================================

export const obtenerEstadisticasGrupo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const grupo = await Grupo.findOne({ gid: new Types.ObjectId(id) })
            .populate('cid', 'nombre sigla');

        if (!grupo) {
            return res.status(404).json({
                ok: false,
                message: 'Grupo no encontrado'
            });
        }

        // Obtener estadísticas
        const cantidadEstudiantes = await Grupo.contarEstudiantes(id);
        const estaLleno = await grupo.estaLleno();

        // Obtener distribución por rol
        const [estudiantes, ayudantes, profesores] = await Promise.all([
            Matricula.countDocuments({
                gid: new Types.ObjectId(id),
                rol: 'estudiante',
                activo: true
            }),
            Matricula.countDocuments({
                gid: new Types.ObjectId(id),
                rol: 'ayudante',
                activo: true
            }),
            Matricula.countDocuments({
                gid: new Types.ObjectId(id),
                rol: { $in: ['profesor', 'profesor_editor'] },
                activo: true
            })
        ]);

        const estadisticas = {
            grupo: grupo.toJSON(),
            cantidadEstudiantes,
            cupoMaximo: grupo.cupoMaximo,
            cupoDisponible: grupo.cupoMaximo ? grupo.cupoMaximo - cantidadEstudiantes : null,
            estaLleno,
            distribucionPorRol: {
                estudiantes,
                ayudantes,
                profesores,
                total: estudiantes + ayudantes + profesores
            },
            porcentajeOcupacion: grupo.cupoMaximo
                ? Math.round((cantidadEstudiantes / grupo.cupoMaximo) * 100)
                : null
        };

        return res.json({
            ok: true,
            estadisticas
        });

    } catch (error: any) {
        console.error('Error al obtener estadísticas:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener las estadísticas del grupo',
            error: error.message
        });
    }
};