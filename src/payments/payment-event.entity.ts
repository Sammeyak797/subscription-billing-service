import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('payment_events')
@Unique(['eventId'])
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  eventId: string;

  @Column({ length: 100 })
  type: string;

  @Column({ length: 100 })
  invoiceId: string;

  @CreateDateColumn()
  createdAt: Date;
}
