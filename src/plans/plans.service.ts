import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePlanDto } from './dto/create-plan.dto';
import { Plan } from './plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create(createPlanDto);

    const savedPlan = await this.planRepository.save(plan);

    await this.cacheManager.del('plans:active');

    return savedPlan;
  }

  async findAll(): Promise<Plan[]> {
    const cacheKey = 'plans:active';

    const cachedPlans = await this.cacheManager.get<Plan[]>(cacheKey);

    if (cachedPlans) {
      return cachedPlans;
    }

    const plans = await this.planRepository.find({
      where: {
        active: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    await this.cacheManager.set(cacheKey, plans, 60000);

    return plans;
  }

  async count(): Promise<number> {
    return this.planRepository.count();
  }
}
