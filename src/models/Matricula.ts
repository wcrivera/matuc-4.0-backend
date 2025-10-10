// src/models/Matricula.ts
// ==========================================
// 🎓 MODELO MATRÍCULA - MATUC v4.0 (CORREGIDO)
// ==========================================

import { Schema, model, Document, Types } from 'mongoose';

// ==========================================
// 📋 INTERFACE MATRÍCULA
// ==========================================

export interface IMatricula extends Document {
    // _id es generado automáticamente por MongoDB
    mid?: string;                       // ID de la matrícula (para JSON transform)
    uid: Types.ObjectId;                // ID del usuario matriculado
    cid: Types.ObjectId;                // ID del curso
    gid?: Types.ObjectId;               // ID del grupo (opcional)
    rol: 'estudiante' | 'ayudante' | 'profesor' | 'profesor_editor';
    activo: boolean;                    // Si la matrícula está activa
    fechaMatricula: Date;               // Fecha de matrícula
    fechaBaja?: Date;                   // Fecha de baja (si aplica)
    matriculadoPor?: Types.ObjectId;    // Usuario que matriculó
    notas?: string;                     // Notas adicionales
    createdAt: Date;                    // Timestamp de creación
    updatedAt: Date;                    // Timestamp de actualización

    // Métodos de instancia
    darDeBaja(): Promise<IMatricula>;
    reactivar(): Promise<IMatricula>;
    cambiarRol(nuevoRol: 'estudiante' | 'ayudante' | 'profesor' | 'profesor_editor'): Promise<IMatricula>;
}

// ==========================================
// 🗄️ SCHEMA MATRÍCULA
// ==========================================

const MatriculaSchema = new Schema<IMatricula>(
    {
        uid: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El ID del usuario es requerido'],
            index: true
        },

        cid: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: [true, 'El ID del curso es requerido'],
            index: true
        },

        gid: {
            type: Schema.Types.ObjectId,
            ref: 'Grupo',
            default: null,
            index: true
        },

        rol: {
            type: String,
            enum: ['estudiante', 'ayudante', 'profesor', 'profesor_editor'],
            required: [true, 'El rol es requerido'],
            default: 'estudiante'
        },

        activo: {
            type: Boolean,
            default: true,
            index: true
        },

        fechaMatricula: {
            type: Date,
            default: Date.now,
            required: true
        },

        fechaBaja: {
            type: Date,
            default: null
        },

        matriculadoPor: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            default: null
        },

        notas: {
            type: String,
            maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
            default: ''
        }
    },
    {
        timestamps: true,
        collection: 'matriculas',
        versionKey: false
    }
);

// ==========================================
// 📇 ÍNDICES COMPUESTOS
// ==========================================

// Índice único: un usuario solo puede tener UNA matrícula activa por curso
MatriculaSchema.index(
    { uid: 1, cid: 1, activo: 1 },
    {
        unique: true,
        partialFilterExpression: { activo: true },
        name: 'unique_active_enrollment'
    }
);

// Índice único: un usuario solo puede estar en UN grupo activo por curso
MatriculaSchema.index(
    { uid: 1, cid: 1, gid: 1, activo: 1 },
    {
        unique: true,
        partialFilterExpression: { activo: true, gid: { $ne: null } },
        name: 'unique_active_group_enrollment'
    }
);

// Índice para búsquedas por curso
MatriculaSchema.index({ cid: 1, activo: 1 });

// Índice para búsquedas por usuario
MatriculaSchema.index({ uid: 1, activo: 1 });

// Índice para búsquedas por rol
MatriculaSchema.index({ cid: 1, rol: 1, activo: 1 });

// Índice para búsquedas por grupo
MatriculaSchema.index({ gid: 1, activo: 1 });

// ==========================================
// 🔧 MÉTODOS ESTÁTICOS
// ==========================================

// Verificar si un usuario está matriculado en un curso
MatriculaSchema.statics.estaMatriculado = async function (
    uid: string,
    cid: string
): Promise<boolean> {
    const matricula = await this.findOne({
        uid: new Types.ObjectId(uid),
        cid: new Types.ObjectId(cid),
        activo: true
    });
    return !!matricula;
};

// Obtener rol de un usuario en un curso
MatriculaSchema.statics.obtenerRolEnCurso = async function (
    uid: string,
    cid: string
): Promise<string | null> {
    const matricula = await this.findOne({
        uid: new Types.ObjectId(uid),
        cid: new Types.ObjectId(cid),
        activo: true
    });
    return matricula ? matricula.rol : null;
};

