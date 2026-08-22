import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
  CREDIT = 'CREDIT',
}

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsDateString()
  date: string;

  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;
}
