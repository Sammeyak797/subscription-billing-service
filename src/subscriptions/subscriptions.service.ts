import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Plan } from '../plans/plan.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Subscription } from './subscription.entity';
import { SubscriptionStatus } from './subscription-status.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const tenant = await this.tenantRepository.findOne({
      where: {
        id: createSubscriptionDto.tenantId,
        active: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Active tenant not found');
    }

    const plan = await this.planRepository.findOne({
      where: {
        id: createSubscriptionDto.planId,
        active: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Active plan not found');
    }

    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        tenantId: tenant.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'Tenant already has an active subscription',
      );
    }

    const startDate = new Date();

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.billingIntervalDays);

    const subscription = this.subscriptionRepository.create({
      tenantId: tenant.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: {
        tenant: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async cancel(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.endDate = new Date();

    return this.subscriptionRepository.save(subscription);
  }
}
