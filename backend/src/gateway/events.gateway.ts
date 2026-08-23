import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { corsOrigin } from '../common/cors.js';
import { normalizeDecimals } from '../common/interceptors/serialize.interceptor.js';

@WebSocketGateway({
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: {
    id: string;
    handshake: { query: Record<string, string> };
    join: (room: string) => void;
  }) {
    const role = client.handshake.query.role;
    this.logger.log(`Client connected: ${client.id} (role: ${role ?? 'none'})`);

    // Join role-specific rooms
    if (role) {
      client.join(role);
      this.logger.log(`Client ${client.id} joined room: ${role}`);
    }
  }

  handleDisconnect(client: { id: string }) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Socket payloads bypass the HTTP serialize interceptor, so normalize here too —
   * otherwise kitchen/cashier screens receive Decimal money fields as strings.
   */
  private broadcast(event: string, data: unknown) {
    if (!this.server) {
      this.logger.warn(`Socket server not ready; dropped "${event}"`);
      return;
    }
    this.server.emit(event, normalizeDecimals(data));
  }

  // Emit to specific kitchen
  emitToKitchen(kitchen: string, event: string, data: unknown) {
    this.server?.to(kitchen).emit(event, normalizeDecimals(data));
  }

  // Emit to all cashiers
  emitToCashier(event: string, data: unknown) {
    this.server?.to('CASHIER').emit(event, normalizeDecimals(data));
  }

  // Emit to all waiters
  emitToWaiter(event: string, data: unknown) {
    this.server?.to('WAITER').emit(event, normalizeDecimals(data));
  }

  // Emit to admin
  emitToAdmin(event: string, data: unknown) {
    this.server?.to('ADMIN').emit(event, normalizeDecimals(data));
  }

  // Emit to everyone
  emitToAll(event: string, data: unknown) {
    this.broadcast(event, data);
  }

  // ─── Typed order event helpers ─────────────────────────────────

  emitNewOrder(order: unknown) {
    this.broadcast('order:new', order);
  }

  emitOrderStatusUpdate(order: unknown) {
    this.broadcast('order:statusUpdate', order);
  }

  emitKitchenStatusUpdate(data: unknown) {
    this.broadcast('kitchen:statusUpdate', data);
  }

  emitPaymentRecorded(payment: unknown) {
    this.broadcast('payment:recorded', payment);
  }

  emitTableUpdate(table: unknown) {
    this.broadcast('table:statusUpdate', table);
  }
}
