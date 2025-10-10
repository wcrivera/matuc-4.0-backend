// src/models/Grupo.ts
// ==========================================
// 👥 MODELO GRUPO - MATUC v4.0
// ==========================================

import { Schema, model, Document, Types, Model } from 'mongoose';

// ==========================================
// 📋 INTERFACES
// ==========================================

// Interface para métodos de instancia
export interface IGrupoMethods {
    estaLleno(): Promise<boolean>;
}

// Interface para métodos estáticos
export interface IGrupoModel extends Model<IGrupo, {}, IGrupoMethods> {
    obtenerGruposActivosPorCurso(cid: string): Promise<IGrupo[]>;
    tieneCupoDisponible(id: string): Promise<boolean>;
    contarEstudiantes(id: string): Promise<number>;
}

// Interface del documento
export interface IGrupo extends Document, IGrupoMethods {
    // _id es generado automáticamente por MongoDB
    cid: Types.ObjectId;        // ID del curso al que pertenece
    numero: number;             // Número del grupo (1, 2, 3...)
    nombre: string;             // Nombre descriptivo del grupo
    descripcion?: string;       // Descripción opcional
    cupoMaximo?: number;        // Límite de estudiantes (opcional)
    activo: boolean;            // Si el grupo está activo

    // Horarios del grupo (opcional)
    horarios?: IHorario[];

    // Timestamps automáticos
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// 📅 INTERFACE HORARIO
// ==========================================

interface IHorario {
    dia: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado';
    horaInicio: string;         // Formato "HH:MM" (ej: "10:00")
    horaFin: string;            // Formato "HH:MM" (ej: "11:30")
    sala: string;               // Nombre de la sala
    modalidad: 'presencial' | 'online' | 'híbrido';
}

// ==========================================
// 🗄️ SCHEMA DE HORARIO
// ==========================================

const HorarioSchema = new Schema<IHorario>(
    {
        dia: {
            type: String,
            enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
            required: [true, 'El día es requerido']
        },
        horaInicio: {
            type: String,
            required: [true, 'La hora de inicio es requerida'],
            validate: {
                validator: function (v: string) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'Formato de hora inválido. Use HH:MM'
            }
        },
        horaFin: {
            type: String,
            required: [true, 'La hora de fin es requerida'],
            validate: {
                validator: function (v: string) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'Formato de hora inválido. Use HH:MM'
            }
        },
        sala: {
            type: String,
            required: [true, 'La sala es requerida'],
            trim: true,
            maxlength: [100, 'El nombre de la sala no puede exceder 100 caracteres']
        },
        modalidad: {
            type: String,
            enum: ['presencial', 'online', 'híbrido'],
            default: 'presencial'
        }
    },
    { _id: false } // No crear _id para subdocumentos
);

// ==========================================
// 🗄️ SCHEMA PRINCIPAL DE GRUPO
// ==========================================

const GrupoSchema = new Schema<IGrupo, IGrupoModel, IGrupoMethods>(
    {
        cid: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: [true, 'El ID del curso es requerido'],
            index: true
        },

        numero: {
            type: Number,
            required: [true, 'El número de grupo es requerido'],
            min: [1, 'El número de grupo debe ser mayor a 0'],
            validate: {
                validator: Number.isInteger,
                message: 'El número de grupo debe ser un entero'
            }
        },

        nombre: {
            type: String,
            required: [true, 'El nombre del grupo es requerido'],
            trim: true,
            minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
            maxlength: [100, 'El nombre no puede exceder 100 caracteres']
        },

        descripcion: {
            type: String,
            trim: true,
            maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
            default: ''
        },

        cupoMaximo: {
            type: Number,
            min: [1, 'El cupo máximo debe ser al menos 1'],
            validate: {
                validator: Number.isInteger,
                message: 'El cupo máximo debe ser un entero'
            },
            default: null
        },

        activo: {
            type: Boolean,
            default: true,
            index: true
        },

        horarios: {
            type: [HorarioSchema],
            default: []
        }
    },
    {
        timestamps: true,           // Agrega createdAt y updatedAt automáticamente
        collection: 'grupos',       // Nombre de la colección en MongoDB
        versionKey: false           // Desactiva __v
    }
);

// ==========================================
// 📇 ÍNDICES COMPUESTOS
// ==========================================

// Índice único: Un curso no puede tener dos grupos con el mismo número activos
GrupoSchema.index(
    { cid: 1, numero: 1, activo: 1 },
    {
        unique: true,
        partialFilterExpression: { activo: true },
        name: 'unique_active_group_number'
    }
);

// Índice para búsquedas rápidas por curso
GrupoSchema.index({ cid: 1, activo: 1 });

// Índice para búsquedas por nombre
GrupoSchema.index({ nombre: 1 });

// ==========================================
// 🔧 MÉTODOS ESTÁTICOS
// ==========================================

// Obtener grupos activos de un curso
GrupoSchema.statics.obtenerGruposActivosPorCurso = async function (
    cid: string
): Promise<IGrupo[]> {
    return await this.find({
        cid: new Types.ObjectId(cid),
        activo: true
    }).sort({ numero: 1 });
};

// Verificar si un grupo tiene cupo disponible
GrupoSchema.statics.tieneCupoDisponible = async function (
    id: string
): Promise<boolean> {
    const grupo = await this.findById(id);

    if (!grupo || !grupo.cupoMaximo) {
        return true; // Si no tiene límite, siempre hay cupo
    }

    // Contar matrículas activas en este grupo
    const Matricula = model('Matricula');
    const matriculasActivas = await Matricula.countDocuments({
        gid: new Types.ObjectId(id),
        activo: true
    });

    return matriculasActivas < grupo.cupoMaximo;
};

// Obtener número de estudiantes en un grupo
GrupoSchema.statics.contarEstudiantes = async function (
    id: string
): Promise<number> {
    const Matricula = model('Matricula');
    return await Matricula.countDocuments({
        gid: new Types.ObjectId(id),
        rol: 'estudiante',
        activo: true
    });
};

// ==========================================
// 🔧 MÉTODOS DE INSTANCIA
// ==========================================

// Verificar si el grupo está lleno
GrupoSchema.methods.estaLleno = async function (): Promise<boolean> {
    if (!this.cupoMaximo) {
        return false;
    }

    const Matricula = model('Matricula');
    const matriculasActivas = await Matricula.countDocuments({
        gid: this._id,
        activo: true
    });

    return matriculasActivas >= this.cupoMaximo;
};

// ==========================================
// 🎯 VIRTUAL FIELDS
// ==========================================

// Virtual para obtener cantidad de estudiantes
GrupoSchema.virtual('cantidadEstudiantes', {
    ref: 'Matricula',
    localField: '_id',
    foreignField: 'gid',
    count: true,
    match: { activo: true, rol: 'estudiante' }
});

// ==========================================
// 🔄 MÉTODO TO JSON (PATRÓN USUARIO)
// ==========================================

GrupoSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret: any) {
        ret.gid = ret._id;  // Convertir _id a gid
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

// ==========================================
// 📤 EXPORTAR MODELO
// ==========================================

const Grupo = model<IGrupo, IGrupoModel>('Grupo', GrupoSchema);

export default Grupo;