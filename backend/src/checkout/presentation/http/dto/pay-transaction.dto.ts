import { IsString, Length } from 'class-validator';

export class PayTransactionDto {
  @IsString()
  @Length(13, 19)
  cardNumber: string;

  @IsString()
  @Length(2, 2)
  expMonth: string;

  @IsString()
  @Length(2, 4)
  expYear: string;

  @IsString()
  @Length(3, 4)
  cvc: string;

  @IsString()
  @Length(2, 80)
  cardHolder: string;
}
