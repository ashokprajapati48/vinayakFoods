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

export enum StaffStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PaymentMethodEnum {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
  CREDIT = 'CREDIT',
}

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary: number;

  @IsDateString()
  joiningDate: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary?: number;

  @IsOptional()
  @IsEnum(StaffStatusEnum)
  status?: StaffStatusEnum;
}

export class RecordSalaryDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  month: number;

  @IsNumber()
  @Min(2000)
  @Type(() => Number)
  year: number;

  @IsDateString()
  paymentDate: string;

  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @IsOptional()
  @IsString()
  notes?: string;
}
