// src/config/database.ts
import mongoose from 'mongoose';
import { config } from './environment';

// Configuración básica
mongoose.set('strictQuery', false);

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(config.MONGODB_URI);

        console.log(`🗄️ MongoDB conectado: ${conn.connection.host}`);
        console.log(`📂 Base de datos: ${conn.connection.name}`);

    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
};

// Eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB: Conexión establecida');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 MongoDB: Error de conexión:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 MongoDB: Conexión perdida');
});

// Cerrar conexión al terminar la aplicación
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB: Conexión cerrada por terminación de app');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cerrando conexión MongoDB:', error);
        process.exit(1);
    }
});