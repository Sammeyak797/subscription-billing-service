import { IsUUID } from 'class-validator';

export class ChangePlanDto {
  @IsUUID()
  newPlanId: string;
}
