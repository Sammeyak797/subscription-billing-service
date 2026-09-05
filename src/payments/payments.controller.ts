import { Body, Controller, Post } from '@nestjs/common';

import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { PaymentsService } from './payments.service';

@Controller('webhooks/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async handleWebhook(@Body() webhook: PaymentWebhookDto) {
    return this.paymentsService.handleWebhook(webhook);
  }
}
