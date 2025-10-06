import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Curso from '../models/Curso';

// ==========================================
// 🔐 INTERFACES PARA TIPOS DE REQUEST
// ==========================================

interface CursoQuery {
    categoria?: string;
    activo?: boolean;
    publico?: boolean;
    semestre?: string;
    año?: number;
    search?: string;
}

// ==========================================
// 📊 OBTENER CURSOS (CON CONTROL DE ROLES)
// ==========================================

export const obtenerCursos = async (req: Request, res: Response) => {

    try {
        const total = await Curso.countDocuments()

        const pageNum = 1
        const limitNum = 10
        // const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };



        // // const usuario = req.usuario;
        const {
            categoria,
            activo,
            publico,
            semestre,
            año,
            search,
            page = '1',
            limit = '10'
        } = req.query as CursoQuery & { page?: string; limit?: string };


        console.log(categoria, activo, publico, semestre, search, page, limit, año)

        const cursos = await Curso.find()
        // .skip((pageNum - 1) * limitNum).limit(limitNum)

        // // Validar autenticación
        // // if (!usuario) {
        // //     return res.status(401).json({
        // //         ok: false,
        // //         message: 'Token requerido'
        // //     });
        // // }

        // // Construir filtro base según rol
        // let filtroBase: any = {};

        // // 🎯 CONTROL DE ACCESO POR ROL
        // // if (usuario.admin) {
        // //     // ADMINISTRADOR: Ve todos los cursos
        // //     filtroBase = {};
        // // } else {
        // //     // TODOS LOS DEMÁS: Solo cursos públicos y activos por defecto
        // //     // TODO: Implementar lógica para profesores (ve sus cursos) y estudiantes (ve cursos matriculados)
        // //     filtroBase = {
        // //         publico: true,
        // //         activo: true
        // //     };
        // // }

        // // Agregar filtros adicionales
        // if (categoria) filtroBase.categoria = categoria;
        // if (activo !== undefined) filtroBase.activo = activo === true;
        // if (publico !== undefined) filtroBase.publico = publico === true;
        // if (semestre) filtroBase.semestre = semestre;
        // if (año) filtroBase.año = parseInt(año.toString());

        // // Filtro de búsqueda por texto
        // if (search) {
        //     filtroBase.$or = [
        //         { sigla: { $regex: search, $options: 'i' } },
        //         { nombre: { $regex: search, $options: 'i' } },
        //         { descripcion: { $regex: search, $options: 'i' } }
        //     ];
        // }

        // // Paginación
        // const pageNum = parseInt(page);
        // const limitNum = parseInt(limit);
        // const skip = (pageNum - 1) * limitNum;

        // // Ejecutar consulta
        // const [cursos, total] = await Promise.all([
        //     Curso.find(filtroBase)
        //         .select('sigla nombre descripcion categoria creditos activo publico estadisticas.totalEstudiantes fechaModificacion')
        //         .sort({ fechaModificacion: -1 })
        //         .skip(skip)
        //         .limit(limitNum)
        //         .lean(),
        //     Curso.countDocuments(filtroBase)
        // ]);

        // Respuesta con paginación
        res.json({
            ok: true,
            cursos,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            }
        });

    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 📋 OBTENER CURSO POR ID (CON CONTROL DE ACCESO)
// ==========================================

export const obtenerCursoPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        // Validar autenticación
        if (!usuario) {
            return res.status(401).json({
                ok: false,
                message: 'Token requerido'
            });
        }

        // Validar ObjectId
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de curso inválido'
            });
        }

        // Buscar curso
        const curso = await Curso.findById(id).lean();

        if (!curso) {
            return res.status(404).json({
                ok: false,
                message: 'Curso no encontrado'
            });
        }

        // 🎯 CONTROL DE ACCESO POR ROL
        if (!usuario.admin) {
            // Si no es admin, verificar acceso
            if (!curso.publico || !curso.activo) {
                // TODO: Verificar si es profesor/ayudante del curso o estudiante matriculado
                // Por ahora solo permitimos ver cursos públicos y activos
                return res.status(403).json({
                    ok: false,
                    message: 'No tiene permisos para ver este curso'
                });
            }
        }

        res.json({
            ok: true,
            curso
        });

    } catch (error) {
        console.error('❌ Error al obtener curso:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// ➕ CREAR CURSO (SOLO ADMINISTRADOR)
// ==========================================

export const crearCurso = async (req: Request, res: Response) => {

    try {
        const usuario = req.usuario;
        const { sigla, nombre, descripcion, categoria, creditos, semestre, año, configuracion } = req.body;

        // Validar autenticación y permisos
        if (!usuario) {
            return res.status(401).json({
                ok: false,
                message: 'Token requerido'
            });
        }

        // 🎯 CONTROL DE PERMISOS: Solo ADMINISTRADOR puede crear cursos
        if (!usuario.admin) {
            return res.status(403).json({
                ok: false,
                message: 'Solo los administradores pueden crear cursos'
            });
        }

        // Validar campos requeridos
        if (!sigla || !nombre || !descripcion || !categoria || !creditos || !semestre || !año) {
            return res.status(400).json({
                ok: false,
                message: 'Faltan campos requeridos',
                campos: ['sigla', 'nombre', 'descripcion', 'categoria', 'creditos', 'semestre', 'año']
            });
        }

        // Verificar que la sigla sea única
        const siglaUpper = sigla.toUpperCase();
        const cursoExistente = await Curso.findOne({ sigla: siglaUpper });

        if (cursoExistente) {
            return res.status(409).json({
                ok: false,
                message: `Ya existe un curso con la sigla ${siglaUpper}`
            });
        }

        // Crear nuevo curso
        const nuevoCurso = new Curso({
            sigla: siglaUpper,
            nombre,
            descripcion,
            categoria,
            creditos,
            semestre,
            año,
            configuracion: configuracion || {
                notaAprobacion: 4.0,
                limitePlazas: 50,
                requiereAprobacion: false
            },
            activo: true,
            publico: false,
            creadoPor: usuario.uid,
            fechaCreacion: new Date(),
            fechaModificacion: new Date()
        });

        const cursoGuardado = await nuevoCurso.save();

        res.status(201).json({
            ok: true,
            message: 'Curso creado exitosamente',
            curso: cursoGuardado
        });

    } catch (error) {
        console.error('❌ Error al crear curso:', error);

        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                message: 'Error de validación',
                detalles: error.message
            });
        }

        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// ✏️ ACTUALIZAR CURSO (ADMIN Y PROFESOR_EDITOR)
// ==========================================

export const actualizarCurso = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;
        const camposActualizar = req.body;

        // Validar autenticación
        if (!usuario) {
            return res.status(401).json({
                ok: false,
                message: 'Token requerido'
            });
        }

        // Validar ObjectId
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de curso inválido'
            });
        }

        // Buscar curso existente
        const cursoExistente = await Curso.findById(id);
        if (!cursoExistente) {
            return res.status(404).json({
                ok: false,
                message: 'Curso no encontrado'
            });
        }

        // 🎯 CONTROL DE PERMISOS
        // Solo ADMINISTRADOR o PROFESOR_EDITOR pueden editar
        if (!usuario.admin) {
            // TODO: Verificar si es PROFESOR_EDITOR asignado a este curso
            // Por ahora, solo permitimos admin
            return res.status(403).json({
                ok: false,
                message: 'No tiene permisos para editar este curso'
            });
        }

        // Eliminar campos que no se pueden actualizar
        delete camposActualizar._id;
        delete camposActualizar.cid;
        delete camposActualizar.fechaCreacion;
        delete camposActualizar.creadoPor;

        // Actualizar fecha de modificación
        camposActualizar.fechaModificacion = new Date();

        // Verificar sigla única si se está actualizando
        if (camposActualizar.sigla && camposActualizar.sigla !== cursoExistente.sigla) {
            const siglaDuplicada = await Curso.findOne({
                sigla: camposActualizar.sigla.toUpperCase(),
                _id: { $ne: id }
            });

            if (siglaDuplicada) {
                return res.status(409).json({
                    ok: false,
                    message: `Ya existe un curso con la sigla ${camposActualizar.sigla.toUpperCase()}`
                });
            }

            camposActualizar.sigla = camposActualizar.sigla.toUpperCase();
        }

        // Actualizar curso
        const cursoActualizado = await Curso.findByIdAndUpdate(
            id,
            camposActualizar,
            {
                new: true,
                runValidators: true
            }
        );

        res.json({
            ok: true,
            message: 'Curso actualizado exitosamente',
            curso: cursoActualizado
        });

    } catch (error) {
        console.error('❌ Error al actualizar curso:', error);

        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                message: 'Error de validación',
                detalles: error.message
            });
        }

        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 🗑️ ELIMINAR CURSO (SOLO ADMINISTRADOR)
