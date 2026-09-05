import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';

import { Invoice } from '../invoices/invoice.entity';
import { InvoiceStatus } from '../invoices/invoice-status.enum';
import { PaymentEvent } from './payment-event.entity';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectQueue('payment-events')
    private readonly paymentQueue: Queue,

    @InjectRepository(PaymentEvent)
    private readonly paymentEventRepository: Repository<PaymentEvent>,

    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async handleWebhook(webhook: PaymentWebhookDto) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: webhook.invoiceId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const existingEvent = await this.paymentEventRepository.findOne({
      where: {
        eventId: webhook.eventId,
      },
    });

    if (existingEvent) {
      throw new ConflictException('Webhook event already processed');
    }

    try {
      await this.paymentEventRepository.save({
        eventId: webhook.eventId,
        type: webhook.type,
        invoiceId: webhook.invoiceId,
      });
    } catch {
      throw new ConflictException('Webhook event already processed');
    }

    await this.paymentQueue.add(
      'process-payment',
      {
        eventId: webhook.eventId,
        type: webhook.type,
        invoiceId: webhook.invoiceId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    return {
      accepted: true,
      eventId: webhook.eventId,
      status: 'QUEUED',
    };
  }
}
