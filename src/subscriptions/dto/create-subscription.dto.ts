import { IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  planId: string;
}
