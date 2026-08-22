import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
