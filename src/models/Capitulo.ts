// src/models/Capitulo.ts
// ==========================================
// 📖 MODELO CAPÍTULO - MATUC v4.0
// ==========================================

import { Schema, model, Document, Types } from 'mongoose';

// ==========================================
// 📋 INTERFACES
// ==========================================

// Tipos de tema
export type TipoTema = 'teorico' | 'practico' | 'evaluativo' | 'mixto';

// Tipos de contenido
export type TipoContenido = 'teoria' | 'ejemplo' | 'ejercicio' | 'video' | 'latex' | 'simulacion';

// Interface para Habilitación por Grupo
interface IHabilitacionGrupo {
    grupoId: Types.ObjectId;
    habilitado: boolean;
    fechaHabilitacion?: Date;
    fechaDeshabilitacion?: Date;
    habilitadoPor: Types.ObjectId;  // UID del profesor
    notas?: string;
}

// Interface para Contenido
interface IContenido {
    titulo: string;
    tipo: TipoContenido;
    contenido: string;  // HTML, LaTeX, URL, etc.
    orden: number;
    visible: boolean;
    obligatorio: boolean;
    completable: boolean;
    habilitacionPorGrupo: IHabilitacionGrupo[];
}

// Interface para Tema
interface ITema {
    titulo: string;
    descripcion: string;
    orden: number;
    visible: boolean;
    tipo: TipoTema;
    estimacionMinutos: number;
    contenidos: IContenido[];
}

// Interface del Documento Principal
export interface ICapitulo extends Document {
    cid: Types.ObjectId;           // ID del curso
    titulo: string;
    descripcion: string;
    orden: number;
    visible: boolean;
    fechaPublicacion?: Date;
    objetivos: string[];
    temas: ITema[];

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// 🗄️ SCHEMA DE HABILITACIÓN POR GRUPO
// ==========================================

const HabilitacionGrupoSchema = new Schema<IHabilitacionGrupo>({
    grupoId: {
        type: Schema.Types.ObjectId,
        ref: 'Grupo',
        required: [true, 'El ID del grupo es requerido']
    },

    habilitado: {
        type: Boolean,
        default: false
    },

    fechaHabilitacion: {
        type: Date
    },

    fechaDeshabilitacion: {
        type: Date
    },

    habilitadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario que habilita es requerido']
    },

    notas: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    }
}, {
    _id: false  // No necesita _id propio
});

// ==========================================
// 🗄️ SCHEMA DE CONTENIDO
// ==========================================

