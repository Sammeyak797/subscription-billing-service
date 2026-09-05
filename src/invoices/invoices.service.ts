import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Subscription } from '../subscriptions/subscription.entity';
import { SubscriptionStatus } from '../subscriptions/subscription-status.enum';
import { Invoice } from './invoice.entity';
import { InvoiceStatus } from './invoice-status.enum';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createForSubscription(subscriptionId: string): Promise<Invoice> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        id: subscriptionId,
      },
      relations: {
        plan: true,
        tenant: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active subscriptions can be invoiced',
      );
    }

    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        subscriptionId,
        periodStart: subscription.startDate,
        periodEnd: subscription.endDate,
      },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        'Invoice already exists for this billing period',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const invoice = manager.create(Invoice, {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        amount: subscription.plan.price,
        currency: subscription.plan.currency,
        status: InvoiceStatus.PENDING,
        periodStart: subscription.startDate,
        periodEnd: subscription.endDate,
      });

      return manager.save(Invoice, invoice);
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id,
      },
      relations: {
        tenant: true,
        subscription: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findByTenant(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: {
        tenantId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
