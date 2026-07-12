import { IsEmail, IsInt, IsPositive, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEmail()
  customerEmail: string;
}
