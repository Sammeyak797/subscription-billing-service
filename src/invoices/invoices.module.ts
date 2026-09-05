import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subscription } from '../subscriptions/subscription.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Invoice } from './invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Subscription, Tenant])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
