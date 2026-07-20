import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { Loan, LoanPayment } from '../../models/loan.model';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Loan Details</h1>
          <p class="page-subtitle" *ngIf="loan">{{ loan.loanNumber }}</p>
        </div>
        <a routerLink="/loans" class="btn-back">← Back to Loans</a>
      </div>

      <div *ngIf="loading" class="loading-state">Loading loan details...</div>
      <div *ngIf="error" class="error-state">{{ error }}</div>

      <div *ngIf="loan && !loading">

        <!-- Action Buttons -->
        <div class="action-bar">
          <button *ngIf="loan.status === 'APPROVED'" (click)="disburse()" [disabled]="actionLoading" class="btn-disburse">
            {{ actionLoading ? 'Processing Saga...' : '🚀 Disburse Loan (Saga)' }}
          </button>
          <button *ngIf="loan.status === 'DISBURSED' || loan.status === 'ACTIVE'" (click)="repayEmi()" [disabled]="actionLoading" class="btn-repay">
            {{ actionLoading ? 'Processing...' : '💳 Pay EMI (\$' + (loan.emiAmount | number:'1.2-2') + ')' }}
          </button>
          <div *ngIf="actionMessage" class="action-message" [class.success]="!actionError" [class.error]="actionError">
            {{ actionMessage }}
          </div>
        </div>

        <!-- Detail Grid -->
        <div class="detail-grid">

          <!-- Left: Loan Info -->
          <div class="detail-card">
            <h2 class="card-title">Loan Information</h2>
            <div class="detail-row"><span class="detail-label">Loan Number</span><span class="detail-value mono">{{ loan.loanNumber }}</span></div>
            <div class="detail-row"><span class="detail-label">Loan Type</span><span class="detail-value">{{ loan.loanType?.replace('_',' ') }}</span></div>
            <div class="detail-row"><span class="detail-label">Status</span><span class="status-badge" [class]="getStatusClass(loan.status)">{{ loan.status }}</span></div>
            <div class="detail-row"><span class="detail-label">Principal</span><span class="detail-value green">\${{ loan.principalAmount | number:'1.2-2' }}</span></div>
            <div class="detail-row"><span class="detail-label">Outstanding</span><span class="detail-value orange">\${{ loan.outstandingAmount | number:'1.2-2' }}</span></div>
            <div class="detail-row"><span class="detail-label">Monthly EMI</span><span class="detail-value green">\${{ loan.emiAmount | number:'1.2-2' }}</span></div>
            <div class="detail-row"><span class="detail-label">Interest Rate</span><span class="detail-value">{{ loan.interestRate }}% p.a.</span></div>
            <div class="detail-row"><span class="detail-label">Tenure</span><span class="detail-value">{{ loan.tenureMonths }} months</span></div>
            <div class="detail-row" *ngIf="loan.nextEmiDate"><span class="detail-label">Next EMI Date</span><span class="detail-value">{{ loan.nextEmiDate | date:'dd-MMM-yyyy' }}</span></div>
            <div class="detail-row" *ngIf="loan.disbursedAt"><span class="detail-label">Disbursed At</span><span class="detail-value">{{ loan.disbursedAt | date:'dd-MMM-yyyy HH:mm' }}</span></div>
            <div class="detail-row" *ngIf="loan.purpose"><span class="detail-label">Purpose</span><span class="detail-value">{{ loan.purpose }}</span></div>
            
            <!-- EMI Calculation Breakdown -->
            <div class="breakdown-details" *ngIf="loan.emiCalculationBreakdown" style="margin-top: 1rem; border-top: 1px dashed #e2e8f0; padding-top: 1rem;">
              <div class="breakdown-subtitle" style="font-size: 0.75rem; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">🧮 EMI Calculation Breakdown</div>
              <pre class="breakdown-pre" style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 0.75rem; color: #334155; line-height: 1.4; white-space: pre-wrap; font-weight: 600;">{{ loan.emiCalculationBreakdown }}</pre>
            </div>
          </div>

          <!-- Right: Credit + Saga + Kafka -->
          <div class="right-col">
            <!-- Credit Assessment -->
            <div class="detail-card">
              <h2 class="card-title">Credit Assessment</h2>
              <div class="credit-score-display" [class]="getCreditClass(loan.creditScore)">
                {{ loan.creditScore || 'N/A' }}
              </div>
              <div class="credit-label">Credit Score</div>
              <div class="detail-row" style="margin-top: 1rem"><span class="detail-label">Assessment Result</span>
                <span class="status-badge" [class]="getAssessmentClass(loan.creditAssessmentResult)">{{ loan.creditAssessmentResult || 'N/A' }}</span>
              </div>
              <div class="breakdown-details" *ngIf="loan.creditScoreBreakdown">
                <div class="breakdown-subtitle">Calculation Audit Log</div>
                <pre class="breakdown-pre">{{ loan.creditScoreBreakdown }}</pre>
              </div>
            </div>

            <!-- Saga Pattern -->
            <div class="detail-card saga-card">
              <h2 class="card-title">Saga Pattern</h2>
              <div class="saga-flow">
                <span class="saga-step" [class.done]="isSagaStepDone('ACCOUNT_CHECKED')">Account Check</span>
                <span class="saga-arrow">→</span>
                <span class="saga-step" [class.done]="isSagaStepDone('LOAN_CREATED')">Loan Created</span>
                <span class="saga-arrow">→</span>
                <span class="saga-step" [class.done]="isSagaStepDone('DISBURSED')">Disbursed</span>
              </div>
              <div class="detail-row" style="margin-top:0.8rem"><span class="detail-label">Current Step</span><span class="detail-value mono">{{ loan.sagaStep || 'N/A' }}</span></div>
              <div class="detail-row"><span class="detail-label">Saga Status</span><span class="detail-value mono">{{ loan.sagaStatus || 'N/A' }}</span></div>
            </div>

            <!-- Kafka Event -->
            <div class="detail-card kafka-card">
              <h2 class="card-title">Event Bus (Kafka Simulation)</h2>
              <div class="detail-row"><span class="detail-label">Event ID</span><span class="detail-value mono">{{ loan.kafkaEventId || 'N/A' }}</span></div>
              <div class="detail-row"><span class="detail-label">Event Status</span><span class="kafka-badge">{{ loan.kafkaEventStatus }}</span></div>
              <div class="detail-row"><span class="detail-label">Processing Latency</span><span class="detail-value">{{ loan.latencyMs }}ms</span></div>
            </div>
          </div>
        </div>

        <!-- EMI Payment History -->
        <div class="table-card">
          <div class="table-header">
            <h2>EMI Payment History</h2>
            <span class="badge">{{ payments.length }} payments</span>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>EMI #</th>
                  <th>Reference</th>
                  <th>Amount Paid</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Outstanding After</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of payments">
                  <td class="emi-num">#{{ payment.emiNumber }}</td>
                  <td class="mono">{{ payment.paymentReference }}</td>
                  <td class="amount">\${{ payment.amountPaid | number:'1.2-2' }}</td>
                  <td class="amount-p">\${{ payment.principalComponent | number:'1.2-2' }}</td>
                  <td class="amount-i">\${{ payment.interestComponent | number:'1.2-2' }}</td>
                  <td class="amount">\${{ payment.outstandingAfter | number:'1.2-2' }}</td>
                  <td>{{ payment.paymentDate | date:'dd-MMM-yyyy' }}</td>
                  <td>{{ payment.paymentMode }}</td>
                  <td><span class="status-badge status-success">{{ payment.status }}</span></td>
                </tr>
                <tr *ngIf="payments.length === 0">
                  <td colspan="9" class="empty-row">No payments recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1300px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1e293b; margin: 0; }
    .page-subtitle { color: #6366f1; margin-top: 0.25rem; font-size: 1rem; font-weight: 600; font-family: monospace; }
    .btn-back { color: #6366f1; text-decoration: none; font-weight: 600; padding: 0.5rem 1rem; border: 1px solid #6366f1; border-radius: 8px; }
    .action-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .btn-disburse { background: linear-gradient(135deg,#059669,#10b981); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95rem; }
    .btn-repay { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95rem; }
    .btn-disburse:disabled, .btn-repay:disabled { opacity: 0.6; cursor: not-allowed; }
    .action-message { padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; }
    .action-message.success { background: #d1fae5; color: #065f46; }
    .action-message.error { background: #fee2e2; color: #991b1b; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .right-col { display: flex; flex-direction: column; gap: 1rem; }
    .detail-card { background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .saga-card { border-top: 3px solid #6366f1; }
    .kafka-card { border-top: 3px solid #f59e0b; }
    .card-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 0.83rem; color: #64748b; font-weight: 500; }
    .detail-value { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    .detail-value.green { color: #059669; }
    .detail-value.orange { color: #d97706; }
    .detail-value.mono { font-family: monospace; color: #6366f1; }
    .mono { font-family: monospace; font-size: 0.82rem; }
    .status-badge { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-approved { background: #dbeafe; color: #1d4ed8; }
    .status-disbursed { background: #ede9fe; color: #6d28d9; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-closed { background: #f1f5f9; color: #64748b; }
    .status-npa { background: #fee2e2; color: #991b1b; }
    .status-success { background: #d1fae5; color: #065f46; }
    .assess-approved { background: #d1fae5; color: #065f46; }
    .assess-rejected { background: #fee2e2; color: #991b1b; }
    .assess-manual { background: #fef3c7; color: #92400e; }
    .credit-score-display { font-size: 3rem; font-weight: 800; text-align: center; margin: 0.5rem 0; }
    .credit-good { color: #059669; }
    .credit-fair { color: #d97706; }
    .credit-poor { color: #dc2626; }
    .credit-label { text-align: center; font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem; }
    .saga-flow { display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem; background: #f8fafc; border-radius: 8px; }
    .saga-step { font-size: 0.8rem; font-weight: 600; color: #94a3b8; padding: 0.3rem 0.5rem; border-radius: 4px; background: #e2e8f0; }
    .saga-step.done { background: #d1fae5; color: #065f46; }
    .saga-arrow { color: #94a3b8; font-size: 1rem; }
    .kafka-badge { background: #fef3c7; color: #92400e; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .table-header { display: flex; align-items: center; gap: 1rem; padding: 1.2rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .table-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #1e293b; }
    .badge { background: #ede9fe; color: #7c3aed; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f8fafc; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    tbody td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #374151; }
    .emi-num { font-weight: 700; color: #6366f1; }
    .amount { font-weight: 600; color: #059669; }
    .amount-p { color: #2563eb; font-weight: 600; }
    .amount-i { color: #dc2626; font-weight: 600; }
    .empty-row { text-align: center; color: #94a3b8; padding: 2rem !important; }
    .loading-state, .error-state { padding: 3rem; text-align: center; color: #64748b; }
    .error-state { color: #dc2626; }
    .breakdown-details { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #e2e8f0; }
    .breakdown-subtitle { font-size: 0.75rem; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; }
    .breakdown-pre { margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 0.75rem; color: #334155; line-height: 1.4; white-space: pre-wrap; font-weight: 600; }
  `]
})
export class LoanDetailComponent implements OnInit {
  loan: Loan | null = null;
  payments: LoanPayment[] = [];
  loading = true;
  error = '';
  actionLoading = false;
  actionMessage = '';
  actionError = false;

  constructor(private route: ActivatedRoute, private loanService: LoanService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loanService.getLoanById(id).subscribe({
      next: (data) => { this.loan = data; this.loading = false; this.loadPayments(id); },
      error: () => { this.error = 'Loan not found or Loan Service is not running on port 8084.'; this.loading = false; }
    });
  }

  loadPayments(id: string) {
    this.loanService.getLoanPayments(id).subscribe({
      next: (data) => this.payments = data,
      error: () => {}
    });
  }

  disburse() {
    if (!this.loan?.id) return;
    this.actionLoading = true;
    this.actionMessage = '';
    this.loanService.disburseLoan(this.loan.id).subscribe({
      next: (updated) => {
        this.loan = updated;
        this.actionMessage = `✅ Disbursement successful! Saga: ${updated.sagaStatus}. \$${updated.principalAmount} credited to account.`;
        this.actionError = false;
        this.actionLoading = false;
      },
      error: (err) => {
        this.actionMessage = `❌ ${err.error?.error || 'Disbursement failed.'}`;
        this.actionError = true;
        this.actionLoading = false;
      }
    });
  }

  repayEmi() {
    if (!this.loan?.id) return;
    this.actionLoading = true;
    this.actionMessage = '';
    this.loanService.repayEmi(this.loan.id).subscribe({
      next: (payment) => {
        this.actionMessage = `✅ EMI Payment recorded! Reference: ${payment.paymentReference}. Outstanding: \$${payment.outstandingAfter?.toFixed(2)}`;
        this.actionError = false;
        this.actionLoading = false;
        // Reload loan and payments
        this.loanService.getLoanById(this.loan!.id!).subscribe(l => this.loan = l);
        this.loadPayments(this.loan!.id!);
      },
      error: (err) => {
        this.actionMessage = `❌ ${err.error?.error || 'Payment failed.'}`;
        this.actionError = true;
        this.actionLoading = false;
      }
    });
  }

  getStatusClass(status?: string): string {
    return `status-${(status || '').toLowerCase()}`;
  }

  getCreditClass(score?: number): string {
    if (!score) return 'credit-fair';
    if (score >= 700) return 'credit-good';
    if (score >= 600) return 'credit-fair';
    return 'credit-poor';
  }

  getAssessmentClass(result?: string): string {
    if (result === 'APPROVED') return 'assess-approved';
    if (result === 'REJECTED') return 'assess-rejected';
    return 'assess-manual';
  }

  isSagaStepDone(step: string): boolean {
    const order = ['ACCOUNT_CHECKED', 'LOAN_CREATED', 'DISBURSING', 'DISBURSED'];
    const current = order.indexOf(this.loan?.sagaStep || '');
    const target = order.indexOf(step);
    return current >= target && current >= 0;
  }
}
