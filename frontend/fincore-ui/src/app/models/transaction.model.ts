export interface Transaction {
  id?: string;
  transactionReference?: string;
  accountId: string;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'INTEREST';
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  kafkaEventId?: string;
  kafkaEventStatus?: string;
  latencyMs?: number;
  createdAt?: string;
}
