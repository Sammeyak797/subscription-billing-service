import { Controller, Get, Param, Post } from '@nestjs/common';

import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post(':subscriptionId')
  async create(@Param('subscriptionId') subscriptionId: string) {
    return this.invoicesService.createForSubscription(subscriptionId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get('tenant/:tenantId')
  async findByTenant(@Param('tenantId') tenantId: string) {
    return this.invoicesService.findByTenant(tenantId);
  }
}
