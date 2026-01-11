import { IsBoolean, IsInt, Min } from 'class-validator';

export class CreateOrderDescriptionDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsBoolean()
  is_rush: boolean;
}
