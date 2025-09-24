// src/models/Usuario.ts
import { Schema, Types, model, Document } from 'mongoose';

// Interface del Usuario
export interface IUsuario extends Document {
    uid: Types.ObjectId;
    nombre: string;
    apellido: string;
    email: string;
    admin: boolean;
    activo: boolean;
    conectado: boolean;
    ultimaConexion?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Schema de Usuario
const UsuarioSchema = new Schema<IUsuario>({
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    apellido: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    admin: {
        type: Boolean,
        required: true,
        default: false
    },

    activo: {
        type: Boolean,
        required: true,
        default: true
    },

    conectado: {
        type: Boolean,
        default: false
    },

    ultimaConexion: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true,
    versionKey: false
});

// Virtual para uid
UsuarioSchema.virtual('uid').get(function (this: IUsuario) {
    return this._id;
});

// Transformación para JSON
UsuarioSchema.method("toJSON", function () {
    const { _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

// Índices
UsuarioSchema.index({ email: 1 });
UsuarioSchema.index({ conectado: 1 });

// Exportar modelo
const Usuario = model<IUsuario>('Usuario', UsuarioSchema);

export default Usuario;