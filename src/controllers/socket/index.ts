// // src/controllers/socket/index.ts
// export {
//     conectarUsuario,
//     desconectarUsuario,
//     obtenerUsuariosConectados
// } from './connection.controller';

// export {
//     activarSeccion,
//     obtenerEstadoActivo
// } from './content.controller';

// export {
//     activarEjercicio
// } from './exercise.controller';

// export {
//     crearDBQ,
//     crearDBP
// } from './response.controller';

// // ==========================================
// // src/controllers/socket/connection.controller.ts
// // ==========================================

// import Usuario from '../../models/usuario';
// import Matricula from '../../models/matricula';
// import Grupo from '../../models/grupo';

// interface ConexionResponse {
//     ok: boolean;
//     message?: string;
//     payload?: any;
// }

// export const conectarUsuario = async (matriculaId: string): Promise<ConexionResponse> => {
//     try {
//         // Verificar que la matrícula existe
//         const matricula = await Matricula.findById(matriculaId)
//             .populate('uid', 'nombre apellido email')
//             .populate('cid', 'nombre codigo')
//             .populate('gid', 'numero');

//         if (!matricula) {
//             return {
//                 ok: false,
//                 message: 'Matrícula no encontrada'
//             };
//         }

//         // Marcar usuario como conectado (opcional - para tracking)
//         await Usuario.findByIdAndUpdate(matricula.uid, {
//             ultimaConexion: new Date(),
//             conectado: true
//         });

//         console.log(`✅ Usuario ${matricula.uid} conectado correctamente`);

//         return {
//             ok: true,
//             message: 'Usuario conectado exitosamente',
//             payload: {
//                 usuario: matricula.uid,
//                 curso: matricula.cid,
//                 grupo: matricula.gid,
//                 conectadoAt: new Date()
//             }
//         };

//     } catch (error) {
//         console.error('❌ Error en conectarUsuario:', error);
//         return {
//             ok: false,
//             message: 'Error conectando usuario'
//         };
//     }
// };

// export const desconectarUsuario = async (matriculaId: string): Promise<ConexionResponse> => {
//     try {
//         const matricula = await Matricula.findById(matriculaId);

//         if (matricula) {
//             // Marcar usuario como desconectado
//             await Usuario.findByIdAndUpdate(matricula.uid, {
//                 conectado: false,
//                 ultimaDesconexion: new Date()
//             });

//             console.log(`🔌 Usuario ${matricula.uid} desconectado`);
//         }

//         return {
//             ok: true,
//             message: 'Usuario desconectado exitosamente'
//         };

//     } catch (error) {
//         console.error('❌ Error en desconectarUsuario:', error);
//         return {
//             ok: false,
//             message: 'Error desconectando usuario'
//         };
//     }
// };

// export const obtenerUsuariosConectados = async (
//     cursoId: string,
//     grupoId: string
// ): Promise<ConexionResponse> => {
//     try {
//         // Obtener todas las matrículas del grupo
//         const matriculas = await Matricula.find({
//             cid: cursoId,
//             gid: grupoId
//         })
//             .populate('uid', 'nombre apellido email conectado ultimaConexion rol')
//             .populate('gid', 'numero nombre');

//         // Filtrar solo usuarios conectados (opcional)
//         const usuariosConectados = matriculas
//             .filter(m => m.uid && (m.uid as any).conectado)
//             .map(m => ({
//                 uid: (m.uid as any)._id,
//                 nombre: (m.uid as any).nombre,
//                 apellido: (m.uid as any).apellido,
//                 rol: (m.uid as any).rol || 'Estudiante',
//                 ultimaConexion: (m.uid as any).ultimaConexion,
//                 grupo: (m.gid as any).numero
//             }));

//         return {
//             ok: true,
//             payload: usuariosConectados
//         };

//     } catch (error) {
//         console.error('❌ Error obteniendo usuarios conectados:', error);
//         return {
//             ok: false,
//             message: 'Error obteniendo usuarios conectados'
//         };
//     }
// };

// // ==========================================
// // src/controllers/socket/content.controller.ts
// // ==========================================

// import Activo from '../../models/activo';
// import Seccion from '../../models/seccion';

// export const activarSeccion = async (datosActivacion: any): Promise<ConexionResponse> => {
//     try {
//         const { seccionId, cursoId, grupoId, activo } = datosActivacion;

//         // Verificar que la sección existe
//         const seccion = await Seccion.findById(seccionId);
//         if (!seccion) {
//             return {
//                 ok: false,
//                 message: 'Sección no encontrada'
//             };
//         }

//         // Actualizar o crear registro de activación
//         const activacion = await Activo.findOneAndUpdate(
//             {
//                 sid: seccionId,
//                 cid: cursoId,
//                 gid: grupoId
//             },
//             {
//                 diapositiva: { activo: activo.diapositiva || false },
//                 video: { activo: activo.video || false },
//                 pregunta: { activo: activo.pregunta || false },
//                 actualizadoAt: new Date(),
//                 actualizadoPor: datosActivacion.uid || null
//             },
//             {
//                 upsert: true,
//                 new: true
//             }
//         );

//         console.log(`📚 Sección ${seccionId} activada en curso ${cursoId}, grupo ${grupoId}`);

//         return {
//             ok: true,
//             message: 'Sección activada exitosamente',
//             payload: {
//                 seccionId,
//                 cursoId,
//                 grupoId,
//                 estado: activacion,
//                 timestamp: new Date()
//             }
//         };

