import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

import { ChangePlanDto } from './dto/change-plan.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancel(id);
  }

  @Post(':id/change-plan')
  async changePlan(
    @Param('id') id: string,
    @Body() changePlanDto: ChangePlanDto,
  ) {
    return this.subscriptionsService.changePlan(id, changePlanDto.newPlanId);
  }
}