// Contar estudiantes en un curso
MatriculaSchema.statics.contarEstudiantes = async function (
    cid: string
): Promise<number> {
    return await this.countDocuments({
        cid: new Types.ObjectId(cid),
        rol: 'estudiante',
        activo: true
    });
};

// Obtener todas las matrículas de un usuario
MatriculaSchema.statics.obtenerCursosDeUsuario = async function (
    uid: string,
    soloActivas: boolean = true
) {
    const filtro: any = { uid: new Types.ObjectId(uid) };
    if (soloActivas) filtro.activo = true;

    return await this.find(filtro)
        .populate('cid', 'nombre sigla categoria semestre año activo')
        .populate('gid', 'numero nombre')
        .sort({ fechaMatricula: -1 });
};

// Obtener todas las matrículas de un curso
MatriculaSchema.statics.obtenerUsuariosDeCurso = async function (
    cid: string,
    rol?: string,
    soloActivas: boolean = true
) {
    const filtro: any = { cid: new Types.ObjectId(cid) };
    if (rol) filtro.rol = rol;
    if (soloActivas) filtro.activo = true;

    return await this.find(filtro)
        .populate('uid', 'nombre apellido email avatar')
        .populate('gid', 'numero nombre')
        .sort({ rol: 1, fechaMatricula: 1 });
};

// Obtener matrículas de un grupo específico
MatriculaSchema.statics.obtenerUsuariosDeGrupo = async function (
    gid: string,
    rol?: string,
    soloActivas: boolean = true
) {
    const filtro: any = { gid: new Types.ObjectId(gid) };
    if (rol) filtro.rol = rol;
    if (soloActivas) filtro.activo = true;

    return await this.find(filtro)
        .populate('uid', 'nombre apellido email avatar')
        .sort({ rol: 1, fechaMatricula: 1 });
};

// ==========================================
// 🔧 MÉTODOS DE INSTANCIA
// ==========================================

// Dar de baja una matrícula
MatriculaSchema.methods.darDeBaja = async function (): Promise<IMatricula> {
    this.activo = false;
    this.fechaBaja = new Date();
    return await this.save();
};

// Reactivar una matrícula
MatriculaSchema.methods.reactivar = async function (): Promise<IMatricula> {
    this.activo = true;
    this.fechaBaja = undefined;
    return await this.save();
};

// Cambiar rol
MatriculaSchema.methods.cambiarRol = async function (
    nuevoRol: 'estudiante' | 'ayudante' | 'profesor' | 'profesor_editor'
): Promise<IMatricula> {
    this.rol = nuevoRol;
    return await this.save();
};

// ==========================================
// 🎣 HOOKS (MIDDLEWARE)
// ==========================================

// Antes de guardar: validar que el curso y usuario existen
MatriculaSchema.pre('save', async function (next) {
    if (this.isNew) {
        const Usuario = model('Usuario');
        const Curso = model('Curso');

        const [usuarioExiste, cursoExiste] = await Promise.all([
            Usuario.exists({ uid: this.uid }),
            Curso.exists({ cid: this.cid })
        ]);

        if (!usuarioExiste) {
            throw new Error('El usuario no existe');
        }

        if (!cursoExiste) {
            throw new Error('El curso no existe');
        }

        // Validar grupo si se proporciona
        if (this.gid) {
            const Grupo = model('Grupo');
            const grupoExiste = await Grupo.exists({ gid: this.gid });

            if (!grupoExiste) {
                throw new Error('El grupo no existe');
            }
        }
    }
    next();
});

// Después de crear: Incrementar contador de estudiantes en el curso
MatriculaSchema.post('save', async function (doc) {
    if (doc.rol === 'estudiante' && doc.activo) {
        const Curso = model('Curso');
        await Curso.findOneAndUpdate(
            { cid: doc.cid },
            { $inc: { 'estadisticas.totalEstudiantes': 1 } }
        );
    }
});

// Después de actualizar a inactivo: Decrementar contador
MatriculaSchema.post('findOneAndUpdate', async function (doc) {
    if (doc && doc.rol === 'estudiante' && !doc.activo) {
        const Curso = model('Curso');
        await Curso.findOneAndUpdate(
            { cid: doc.cid },
            { $inc: { 'estadisticas.totalEstudiantes': -1 } }
        );
    }
});

// ==========================================
// 📤 TRANSFORMACIÓN PARA JSON (CORREGIDO)
// ==========================================

MatriculaSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret: any) {
        ret.mid = ret._id;  // Convertir _id a mid
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

// ==========================================
// 📤 EXPORTAR MODELO
// ==========================================

const Matricula = model<IMatricula>('Matricula', MatriculaSchema);

export default Matricula;