// ==========================================

export const eliminarCurso = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        // Validar autenticación y permisos
        if (!usuario || !usuario.admin) {
            return res.status(403).json({
                ok: false,
                message: 'Solo los administradores pueden eliminar cursos'
            });
        }

        // Validar ObjectId
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: 'ID de curso inválido'
            });
        }

        // Buscar y eliminar curso
        const cursoEliminado = await Curso.findByIdAndDelete(id);

        if (!cursoEliminado) {
            return res.status(404).json({
                ok: false,
                message: 'Curso no encontrado'
            });
        }

        // TODO: Eliminar también módulos, ejercicios, matrículas relacionadas
        // await Modulo.deleteMany({ cursoId: id });
        // await Matricula.deleteMany({ cursoId: id });

        res.json({
            ok: true,
            message: 'Curso eliminado exitosamente',
            curso: {
                sigla: cursoEliminado.sigla,
                nombre: cursoEliminado.nombre
            }
        });

    } catch (error) {
        console.error('❌ Error al eliminar curso:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 📈 OBTENER ESTADÍSTICAS DE CURSOS (ADMIN)
// ==========================================

export const obtenerEstadisticasCursos = async (req: Request, res: Response) => {
    try {
        const usuario = req.usuario;

        // Solo admin puede ver estadísticas globales
        if (!usuario || !usuario.admin) {
            return res.status(403).json({
                ok: false,
                message: 'Solo los administradores pueden ver estadísticas globales'
            });
        }

        const [
            totalCursos,
            cursosActivos,
            cursosPublicos,
            cursosPorCategoria
        ] = await Promise.all([
            Curso.countDocuments(),
            Curso.countDocuments({ activo: true }),
            Curso.countDocuments({ publico: true }),
            Curso.aggregate([
                {
                    $group: {
                        _id: '$categoria',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            ok: true,
            estadisticas: {
                totalCursos,
                cursosActivos,
                cursosPublicos,
                cursosInactivos: totalCursos - cursosActivos,
                cursosPrivados: totalCursos - cursosPublicos,
                porCategoria: cursosPorCategoria
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 🌱 SEED DE CURSOS (SOLO ADMIN - DESARROLLO)
// ==========================================

export const seedCursos = async (req: Request, res: Response) => {
    try {
        const usuario = req.usuario;

        // Solo admin puede hacer seed
        if (!usuario || !usuario.admin) {
            return res.status(403).json({
                ok: false,
                message: 'Solo los administradores pueden ejecutar seed'
            });
        }

        // Cursos de ejemplo
        const cursosEjemplo = [
            {
                sigla: 'MAT1610',
                nombre: 'Cálculo I',
                descripcion: 'Introducción al cálculo diferencial e integral de funciones de una variable',
                categoria: 'Cálculo',
                creditos: 10,
                semestre: '2024-1',
                año: 2024,
                activo: true,
                publico: true,
                creadoPor: usuario.uid
            },
            {
                sigla: 'MAT1620',
                nombre: 'Cálculo II',
                descripcion: 'Cálculo de funciones de varias variables y ecuaciones diferenciales',
                categoria: 'Cálculo',
                creditos: 10,
                semestre: '2024-1',
                año: 2024,
                activo: true,
                publico: true,
                creadoPor: usuario.uid
            },
            {
                sigla: 'MAT1203',
                nombre: 'Álgebra Lineal',
                descripcion: 'Espacios vectoriales, transformaciones lineales y matrices',
                categoria: 'Álgebra',
                creditos: 10,
                semestre: '2024-1',
                año: 2024,
                activo: true,
                publico: false,
                creadoPor: usuario.uid
            }
        ];

        // Insertar solo si no existen
        const cursosCreados = [];
        for (const cursoData of cursosEjemplo) {
            const existe = await Curso.findOne({ sigla: cursoData.sigla });
            if (!existe) {
                const curso = await Curso.create(cursoData);
                cursosCreados.push(curso);
            }
        }

        res.json({
            ok: true,
            message: `Seed completado. ${cursosCreados.length} cursos creados`,
            cursosCreados
        });

    } catch (error) {
        console.error('❌ Error en seed:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};