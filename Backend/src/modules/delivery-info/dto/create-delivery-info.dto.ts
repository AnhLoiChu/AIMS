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


}