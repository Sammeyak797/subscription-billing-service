import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreatePlanDto } from './dto/create-plan.dto';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  async create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  async findAll() {
    return this.plansService.findAll();
  }

  @Get('count')
  async count() {
    return {
      count: await this.plansService.count(),
    };
  }
}
