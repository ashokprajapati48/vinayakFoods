import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CreditService } from './credit.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class RecordCreditPaymentDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('credit')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('outstanding')
  getOutstanding() {
    return this.creditService.getOutstandingCredits();
  }

  @Get('ledger')
  getLedger(@Query('customerId') customerId?: string) {
    return this.creditService.getAllCreditLedger(customerId);
  }

  @Get('customer/:customerId')
  getCustomerCredit(@Param('customerId') customerId: string) {
    return this.creditService.getCustomerCredit(customerId);
  }

  @Post('customer/:customerId/payment')
  recordPayment(
    @Param('customerId') customerId: string,
    @Body() body: RecordCreditPaymentDto,
  ) {
    return this.creditService.recordCreditPayment(
      customerId,
      body.amount,
      body.description || 'Credit payment',
    );
  }
}
