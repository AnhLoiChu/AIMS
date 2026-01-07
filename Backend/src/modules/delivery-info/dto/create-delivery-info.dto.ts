import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateDeliveryInfoDto {
  @IsString()
  recipient_name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  province: string;

  @IsString()
  address: string;

  @IsOptional()
  @Transform(({ value }) => value ?? null)
  @IsString()
  instruction?: string | null;

  @IsOptional()
  @Transform(({ value }) => value ?? null)
  @Type(() => Date)
  @IsDate()
  delivery_time?: Date | null;
}