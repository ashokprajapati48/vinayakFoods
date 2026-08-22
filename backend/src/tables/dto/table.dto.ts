import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

enum TableStatusEnum {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

export class UpdateTableStatusDto {
  @IsEnum(TableStatusEnum)
  status: TableStatusEnum;
}

export class CreateTableDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  number: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  capacity?: number;
}
