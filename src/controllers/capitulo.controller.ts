// src/controllers/capitulo.controller.ts
// ==========================================
// 🎮 CONTROLADOR DE CAPÍTULOS - MATUC v4.0
// ==========================================

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Capitulo from '../models/Capitulo';
import Curso from '../models/Curso';
import Grupo from '../models/Grupo';

// ==========================================
// 📚 CONTROLADORES DE CAPÍTULOS
// ==========================================

/**
 * Obtener todos los capítulos de un curso
 * GET /api/capitulos/curso/:cursoId
 */
export const obtenerCapitulosPorCurso = async (req: Request, res: Response) => {
    try {
        const { cursoId } = req.params;
        const usuario = req.usuario;

        // Verificar que el curso existe
        const curso = await Curso.findById(cursoId);
        if (!curso) {
            return res.status(404).json({
                ok: false,
                message: 'Curso no encontrado'
            });
        }

        // Obtener capítulos según el rol
        let capitulos;

        if (usuario?.role === 'estudiante') {
            // Estudiantes solo ven capítulos visibles
            capitulos = await Capitulo.find({
                cid: cursoId,
                visible: true
            }).sort({ orden: 1 });
        } else {
            // Profesores, ayudantes, admins ven todos
            capitulos = await Capitulo.find({
                cid: cursoId
            }).sort({ orden: 1 });
        }

        return res.status(200).json({
            ok: true,
            capitulos,
            total: capitulos.length
        });

    } catch (error) {
        console.error('Error al obtener capítulos:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener los capítulos',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Obtener un capítulo específico por ID
 * GET /api/capitulos/:capituloId
 */
export const obtenerCapituloPorId = async (req: Request, res: Response) => {
    try {
        const { capituloId } = req.params;
        const usuario = req.usuario;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        // Verificar permisos de visibilidad
        if (usuario?.role === 'estudiante' && !capitulo.visible) {
            return res.status(403).json({
                ok: false,
                message: 'No tienes permiso para ver este capítulo'
            });
        }

        return res.status(200).json({
            ok: true,
            capitulo
        });

    } catch (error) {
        console.error('Error al obtener capítulo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al obtener el capítulo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Crear un nuevo capítulo
 * POST /api/capitulos
 */
export const crearCapitulo = async (req: Request, res: Response) => {
    try {
        const { cid, titulo, descripcion, orden, visible = true, objetivos = [] } = req.body;

        // Verificar que el curso existe
        const curso = await Curso.findById(cid);
        if (!curso) {
            return res.status(404).json({
                ok: false,
                message: 'Curso no encontrado'
            });
        }

        // Verificar si ya existe un capítulo con ese orden
        const capituloExistente = await Capitulo.findOne({ cid, orden });
        if (capituloExistente) {
            return res.status(400).json({
                ok: false,
                message: `Ya existe un capítulo con el orden ${orden} en este curso`
            });
        }

        // Crear el capítulo
        const nuevoCapitulo = new Capitulo({
            cid,
            titulo,
            descripcion,
            orden,
            visible,
            objetivos,
            temas: []
        });

        await nuevoCapitulo.save();

        return res.status(201).json({
            ok: true,
            message: 'Capítulo creado exitosamente',
            capitulo: nuevoCapitulo
        });

    } catch (error) {
        console.error('Error al crear capítulo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al crear el capítulo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Actualizar un capítulo
 * PUT /api/capitulos/:capituloId
 */
export const actualizarCapitulo = async (req: Request, res: Response) => {
    try {
        const { capituloId } = req.params;
        const { titulo, descripcion, orden, visible, objetivos, fechaPublicacion } = req.body;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        // Si se cambia el orden, verificar que no exista otro capítulo con ese orden
        if (orden && orden !== capitulo.orden) {
            const capituloConOrden = await Capitulo.findOne({
                cid: capitulo.cid,
                orden,
                _id: { $ne: capituloId }
            });

            if (capituloConOrden) {
                return res.status(400).json({
                    ok: false,
                    message: `Ya existe un capítulo con el orden ${orden} en este curso`
                });
            }
        }

        // Actualizar campos
        if (titulo) capitulo.titulo = titulo;
        if (descripcion) capitulo.descripcion = descripcion;
        if (orden) capitulo.orden = orden;
        if (visible !== undefined) capitulo.visible = visible;
        if (objetivos) capitulo.objetivos = objetivos;
        if (fechaPublicacion) capitulo.fechaPublicacion = fechaPublicacion;

        await capitulo.save();

        return res.status(200).json({
            ok: true,
            message: 'Capítulo actualizado exitosamente',
            capitulo
        });

    } catch (error) {
        console.error('Error al actualizar capítulo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar el capítulo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Eliminar un capítulo
 * DELETE /api/capitulos/:capituloId
 */
export const eliminarCapitulo = async (req: Request, res: Response) => {
    try {
        const { capituloId } = req.params;

        const capitulo = await Capitulo.findByIdAndDelete(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'Capítulo eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar capítulo:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar el capítulo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 📝 CONTROLADORES DE TEMAS
// ==========================================

/**
 * Agregar un tema a un capítulo
 * POST /api/capitulos/:capituloId/temas
 */
export const agregarTema = async (req: Request, res: Response) => {
    try {
        const { capituloId } = req.params;
        const { titulo, descripcion, orden, tipo, estimacionMinutos, visible = true } = req.body;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        // Verificar si ya existe un tema con ese orden
        const temaExistente = capitulo.temas.find(t => t.orden === orden);
        if (temaExistente) {
            return res.status(400).json({
                ok: false,
                message: `Ya existe un tema con el orden ${orden} en este capítulo`
            });
        }

        // Agregar el nuevo tema
        capitulo.temas.push({
            titulo,
            descripcion,
            orden,
            tipo,
            estimacionMinutos,
            visible,
            contenidos: []
        } as any);

        await capitulo.save();

        return res.status(201).json({
            ok: true,
            message: 'Tema agregado exitosamente',
            capitulo
        });

    } catch (error) {
        console.error('Error al agregar tema:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al agregar el tema',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Actualizar un tema
 * PUT /api/capitulos/:capituloId/temas/:temaId
 */
export const actualizarTema = async (req: Request, res: Response) => {
    try {
        const { capituloId, temaId } = req.params;
        const { titulo, descripcion, orden, tipo, estimacionMinutos, visible } = req.body;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        const tema = (capitulo.temas as any).id(temaId);

        if (!tema) {
            return res.status(404).json({
                ok: false,
                message: 'Tema no encontrado'
            });
        }

        // Actualizar campos del tema
        if (titulo) tema.titulo = titulo;
        if (descripcion) tema.descripcion = descripcion;
        if (orden) tema.orden = orden;
        if (tipo) tema.tipo = tipo;
        if (estimacionMinutos) tema.estimacionMinutos = estimacionMinutos;
        if (visible !== undefined) tema.visible = visible;

        await capitulo.save();

        return res.status(200).json({
            ok: true,
            message: 'Tema actualizado exitosamente',
            capitulo
        });

    } catch (error) {
        console.error('Error al actualizar tema:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar el tema',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Eliminar un tema
 * DELETE /api/capitulos/:capituloId/temas/:temaId
 */
export const eliminarTema = async (req: Request, res: Response) => {
    try {
        const { capituloId, temaId } = req.params;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        // Eliminar el tema usando pull
        const temaEliminado = (capitulo.temas as any).id(temaId);

        if (!temaEliminado) {
            return res.status(404).json({
                ok: false,
                message: 'Tema no encontrado'
            });
        }

        temaEliminado.deleteOne();
        await capitulo.save();

        return res.status(200).json({
            ok: true,
            message: 'Tema eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar tema:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar el tema',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 📄 CONTROLADORES DE CONTENIDOS
// ==========================================

/**
 * Agregar un contenido a un tema
 * POST /api/capitulos/:capituloId/temas/:temaId/contenidos
 */
export const agregarContenido = async (req: Request, res: Response) => {
    try {
        const { capituloId, temaId } = req.params;
        const {
            titulo,
            tipo,
            contenido,
            orden,
            visible = true,
            obligatorio = false,
            completable = true
        } = req.body;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        const tema = capitulo.temas.id(temaId);

        if (!tema) {
            return res.status(404).json({
                ok: false,
                message: 'Tema no encontrado'
            });
        }

        // Agregar el nuevo contenido
        tema.contenidos.push({
            titulo,
            tipo,
            contenido,
            orden,
            visible,
            obligatorio,
            completable,
            habilitacionPorGrupo: []
        } as any);

        await capitulo.save();

        return res.status(201).json({
            ok: true,
            message: 'Contenido agregado exitosamente',
            capitulo
        });

    } catch (error) {
        console.error('Error al agregar contenido:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al agregar el contenido',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Actualizar un contenido
 * PUT /api/capitulos/:capituloId/temas/:temaId/contenidos/:contenidoId
 */
export const actualizarContenido = async (req: Request, res: Response) => {
    try {
        const { capituloId, temaId, contenidoId } = req.params;
        const { titulo, tipo, contenido, orden, visible, obligatorio, completable } = req.body;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        const tema = capitulo.temas.id(temaId);

        if (!tema) {
            return res.status(404).json({
                ok: false,
                message: 'Tema no encontrado'
            });
        }

        const contenidoDoc = tema.contenidos.id(contenidoId);

        if (!contenidoDoc) {
            return res.status(404).json({
                ok: false,
                message: 'Contenido no encontrado'
            });
        }

        // Actualizar campos
        if (titulo) contenidoDoc.titulo = titulo;
        if (tipo) contenidoDoc.tipo = tipo;
        if (contenido) contenidoDoc.contenido = contenido;
        if (orden) contenidoDoc.orden = orden;
        if (visible !== undefined) contenidoDoc.visible = visible;
        if (obligatorio !== undefined) contenidoDoc.obligatorio = obligatorio;
        if (completable !== undefined) contenidoDoc.completable = completable;

        await capitulo.save();

        return res.status(200).json({
            ok: true,
            message: 'Contenido actualizado exitosamente',
            capitulo
        });

    } catch (error) {
        console.error('Error al actualizar contenido:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al actualizar el contenido',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Eliminar un contenido
 * DELETE /api/capitulos/:capituloId/temas/:temaId/contenidos/:contenidoId
 */
export const eliminarContenido = async (req: Request, res: Response) => {
    try {
        const { capituloId, temaId, contenidoId } = req.params;

        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        const tema = capitulo.temas.id(temaId);

        if (!tema) {
            return res.status(404).json({
                ok: false,
                message: 'Tema no encontrado'
            });
        }

        const contenidoDoc = tema.contenidos.id(contenidoId);

        if (!contenidoDoc) {
            return res.status(404).json({
                ok: false,
                message: 'Contenido no encontrado'
            });
        }

        contenidoDoc.deleteOne();
        await capitulo.save();

        return res.status(200).json({
            ok: true,
            message: 'Contenido eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar contenido:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al eliminar el contenido',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 🔐 CONTROLADORES DE HABILITACIÓN
// ==========================================

/**
 * Habilitar/deshabilitar contenido para un grupo
 * POST /api/capitulos/:capituloId/contenidos/:contenidoId/habilitar
 */
export const habilitarContenidoParaGrupo = async (req: Request, res: Response) => {
    try {
        const { capituloId, contenidoId } = req.params;
        const { grupoId, habilitado, notas } = req.body;
        const usuario = req.usuario;

        // Verificar que el grupo existe
        const grupo = await Grupo.findById(grupoId);
        if (!grupo) {
            return res.status(404).json({
                ok: false,
                message: 'Grupo no encontrado'
            });
        }

        // Buscar el capítulo y el contenido
        const capitulo = await Capitulo.findById(capituloId);

        if (!capitulo) {
            return res.status(404).json({
                ok: false,
                message: 'Capítulo no encontrado'
            });
        }

        // Buscar el contenido en todos los temas
        let contenidoEncontrado: any = null;
        let temaEncontrado: any = null;

        for (const tema of capitulo.temas) {
            const cont = tema.contenidos.id(contenidoId);
            if (cont) {
                contenidoEncontrado = cont;
                temaEncontrado = tema;
                break;
            }
        }

        if (!contenidoEncontrado) {
            return res.status(404).json({
                ok: false,
                message: 'Contenido no encontrado'
            });
        }

        // Buscar si ya existe una habilitación para este grupo
        const habilitacionExistente = contenidoEncontrado.habilitacionPorGrupo.find(
            (h: any) => h.grupoId.toString() === grupoId
        );

        if (habilitacionExistente) {
            // Actualizar la habilitación existente
            habilitacionExistente.habilitado = habilitado;
            if (habilitado) {
                habilitacionExistente.fechaHabilitacion = new Date();
            } else {
                habilitacionExistente.fechaDeshabilitacion = new Date();
            }
            if (notas) {
                habilitacionExistente.notas = notas;
            }
        } else {
            // Crear nueva habilitación
            contenidoEncontrado.habilitacionPorGrupo.push({
                grupoId: new Types.ObjectId(grupoId),
                habilitado,
                fechaHabilitacion: habilitado ? new Date() : undefined,
                fechaDeshabilitacion: !habilitado ? new Date() : undefined,
                habilitadoPor: usuario?.uid,
                notas: notas || ''
            });
        }

        await capitulo.save();

        return res.status(200).json({
            ok: true,
            message: `Contenido ${habilitado ? 'habilitado' : 'deshabilitado'} exitosamente para el grupo`,
            capitulo
        });

    } catch (error) {
        console.error('Error al habilitar contenido:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error al habilitar el contenido',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};