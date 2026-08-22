import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: { id: string; handshake: { query: Record<string, string> }; join: (room: string) => void }) {
    const role = client.handshake.query.role;
    this.logger.log(`Client connected: ${client.id} (role: ${role})`);

    // Join role-specific rooms
    if (role) {
      client.join(role);
      this.logger.log(`Client ${client.id} joined room: ${role}`);
    }
  }

  handleDisconnect(client: { id: string }) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Emit to specific kitchen
  emitToKitchen(kitchen: string, event: string, data: unknown) {
    this.server.to(kitchen).emit(event, data);
  }

  // Emit to all cashiers
  emitToCashier(event: string, data: unknown) {
    this.server.to('CASHIER').emit(event, data);
  }

  // Emit to all waiters
  emitToWaiter(event: string, data: unknown) {
    this.server.to('WAITER').emit(event, data);
  }

  // Emit to admin
  emitToAdmin(event: string, data: unknown) {
    this.server.to('ADMIN').emit(event, data);
  }

  // Emit to everyone
  emitToAll(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  // ─── Typed order event helpers ─────────────────────────────────

  emitNewOrder(order: unknown) {
    this.server.emit('order:new', order);
  }

  emitOrderStatusUpdate(order: unknown) {
    this.server.emit('order:statusUpdate', order);
  }

  emitKitchenStatusUpdate(data: unknown) {
    this.server.emit('kitchen:statusUpdate', data);
  }
}
