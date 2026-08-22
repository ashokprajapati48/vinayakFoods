import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Role } from '../../common/enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsEnum(Role)
  role!: Role;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
