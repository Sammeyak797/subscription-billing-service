import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsIn(['payment.succeeded', 'payment.failed'])
  type: string;

  @IsUUID()
  invoiceId: string;
}