//     } catch (error) {
//         console.error('❌ Error activando sección:', error);
//         return {
//             ok: false,
//             message: 'Error activando sección'
//         };
//     }
// };

// export const obtenerEstadoActivo = async (
//     cursoId: string,
//     grupoId: string
// ): Promise<ConexionResponse> => {
//     try {
//         // Obtener todas las activaciones del curso-grupo
//         const activaciones = await Activo.find({
//             cid: cursoId,
//             gid: grupoId
//         }).populate('sid', 'titulo orden');

//         return {
//             ok: true,
//             payload: activaciones
//         };

//     } catch (error) {
//         console.error('❌ Error obteniendo estado activo:', error);
//         return {
//             ok: false,
//             message: 'Error obteniendo estado activo'
//         };
//     }
// };

// // ==========================================
// // src/controllers/socket/exercise.controller.ts
// // ==========================================

// import Ejercicio from '../../models/ejercicio';

// export const activarEjercicio = async (datosEjercicio: any): Promise<ConexionResponse> => {
//     try {
//         const { ejercicioId, cursoId, grupoId, activo } = datosEjercicio;

//         // Verificar que el ejercicio existe
//         const ejercicio = await Ejercicio.findById(ejercicioId);
//         if (!ejercicio) {
//             return {
//                 ok: false,
//                 message: 'Ejercicio no encontrado'
//             };
//         }

//         // Actualizar estado del ejercicio
//         await Ejercicio.findByIdAndUpdate(ejercicioId, {
//             activo: activo,
//             activadoAt: activo ? new Date() : null,
//             activadoPor: datosEjercicio.uid || null
//         });

//         console.log(`📝 Ejercicio ${ejercicioId} ${activo ? 'activado' : 'desactivado'}`);

//         return {
//             ok: true,
//             message: `Ejercicio ${activo ? 'activado' : 'desactivado'} exitosamente`,
//             payload: {
//                 ejercicioId,
//                 cursoId,
//                 grupoId,
//                 activo,
//                 timestamp: new Date()
//             }
//         };

//     } catch (error) {
//         console.error('❌ Error activando ejercicio:', error);
//         return {
//             ok: false,
//             message: 'Error activando ejercicio'
//         };
//     }
// };

// // ==========================================
// // src/controllers/socket/response.controller.ts
// // ==========================================

// import DBQ from '../../models/dbq';
// import DBP from '../../models/dbp';

// export const crearDBQ = async (datosRespuesta: any): Promise<ConexionResponse> => {
//     try {
//         const { uid, questionId, respuesta, seccionId, cursoId, grupoId } = datosRespuesta;

//         // Verificar si ya existe una respuesta del usuario para esta pregunta
//         const respuestaExistente = await DBQ.findOne({
//             uid,
//             qid: questionId
//         });

//         let resultado;

//         if (respuestaExistente) {
//             // Actualizar respuesta existente
//             resultado = await DBQ.findByIdAndUpdate(
//                 respuestaExistente._id,
//                 {
//                     respuesta,
//                     respondidoAt: new Date()
//                 },
//                 { new: true }
//             );
//             console.log(`📝 Respuesta DBQ actualizada para usuario ${uid}`);
//         } else {
//             // Crear nueva respuesta
//             resultado = await DBQ.create({
//                 uid,
//                 qid: questionId,
//                 sid: seccionId,
//                 cid: cursoId,
//                 gid: grupoId,
//                 respuesta,
//                 respondidoAt: new Date()
//             });
//             console.log(`📝 Nueva respuesta DBQ creada para usuario ${uid}`);
//         }

//         return {
//             ok: true,
//             message: 'Respuesta guardada exitosamente',
//             payload: {
//                 respuestaId: resultado._id,
//                 questionId,
//                 timestamp: new Date()
//             }
//         };

//     } catch (error) {
//         console.error('❌ Error creando DBQ:', error);
//         return {
//             ok: false,
//             message: 'Error guardando respuesta'
//         };
//     }
// };

// export const crearDBP = async (datosRespuesta: any): Promise<ConexionResponse> => {
//     try {
//         const { uid, preguntaId, respuesta, ejercicioId, cursoId, grupoId } = datosRespuesta;

//         // Verificar si ya existe una respuesta del usuario para esta pregunta
//         const respuestaExistente = await DBP.findOne({
//             uid,
//             pid: preguntaId
//         });

//         let resultado;

//         if (respuestaExistente) {
//             // Actualizar respuesta existente
//             resultado = await DBP.findByIdAndUpdate(
//                 respuestaExistente._id,
//                 {
//                     respuesta,
//                     respondidoAt: new Date()
//                 },
//                 { new: true }
//             );
//             console.log(`📚 Respuesta DBP actualizada para usuario ${uid}`);
//         } else {
//             // Crear nueva respuesta
//             resultado = await DBP.create({
//                 uid,
//                 pid: preguntaId,
//                 eid: ejercicioId,
//                 cid: cursoId,
//                 gid: grupoId,
//                 respuesta,
//                 respondidoAt: new Date()
//             });
//             console.log(`📚 Nueva respuesta DBP creada para usuario ${uid}`);
//         }

//         return {
//             ok: true,
//             message: 'Respuesta de ejercicio guardada exitosamente',
//             payload: {
//                 respuestaId: resultado._id,
//                 preguntaId,
//                 timestamp: new Date()
//             }
//         };

//     } catch (error) {
//         console.error('❌ Error creando DBP:', error);
//         return {
//             ok: false,
//             message: 'Error guardando respuesta de ejercicio'
//         };
//     }
// };