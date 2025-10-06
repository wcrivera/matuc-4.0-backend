// src/models/Matricula.ts (Backend)
// ==========================================
// 🎓 MODELO DE MATRÍCULA - MONGOOSE
// ==========================================

import { Schema, model, Types } from 'mongoose';

// ==========================================
// 📚 INTERFACE PARA TYPESCRIPT
// ==========================================

interface IMatricula {
    // === IDENTIFICADOR PRINCIPAL ===
    mid: Types.ObjectId;            // ID principal de matrícula

    // === RELACIONES ===
    uid: Types.ObjectId;            // Referencia a Usuario
    cid: Types.ObjectId;            // Referencia a Curso

    // === ROL EN EL CURSO ===
    rol: 'estudiante' | 'ayudante' | 'profesor' | 'profesor_editor';

    // === ESTADO ===
    activo: boolean;                // Si está activa
    fechaMatricula: Date;           // Fecha de matrícula
    fechaBaja?: Date;               // Fecha de baja (si existe)

    // === METADATA ===
    matriculadoPor?: Types.ObjectId; // Referencia al usuario que matriculó
    notas?: string;                 // Notas adicionales

    // === TIMESTAMPS AUTOMÁTICOS ===
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// 🔧 SCHEMA DE MONGOOSE
// ==========================================

const MatriculaSchema = new Schema<IMatricula>(
    {
        // ID Principal (igual que uid en Usuario, cid en Curso)
        mid: {
            type: Schema.Types.ObjectId,
            default: () => new Types.ObjectId(),
            unique: true,
            required: true,
            index: true
        },

        // Referencias
        uid: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El usuario es requerido'],
            index: true
        },

        cid: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: [true, 'El curso es requerido'],
            index: true
        },

        // Rol en el curso
        rol: {
            type: String,
            enum: ['estudiante', 'ayudante', 'profesor', 'profesor_editor'],
            required: [true, 'El rol es requerido'],
            default: 'estudiante'
        },

        // Estado
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

        // Metadata
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
        timestamps: true,           // Agrega createdAt y updatedAt automáticamente
        collection: 'matriculas',   // Nombre de la colección en MongoDB
        versionKey: false           // Desactiva __v
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

// Índice para búsquedas por curso
MatriculaSchema.index({ cid: 1, activo: 1 });

// Índice para búsquedas por usuario
MatriculaSchema.index({ uid: 1, activo: 1 });

// Índice para búsquedas por rol
MatriculaSchema.index({ cid: 1, rol: 1, activo: 1 });

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
        .sort({ rol: 1, fechaMatricula: 1 });
};

// ==========================================
// 🔧 MÉTODOS DE INSTANCIA
// ==========================================

// Dar de baja una matrícula
MatriculaSchema.methods.darDeBaja = async function () {
    this.activo = false;
    this.fechaBaja = new Date();
    return await this.save();
};

// Reactivar una matrícula
MatriculaSchema.methods.reactivar = async function () {
    this.activo = true;
    this.fechaBaja = null;
    return await this.save();
};

// Cambiar rol
MatriculaSchema.methods.cambiarRol = async function (
    nuevoRol: 'estudiante' | 'ayudante' | 'profesor' | 'profesor_editor'
) {
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
// 📤 TRANSFORMACIÓN PARA JSON
// ==========================================

MatriculaSchema.set('toJSON', {
    transform: function (doc, ret) {
        // Convertir _id y ObjectIds a strings
        ret.mid = ret.mid?.toString();
        ret.uid = ret.uid?.toString();
        ret.cid = ret.cid?.toString();
        ret.matriculadoPor = ret.matriculadoPor?.toString();

        // Eliminar campos internos
        delete ret._id;
        delete ret.__v;

        return ret;
    }
});

// ==========================================
// 📤 EXPORTAR MODELO
// ==========================================

export default model<IMatricula>('Matricula', MatriculaSchema);