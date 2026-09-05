import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Invoice } from '../invoices/invoice.entity';
import { PaymentEvent } from './payment-event.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentProcessor } from './payment.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payment-events',
    }),

    TypeOrmModule.forFeature([PaymentEvent, Invoice]),
  ],

  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentProcessor],
})
export class PaymentsModule {}
