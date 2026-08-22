import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDecimal,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum KitchenEnum {
  KITCHEN_1 = 'KITCHEN_1',
  KITCHEN_2 = 'KITCHEN_2',
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(KitchenEnum)
  kitchen: KitchenEnum;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(KitchenEnum)
  kitchen?: KitchenEnum;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
