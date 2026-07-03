export interface Account {
  id?: string;
  accountNumber?: string;
  customerId: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT';
  status?: 'PENDING' | 'ACTIVE' | 'DORMANT' | 'CLOSED' | 'FROZEN';
  balance?: number;
  currency?: string;
  interestRate?: number;
  minimumBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}
