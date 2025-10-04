import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Curso from '../models/Curso';

// ==========================================
// 🔐 INTERFACES PARA TIPOS DE REQUEST
// ==========================================

interface AuthenticatedRequest extends Request {
    usuario?: {
        uid: string;
        admin: boolean;
        rol?: string;
        email: string;
        nombre: string;
        apellido: string;
    };
}

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

export const obtenerCursos = async (req: AuthenticatedRequest, res: Response) => {

console.log('HOLA')
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

export const obtenerCursoPorId = async (req: AuthenticatedRequest, res: Response) => {
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
        const curso = await Curso.findById(id)
            .populate('creadoPor', 'nombre apellido email')
            .lean();

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
                // TODO: Verificar si es profesor del curso o estudiante matriculado
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
        console.error('Error al obtener curso:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// ➕ CREAR CURSO (SOLO ADMIN Y PROFESORES)
// ==========================================

export const crearCurso = async (req: AuthenticatedRequest, res: Response) => {
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

        // 🎯 CONTROL DE PERMISOS: Solo admin puede crear cursos por ahora
        // TODO: Permitir a profesores crear cursos
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
                camposRequeridos: ['sigla', 'nombre', 'descripcion', 'categoria', 'creditos', 'semestre', 'año']
            });
        }

        // Verificar que no exista la sigla
        const cursoExistente = await Curso.findOne({ sigla: sigla.toUpperCase() });
        if (cursoExistente) {
            return res.status(409).json({
                ok: false,
                message: `Ya existe un curso con la sigla ${sigla.toUpperCase()}`
            });
        }

        // Crear nuevo curso
        const nuevoCurso = new Curso({
            sigla: sigla.toUpperCase(),
            nombre,
            descripcion,
            categoria,
            creditos,
            semestre,
            año,
            configuracion: {
                notaAprobacion: configuracion?.notaAprobacion || 4.0,
                requiereAprobacion: configuracion?.requiereAprobacion || false,
                limitePlazas: configuracion?.limitePlazas,
                codigoAcceso: configuracion?.codigoAcceso
            },
            creadoPor: new Types.ObjectId(usuario.uid),
            activo: false,  // Por defecto inactivo
            publico: false, // Por defecto privado
            estadisticas: {
                totalEstudiantes: 0,
                totalProfesores: 1, // El creador
                totalModulos: 0,
                ultimaActividad: new Date()
            }
        });

        const cursoGuardado = await nuevoCurso.save();

        res.status(201).json({
            ok: true,
            message: 'Curso creado exitosamente',
            curso: cursoGuardado
        });

    } catch (error) {
        console.error('Error al crear curso:', error);

        // Manejar errores de validación de Mongoose
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

export const actualizarCurso = async (req: AuthenticatedRequest, res: Response) => {
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
        if (!usuario.admin) {
            // TODO: Verificar si es profesor_editor del curso
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
        ).populate('creadoPor', 'nombre apellido email');

        res.json({
            ok: true,
            message: 'Curso actualizado exitosamente',
            curso: cursoActualizado
        });

    } catch (error) {
        console.error('Error al actualizar curso:', error);

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
// 🗑️ ELIMINAR CURSO (SOLO ADMIN)
// ==========================================

export const eliminarCurso = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        console.log(usuario)

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

        // TODO: Eliminar también módulos, ejercicios, matriculas relacionadas
        // await Modulo.deleteMany({ cid: id });
        // await Matricula.deleteMany({ cid: id });

        res.json({
            ok: true,
            message: 'Curso eliminado exitosamente',
            curso: cursoEliminado
        });

    } catch (error) {
        console.error('Error al eliminar curso:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 📊 OBTENER ESTADÍSTICAS DE CURSOS (ADMIN)
// ==========================================

export const obtenerEstadisticasCursos = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const usuario = req.usuario;

        // Validar permisos
        if (!usuario || !usuario.admin) {
            return res.status(403).json({
                ok: false,
                message: 'Solo los administradores pueden ver estadísticas'
            });
        }

        // Obtener estadísticas usando el método estático del modelo
        const [estadisticasPorCategoria, estadisticasGenerales] = await Promise.all([
            Curso.aggregate([
                {
                    $group: {
                        _id: '$categoria',
                        totalCursos: { $sum: 1 },
                        cursosActivos: {
                            $sum: { $cond: ['$activo', 1, 0] }
                        },
                        cursosPublicos: {
                            $sum: { $cond: ['$publico', 1, 0] }
                        },
                        totalEstudiantes: { $sum: '$estadisticas.totalEstudiantes' },
                        promedioCreditos: { $avg: '$creditos' }
                    }
                },
                { $sort: { totalCursos: -1 } }
            ]),
            Curso.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCursos: { $sum: 1 },
                        cursosActivos: {
                            $sum: { $cond: ['$activo', 1, 0] }
                        },
                        cursosPublicos: {
                            $sum: { $cond: ['$publico', 1, 0] }
                        },
                        totalEstudiantes: { $sum: '$estadisticas.totalEstudiantes' },
                        totalProfesores: { $sum: '$estadisticas.totalProfesores' },
                        promedioCreditos: { $avg: '$creditos' }
                    }
                }
            ])
        ]);

        res.json({
            ok: true,
            estadisticas: {
                general: estadisticasGenerales[0] || {},
                porCategoria: estadisticasPorCategoria
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

// ==========================================
// 🌱 SEED DE DATOS (SOLO DESARROLLO)
// ==========================================

export const seedCursos = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const usuario = req.usuario;

        // Solo en desarrollo y solo admin
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                ok: false,
                message: 'Endpoint no disponible en producción'
            });
        }

        if (!usuario || !usuario.admin) {
            return res.status(403).json({
                ok: false,
                message: 'Solo administradores pueden ejecutar seed'
            });
        }

        // Importar datos migrados
        const cursosData = [
            // Aquí irían los datos del JSON que convertimos
            // Por ahora, crear uno de ejemplo
            {
                sigla: "MAT9998",
                nombre: "Curso de Prueba",
                descripcion: "Curso creado desde el seed para testing",
                categoria: "Otros",
                creditos: 3,
                semestre: "2024-1",
                año: 2024,
                configuracion: {
                    notaAprobacion: 4.0,
                    requiereAprobacion: false
                },
                creadoPor: new Types.ObjectId(usuario.uid),
                activo: true,
                publico: true,
                estadisticas: {
                    totalEstudiantes: 0,
                    totalProfesores: 1,
                    totalModulos: 0,
                    ultimaActividad: new Date()
                }
            }
        ];

        // Limpiar e insertar
        await Curso.deleteMany({});
        const cursosInsertados = await Curso.insertMany(cursosData);

        res.json({
            ok: true,
            message: `${cursosInsertados.length} cursos insertados exitosamente`,
            cursos: cursosInsertados
        });

    } catch (error) {
        console.error('Error en seed:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};