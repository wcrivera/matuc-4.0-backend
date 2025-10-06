// src/socket/socket.ts
import { Server as WebSocketServer, Socket as SocketIOSocket } from "socket.io";
import { verifyJWT, verifyToken } from "../middlewares/auth.middleware";

interface SocketUser {
  uid: string;
  matricula: {
    mid: string;
    cid: string;
    gid: string;
    rol: string;
  };
  conectadoAt: Date;
}

export default class SocketHandler {
  private io: WebSocketServer;
  private usuariosConectados: Map<string, SocketUser> = new Map();

  constructor(io: WebSocketServer) {
    this.io = io;
    this.configurarMiddleware();
    this.configurarEventos();
  }

  private configurarMiddleware(): void {
    this.io.use((socket: SocketIOSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query["x-token"];
      const matricula = socket.handshake.query["matricula"];

      // if (!token || !matricula) {
      //   return next(new Error("Token y matrícula requeridos"));
      // }

      if (!token || !matricula) {
        socket.disconnect();
        return;
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        socket.disconnect();
        return;
      }

      const uid = decoded.uid;

      try {
        const matriculaData = JSON.parse(matricula.toString());
        socket.data = {
          uid,
          matricula: matriculaData,
          autenticado: true
        };
        next();
      } catch {
        next(new Error("Datos de matrícula inválidos"));
      }
    });
  }

  private configurarEventos(): void {
    this.io.on("connection", (socket: SocketIOSocket) => {
      this.manejarConexion(socket);
    });
  }

  private manejarConexion(socket: SocketIOSocket): void {
    const { uid, matricula } = socket.data;
    const sala = `${matricula.cid}-${matricula.gid}`;

    // Unir a salas
    socket.join(sala);
    socket.join(uid);

    // Registrar usuario
    this.usuariosConectados.set(socket.id, {
      uid,
      matricula,
      conectadoAt: new Date()
    });

    console.log(`🔌 Usuario ${uid} conectado a sala ${sala}`);

    // Eventos del socket
    this.configurarEventosSocket(socket);

    // Notificar usuarios conectados
    this.notificarUsuariosConectados(sala);

    // Desconexión
    socket.on("disconnect", () => {
      this.manejarDesconexion(socket);
    });
  }

  private configurarEventosSocket(socket: SocketIOSocket): void {
    const { uid, matricula } = socket.data;
    const sala = `${matricula.cid}-${matricula.gid}`;

    // Activar sección (solo profesores)
    socket.on("activo-seccion", (datos) => {
      if (matricula.rol === "Profesor" || matricula.rol === "Administrador") {
        this.io.to(sala).emit("activo-seccion", {
          ...datos,
          activadoPor: uid,
          timestamp: new Date()
        });
      }
    });

    // Activar ejercicio (solo profesores)
    socket.on("activo-ejercicio", (ejercicio) => {
      if (matricula.rol === "Profesor" || matricula.rol === "Administrador") {
        this.io.to(sala).emit("activo-ejercicio", {
          ...ejercicio,
          activadoPor: uid,
          timestamp: new Date()
        });
      }
    });

    // Respuesta DBQ
    socket.on("dbq", (respuesta) => {
      socket.emit("dbq-cliente", {
        ok: true,
        data: respuesta,
        timestamp: new Date()
      });
    });

    // Ping/Pong
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });
  }

  private manejarDesconexion(socket: SocketIOSocket): void {
    const usuario = this.usuariosConectados.get(socket.id);
    if (!usuario) return;

    const { uid, matricula } = usuario;
    const sala = `${matricula.cid}-${matricula.gid}`;

    this.usuariosConectados.delete(socket.id);
    console.log(`🔌 Usuario ${uid} desconectado de sala ${sala}`);

    this.notificarUsuariosConectados(sala);
  }

  private notificarUsuariosConectados(sala: string): void {
    const usuariosEnSala = Array.from(this.usuariosConectados.values())
      .filter(usuario => `${usuario.matricula.cid}-${usuario.matricula.gid}` === sala);

    this.io.to(sala).emit("usuarios-conectados", {
      usuarios: usuariosEnSala.map(u => ({
        uid: u.uid,
        rol: u.matricula.rol,
        conectadoAt: u.conectadoAt
      })),
      total: usuariosEnSala.length,
      timestamp: new Date()
    });
  }

  // Métodos públicos para uso externo
  public enviarASala(sala: string, evento: string, datos: any): void {
    this.io.to(sala).emit(evento, datos);
  }

  public obtenerInfoServidor(): any {
    return {
      totalConectados: this.usuariosConectados.size,
      timestamp: new Date()
    };
  }
}