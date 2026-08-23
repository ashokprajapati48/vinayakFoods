import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import {
  CreateOrderDto,
  UpdateKitchenStatusDto,
  UpdateOrderStatusDto,
} from './dto/order.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('type') type?: string,
  ) {
    return this.ordersService.findAll({ status, date, type });
  }

  @Get('ready')
  getReadyOrders() {
    return this.ordersService.getReadyOrders();
  }

  @Get('kitchen/:kitchen')
  getKitchenOrders(@Param('kitchen') kitchen: string) {
    return this.ordersService.getKitchenOrders(kitchen);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req: { user: { id: string } }) {
    return this.ordersService.create(dto, req.user.id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Put(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }

  @Put(':orderId/kitchen/:kitchen/status')
  updateKitchenStatus(
    @Param('orderId') orderId: string,
    @Param('kitchen') kitchen: string,
    @Body() body: UpdateKitchenStatusDto,
  ) {
    return this.ordersService.updateKitchenOrderStatus(orderId, kitchen, body.status);
  }
}
