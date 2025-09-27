import { Schema, Types, model } from 'mongoose';

// ==========================================
// 📚 INTERFACE CURSO V4 - PATRÓN REFERENCIAS OPTIMIZADO
// ==========================================

interface ICurso {
    // === IDENTIFICADOR PRINCIPAL ===
    cid: Types.ObjectId;        // Identificador principal (como uid en Usuario)

    // === CAMPOS BÁSICOS (COMPATIBILIDAD MATUC 3.0) ===
    sigla: string;              // "MAT1610" - Código del curso 
    nombre: string;             // "Cálculo I" - Nombre del curso
    descripcion: string;        // Descripción completa
    activo: boolean;            // Si está activo (igual que sistema anterior)
    publico: boolean;           // Si es público (igual que sistema anterior)

    // === CAMPOS ACADÉMICOS ESENCIALES ===
    categoria: string;          // "Cálculo", "Álgebra", etc.
    creditos: number;           // Créditos académicos
    semestre: string;           // "2024-1", "2024-2"
    año: number;                // 2024

    // === CONFIGURACIÓN BÁSICA ===
    configuracion: {
        notaAprobacion: number;         // 4.0, 3.0, etc.
        limitePlazas?: number;          // Límite de estudiantes
        requiereAprobacion: boolean;    // Si requiere aprobación para matricularse
        codigoAcceso?: string;          // Código para auto-matricula
    };

    // === METADATA DE AUDITORÍA ===
    fechaCreacion: Date;
    fechaModificacion: Date;
    creadoPor: Types.ObjectId;  // Referencia al usuario creador

    // === ESTADÍSTICAS CALCULADAS ===
    estadisticas: {
        totalEstudiantes: number;
        totalProfesores: number;
        totalModulos: number;
        ultimaActividad: Date;
    };
}

// ==========================================
// 📋 SCHEMA MONGOOSE - PATRÓN REFERENCIAS
// ==========================================

const CursoSchema = new Schema<ICurso>({
    // === CAMPOS EXISTENTES (COMPATIBILIDAD TOTAL) ===
    sigla: {
        type: String,
        required: [true, 'La sigla del curso es obligatoria'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, 'La sigla debe tener al menos 3 caracteres'],
        maxlength: [10, 'La sigla no puede exceder 10 caracteres'],
        match: [/^[A-Z]{3,4}[0-9]{3,4}$/, 'Formato de sigla inválido (ej: MAT1610)']
    },

    nombre: {
        type: String,
        required: [true, 'El nombre del curso es obligatorio'],
        trim: true,
        minlength: [5, 'El nombre debe tener al menos 5 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },

    descripcion: {
        type: String,
        required: [true, 'La descripción del curso es obligatoria'],
        trim: true,
        minlength: [20, 'La descripción debe tener al menos 20 caracteres'],
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },

    activo: {
        type: Boolean,
        default: false,
        index: true  // Índice para consultas frecuentes
    },

    publico: {
        type: Boolean,
        default: false,
        index: true  // Índice para consultas frecuentes
    },

    // === NUEVOS CAMPOS ESENCIALES ===
    categoria: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        enum: {
            values: ['Cálculo', 'Álgebra', 'Estadística', 'Geometría', 'Análisis', 'Matemática Aplicada', 'Otros'],
            message: 'Categoría no válida'
        },
        index: true
    },

    creditos: {
        type: Number,
        required: [true, 'Los créditos son obligatorios'],
        min: [1, 'Mínimo 1 crédito'],
        max: [12, 'Máximo 12 créditos'],
        validate: {
            validator: Number.isInteger,
            message: 'Los créditos deben ser un número entero'
        }
    },

    semestre: {
        type: String,
        required: [true, 'El semestre es obligatorio'],
        match: [/^20[0-9]{2}-[12]$/, 'Formato de semestre inválido (ej: 2024-1)'],
        index: true
    },

    año: {
        type: Number,
        required: [true, 'El año es obligatorio'],
        min: [2020, 'Año mínimo: 2020'],
        max: [2030, 'Año máximo: 2030'],
        index: true
    },

    // === CONFIGURACIÓN ACADÉMICA ===
    configuracion: {
        notaAprobacion: {
            type: Number,
            required: [true, 'La nota de aprobación es obligatoria'],
            min: [1.0, 'Nota mínima: 1.0'],
            max: [7.0, 'Nota máxima: 7.0'],
            default: 4.0
        },
        limitePlazas: {
            type: Number,
            min: [1, 'Mínimo 1 plaza'],
            max: [500, 'Máximo 500 plazas'],
            validate: {
                validator: function (v: number) {
                    return v === undefined || Number.isInteger(v);
                },
                message: 'El límite de plazas debe ser un número entero'
            }
        },
        requiereAprobacion: {
            type: Boolean,
            default: false
        },
        codigoAcceso: {
            type: String,
            trim: true,
            minlength: [4, 'El código debe tener al menos 4 caracteres'],
            maxlength: [20, 'El código no puede exceder 20 caracteres'],
            match: [/^[A-Za-z0-9]+$/, 'El código solo puede contener letras y números']
        }
    },

    // === METADATA DE AUDITORÍA ===
    fechaCreacion: {
        type: Date,
        default: Date.now,
        immutable: true  // No se puede modificar después de crear
    },

    fechaModificacion: {
        type: Date,
        default: Date.now
    },

    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El creador es obligatorio'],
        immutable: true  // No se puede modificar después de crear
    },

    // === ESTADÍSTICAS CALCULADAS ===
    estadisticas: {
        totalEstudiantes: {
            type: Number,
            default: 0,
            min: [0, 'No puede ser negativo']
        },
        totalProfesores: {
            type: Number,
            default: 0,
            min: [0, 'No puede ser negativo']
        },
        totalModulos: {
            type: Number,
            default: 0,
            min: [0, 'No puede ser negativo']
        },
        ultimaActividad: {
            type: Date,
            default: Date.now
        }
    }
}, {
    // === CONFIGURACIÓN DEL SCHEMA ===
    timestamps: false,  // Usamos fechaCreacion/fechaModificacion customizadas
    versionKey: false,  // Eliminar __v
    collection: 'cursos'
});