const ContenidoSchema = new Schema<IContenido>({
    titulo: {
        type: String,
        required: [true, 'El título del contenido es obligatorio'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },

    tipo: {
        type: String,
        enum: {
            values: ['teoria', 'ejemplo', 'ejercicio', 'video', 'latex', 'simulacion'],
            message: 'Tipo de contenido inválido'
        },
        required: [true, 'El tipo de contenido es obligatorio']
    },

    contenido: {
        type: String,
        required: [true, 'El contenido es obligatorio'],
        trim: true
    },

    orden: {
        type: Number,
        required: [true, 'El orden es obligatorio'],
        min: [1, 'El orden debe ser mayor a 0']
    },

    visible: {
        type: Boolean,
        default: true
    },

    obligatorio: {
        type: Boolean,
        default: false
    },

    completable: {
        type: Boolean,
        default: true
    },

    habilitacionPorGrupo: {
        type: [HabilitacionGrupoSchema],
        default: []
    }
}, {
    _id: true  // Sí necesita _id para referencia
});

// ==========================================
// 🗄️ SCHEMA DE TEMA
// ==========================================

const TemaSchema = new Schema<ITema>({
    titulo: {
        type: String,
        required: [true, 'El título del tema es obligatorio'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },

    descripcion: {
        type: String,
        required: [true, 'La descripción del tema es obligatoria'],
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },

    orden: {
        type: Number,
        required: [true, 'El orden es obligatorio'],
        min: [1, 'El orden debe ser mayor a 0']
    },

    visible: {
        type: Boolean,
        default: true
    },

    tipo: {
        type: String,
        enum: {
            values: ['teorico', 'practico', 'evaluativo', 'mixto'],
            message: 'Tipo de tema inválido'
        },
        required: [true, 'El tipo de tema es obligatorio']
    },

    estimacionMinutos: {
        type: Number,
        required: [true, 'La estimación de minutos es obligatoria'],
        min: [1, 'La estimación debe ser mayor a 0'],
        max: [999, 'La estimación no puede exceder 999 minutos']
    },

    contenidos: {
        type: [ContenidoSchema],
        default: []
    }
}, {
    _id: true  // Sí necesita _id para referencia
});

// ==========================================
// 🗄️ SCHEMA PRINCIPAL DE CAPÍTULO
// ==========================================

const CapituloSchema = new Schema<ICapitulo>({
    cid: {
        type: Schema.Types.ObjectId,
        ref: 'Curso',
        required: [true, 'El ID del curso es obligatorio'],
        index: true
    },

    titulo: {
        type: String,
        required: [true, 'El título del capítulo es obligatorio'],
        trim: true,
        minlength: [3, 'El título debe tener al menos 3 caracteres'],
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },

    descripcion: {
        type: String,
        required: [true, 'La descripción del capítulo es obligatoria'],
        trim: true,
        minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
        maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },

    orden: {
        type: Number,
        required: [true, 'El orden del capítulo es obligatorio'],
        min: [1, 'El orden debe ser mayor a 0']
    },

    visible: {
        type: Boolean,
        default: true,
        index: true
    },

    fechaPublicacion: {
        type: Date
    },

    objetivos: {
        type: [String],
        default: [],
        validate: {
            validator: function (arr: string[]) {
                return arr.every(obj => obj.trim().length > 0 && obj.length <= 500);
            },
            message: 'Cada objetivo debe tener contenido y no exceder 500 caracteres'
        }
    },

    temas: {
        type: [TemaSchema],
        default: []
    }
}, {
    timestamps: true,
    versionKey: false,
    collection: 'capitulos'
});

// ==========================================
// 📊 ÍNDICES
// ==========================================

CapituloSchema.index({ cid: 1, orden: 1 });
CapituloSchema.index({ cid: 1, visible: 1 });
CapituloSchema.index({ 'temas._id': 1 });
CapituloSchema.index({ 'temas.contenidos._id': 1 });

// ==========================================
// 🔄 MÉTODO TO JSON
// ==========================================

CapituloSchema.method('toJSON', function () {
    const obj = this.toObject();
    const { _id, ...object } = obj;
    return {
        id: _id,
        ...object
    };
});

// ==========================================
// 📊 MÉTODOS DE INSTANCIA
// ==========================================

// Obtener cantidad total de contenidos
CapituloSchema.methods.getTotalContenidos = function (): number {
    return this.temas.reduce((total: number, tema: ITema) => total + tema.contenidos.length, 0);
};

// Obtener contenidos habilitados para un grupo específico
CapituloSchema.methods.getContenidosHabilitadosParaGrupo = function (grupoId: string): number {
    let count = 0;
    this.temas.forEach((tema: ITema) => {
        tema.contenidos.forEach((contenido: IContenido) => {
            const habilitacion = contenido.habilitacionPorGrupo.find(
                (h: IHabilitacionGrupo) => h.grupoId.toString() === grupoId
            );
            if (habilitacion?.habilitado) {
                count++;
            }
        });
    });
    return count;
};

// Verificar si el capítulo está visible para un rol específico
CapituloSchema.methods.esVisiblePara = function (rol: string): boolean {
    if (rol === 'estudiante') {
        return this.visible;
    }
    // Profesores, ayudantes y admins ven todo
    return true;
};

// ==========================================
// 📊 MÉTODOS ESTÁTICOS
// ==========================================

// Obtener capítulos de un curso ordenados
CapituloSchema.statics.obtenerPorCurso = function (cursoId: string) {
    return this.find({ cid: cursoId })
        .sort({ orden: 1 })
        .exec();
};

// Obtener capítulos visibles de un curso
CapituloSchema.statics.obtenerVisiblesPorCurso = function (cursoId: string) {
    return this.find({ cid: cursoId, visible: true })
        .sort({ orden: 1 })
        .exec();
};

// ==========================================
// 🔧 MIDDLEWARE PRE-SAVE
// ==========================================

// Validar que el curso existe antes de guardar
CapituloSchema.pre('save', async function (next) {
    if (this.isNew) {
        const Curso = model('Curso');
        const cursoExiste = await Curso.exists({ _id: this.cid });

        if (!cursoExiste) {
            throw new Error('El curso no existe');
        }
    }
    next();
});

// ==========================================
// 📤 EXPORTAR MODELO
// ==========================================

const Capitulo = model<ICapitulo>('Capitulo', CapituloSchema);

export default Capitulo;