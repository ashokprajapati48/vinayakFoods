import { IsEnum, IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
  CREDIT = 'CREDIT',
}

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsEnum(PaymentMethodEnum)
  method: PaymentMethodEnum;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
