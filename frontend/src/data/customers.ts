import type { Customer } from '../types/billing';

export interface CustomerRecord extends Customer {
  subscriptionId: string;
  planId: string;
}

export const customers: CustomerRecord[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Acme Corp',
    plan: 'Enterprise',
    subscriptionStatus: 'ACTIVE',
    mrr: 999,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440001',
    planId: '550e8400-e29b-41d4-a716-446655440004',
  },
  {
    id: '987e6543-e21b-12d3-a456-426614174111',
    name: 'Beta Labs',
    plan: 'Pro',
    subscriptionStatus: 'ACTIVE',
    mrr: 299,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440002',
    planId: '550e8400-e29b-41d4-a716-446655440002',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    name: 'Nova Technologies',
    plan: 'Business',
    subscriptionStatus: 'ACTIVE',
    mrr: 599,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440003',
    planId: '550e8400-e29b-41d4-a716-446655440003',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440002',
    name: 'Vertex Solutions',
    plan: 'Pro',
    subscriptionStatus: 'ACTIVE',
    mrr: 299,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440004',
    planId: '550e8400-e29b-41d4-a716-446655440002',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440003',
    name: 'Quantum Systems',
    plan: 'Enterprise',
    subscriptionStatus: 'ACTIVE',
    mrr: 999,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440005',
    planId: '550e8400-e29b-41d4-a716-446655440004',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440004',
    name: 'PixelForge',
    plan: 'Starter',
    subscriptionStatus: 'ACTIVE',
    mrr: 99,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440006',
    planId: '550e8400-e29b-41d4-a716-446655440001',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440005',
    name: 'CloudNest',
    plan: 'Pro',
    subscriptionStatus: 'ACTIVE',
    mrr: 299,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440007',
    planId: '550e8400-e29b-41d4-a716-446655440002',
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440006',
    name: 'DataPulse',
    plan: 'Business',
    subscriptionStatus: 'ACTIVE',
    mrr: 599,
    subscriptionId: '760e8400-e29b-41d4-a716-446655440008',
    planId: '550e8400-e29b-41d4-a716-446655440003',
  },
];
