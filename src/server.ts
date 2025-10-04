// src/server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server as WebSocketServer } from 'socket.io';

import { connectDB } from './config/database';
import { config } from './config/environment';
import SocketHandler from './socket/socket';

// Import routes
import authRoutes from './routes/auth.routes';
import cursoRoutes from './routes/curso.routes';

export default class Server {
    public app: express.Express;
    public port: string;
    public server: http.Server;
    public io!: WebSocketServer;
    public sockets!: SocketHandler;

    constructor() {
        this.app = express();
        this.port = config.PORT;

        this.connectDatabase();
        this.server = http.createServer(this.app);
        this.configureSocketIO();
        this.middlewares();
        this.routes();
        this.errorHandling();
    }

    private async connectDatabase(): Promise<void> {
        try {
            await connectDB();
        } catch (error) {
            console.error('❌ Error conectando base de datos:', error);
            process.exit(1);
        }
    }

    private configureSocketIO(): void {
        this.io = new WebSocketServer(this.server, {
            cors: {
                origin: config.FRONTEND_URL,
                methods: ["GET", "POST"]
            }
        });

        this.sockets = new SocketHandler(this.io);
    }

    private middlewares(): void {
        // Seguridad básica
        this.app.use(helmet());
        this.app.use(compression());

        // Rate limiting
        this.app.use(rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100
        }));

        // CORS
        this.app.use(cors({
            origin: config.FRONTEND_URL,
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    private routes(): void {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString()
            });
        });

        // API Routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/curso', cursoRoutes);
    }

    private errorHandling(): void {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                ok: false,
                message: 'Ruta no encontrada'
            });
        });

        // Error handler
        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('❌ Error:', err);
            res.status(500).json({
                ok: false,
                message: 'Error interno del servidor'
            });
        });
    }

    public execute(): void {
        this.server.listen(this.port, () => {
            console.log(`🚀 Servidor MATUC v4 corriendo en puerto ${this.port}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            this.server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
        });
    }
}