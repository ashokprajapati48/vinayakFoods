import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/payment.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query('date') date?: string, @Query('method') method?: string) {
    return this.paymentsService.findAll({ date, method });
  }

  @Get('summary/today')
  getTodaySummary() {
    return this.paymentsService.getTodaySummary();
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Post()
  create(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.paymentsService.create(dto, req.user.id);
  }
}
