import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Invoice } from '../invoices/invoice.entity';
import { InvoiceStatus } from '../invoices/invoice-status.enum';

interface PaymentJob {
  eventId: string;
  type: string;
  invoiceId: string;
}

@Processor('payment-events')
export class PaymentProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {
    super();
  }

  async process(job: Job<PaymentJob>): Promise<void> {
    const { type, invoiceId } = job.data;

    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (type === 'payment.succeeded') {
      invoice.status = InvoiceStatus.PAID;
    }

    if (type === 'payment.failed') {
      invoice.status = InvoiceStatus.FAILED;
    }

    await this.invoiceRepository.save(invoice);

    console.log(
      `Processed payment event ${job.data.eventId} for invoice ${invoiceId}`,
    );
  }
}
