// src/config/environment.ts
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const config = {
    PORT: process.env.PORT || '8080',
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/matuc-v4',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',

    // CORS
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};

// Validar variables críticas en producción
if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET === 'default-secret-change-in-production') {
        console.error('❌ JWT_SECRET debe ser configurado en producción');
        process.exit(1);
    }

    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI debe ser configurado en producción');
        process.exit(1);
    }
}

export default config;