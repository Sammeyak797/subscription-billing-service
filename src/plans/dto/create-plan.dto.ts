import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  price: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  billingIntervalDays: number;
}