// ==========================================
// 🔧 MIDDLEWARE PRE-SAVE OPTIMIZADO
// ==========================================

// Actualizar fecha de modificación automáticamente
CursoSchema.pre('save', function (next) {
    if (!this.isNew) {
        (this as any).fechaModificacion = new Date();
    }
    next();
});

// Actualizar fecha de modificación en updates
CursoSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    this.set({ fechaModificacion: new Date() });
    next();
});

// ==========================================
// 📊 ÍNDICES MANUALES (después de definir schema)
// ==========================================

// Índices para consultas optimizadas
CursoSchema.index({ sigla: 1 }, { unique: true });
CursoSchema.index({ activo: 1, publico: 1 });
CursoSchema.index({ categoria: 1, año: 1, semestre: 1 });
CursoSchema.index({ creadoPor: 1, fechaCreacion: -1 });

// ==========================================
// 🔄 MÉTODO TO JSON (PATRÓN USUARIO)
// ==========================================

CursoSchema.method('toJSON', function () {
    const { _id, ...object } = this.toObject();
    object.cid = _id;  // Convertir _id a cid (como uid en Usuario)
    return object;
});

// ==========================================
// 📊 MÉTODOS DE INSTANCIA
// ==========================================

// Verificar si el curso está disponible para matricula
CursoSchema.methods.estaDisponibleParaMatricula = function (): boolean {
    return this.activo &&
        this.publico &&
        (!this.configuracion.limitePlazas ||
            this.estadisticas.totalEstudiantes < this.configuracion.limitePlazas);
};

// Obtener resumen básico del curso
CursoSchema.methods.getResumen = function () {
    return {
        cid: this._id,
        sigla: this.sigla,
        nombre: this.nombre,
        categoria: this.categoria,
        creditos: this.creditos,
        activo: this.activo,
        publico: this.publico,
        totalEstudiantes: this.estadisticas.totalEstudiantes
    };
};

// ==========================================
// 📈 MÉTODOS ESTÁTICOS
// ==========================================

// Buscar cursos activos por categoría
CursoSchema.statics.buscarPorCategoria = function (categoria: string) {
    return this.find({
        categoria,
        activo: true,
        publico: true
    }).select('sigla nombre descripcion creditos estadisticas.totalEstudiantes');
};

// Buscar cursos por semestre y año
CursoSchema.statics.buscarPorPeriodo = function (año: number, semestre: string) {
    return this.find({ año, semestre, activo: true })
        .populate('creadoPor', 'nombre apellido email')
        .sort({ sigla: 1 });
};

// ==========================================
// 📤 EXPORT MODELO
// ==========================================

export default model<ICurso>('Curso', CursoSchema);