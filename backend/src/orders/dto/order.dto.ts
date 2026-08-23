import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderTypeEnum {
  DINE_IN = 'DINE_IN',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatusEnum {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COLLECTED = 'COLLECTED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsEnum(OrderTypeEnum)
  type: OrderTypeEnum;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  // Delivery specific
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  deliveryPhone?: string;

  @IsOptional()
  @IsString()
  deliveryNotes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;
}

export enum KitchenStatusEnum {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  READY = 'READY',
}

export class UpdateKitchenStatusDto {
  @IsEnum(KitchenStatusEnum)
  status: KitchenStatusEnum;
}
