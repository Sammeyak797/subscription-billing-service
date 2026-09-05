import { Controller, Get } from '@nestjs/common';

import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('count')
  async count() {
    return {
      count: await this.plansService.count(),
    };
  }
}
