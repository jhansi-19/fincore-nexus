export interface Loan {
  id?: string;
  loanNumber?: string;
  customerId: string;
  accountId: string;
  loanType: string;
  principalAmount: number;
  outstandingAmount?: number;
  interestRate?: number;
  tenureMonths: number;
  emiAmount?: number;
  status?: string;
  creditScore?: number;
  creditAssessmentResult?: string;
  sagaStatus?: string;
  sagaStep?: string;
  kafkaEventId?: string;
  kafkaEventStatus?: string;
  latencyMs?: number;
  disbursedAt?: string;
  nextEmiDate?: string;
  lastPaymentDate?: string;
  overdueDays?: number;
  purpose?: string;
  creditScoreBreakdown?: string;
  emiCalculationBreakdown?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoanPayment {
  id?: string;
  loanId: string;
  paymentReference?: string;
  emiNumber?: number;
  amountPaid: number;
  principalComponent?: number;
  interestComponent?: number;
  outstandingAfter?: number;
  paymentDate?: string;
  status?: string;
  paymentMode?: string;
  createdAt?: string;
}

export interface LoanDashboardStats {
  totalLoans: number;
  totalDisbursed: number;
  npaCount: number;
  activeLoans: number;
  outstandingAmount: number;
}
