import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loan-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Apply for a Loan</h1>
          <p class="page-subtitle">Fill in the details to start the origination workflow</p>
        </div>
        <a routerLink="/loans" class="btn-back">← Back to Loans</a>
      </div>

      <div class="form-card">
        <!-- Success Message -->
        <div *ngIf="successLoan" class="success-banner">
          <div class="success-title">🎉 Loan Application Submitted!</div>
          <div class="success-details">
            <div><strong>Loan Number:</strong> {{ successLoan.loanNumber }}</div>
            <div><strong>Status:</strong> {{ successLoan.status }}</div>
            <div><strong>Credit Score:</strong> {{ successLoan.creditScore }}</div>
            <div><strong>Assessment:</strong> {{ successLoan.creditAssessmentResult }}</div>
            <div *ngIf="successLoan.emiAmount"><strong>Monthly EMI:</strong> \${{ successLoan.emiAmount | number:'1.2-2' }}</div>
            <div *ngIf="successLoan.sagaStatus"><strong>Saga Status:</strong> {{ successLoan.sagaStatus }}</div>
            <div><strong>Kafka Event:</strong> {{ successLoan.kafkaEventId }} ({{ successLoan.kafkaEventStatus }})</div>
            <div><strong>Latency:</strong> {{ successLoan.latencyMs }}ms</div>
          </div>
          <!-- Credit score breakdown -->
          <div class="breakdown-box" *ngIf="successLoan.creditScoreBreakdown">
            <div class="breakdown-title">📊 Real-Time Credit Score Calculation</div>
            <pre class="breakdown-text">{{ successLoan.creditScoreBreakdown }}</pre>
          </div>
          <!-- EMI Calculation breakdown -->
          <div class="breakdown-box" *ngIf="successLoan.emiCalculationBreakdown">
            <div class="breakdown-title">🧮 EMI Mathematical Calculation</div>
            <pre class="breakdown-text">{{ successLoan.emiCalculationBreakdown }}</pre>
          </div>
          <div class="success-actions">
            <a [routerLink]="['/loans', successLoan.id]" class="btn-primary">View Loan Details</a>
            <button (click)="resetForm()" class="btn-secondary">Apply Another</button>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="error" class="error-banner">⚠️ {{ error }}</div>

        <!-- Form -->
        <form *ngIf="!successLoan" (ngSubmit)="onSubmit()" #loanForm="ngForm">
          <div class="form-grid">

            <div class="form-group">
              <label>Customer ID *</label>
              <input type="text" [(ngModel)]="loan.customerId" name="customerId"
                     placeholder="e.g. a0000001-0000-0000-0000-000000000001"
                     required class="form-input" />
              <span class="hint">Paste a Customer UUID from the Customers page</span>
            </div>

            <div class="form-group">
              <label>Account ID (Disbursement) *</label>
              <input type="text" [(ngModel)]="loan.accountId" name="accountId"
                     placeholder="e.g. b0000001-0000-0000-0000-000000000001"
                     required class="form-input" />
              <span class="hint">Funds will be deposited into this account</span>
            </div>

            <div class="form-group">
              <label>Loan Type *</label>
              <select [(ngModel)]="loan.loanType" name="loanType" required class="form-input">
                <option value="">-- Select Type --</option>
                <option value="HOME_LOAN">Home Loan (8.5% p.a.)</option>
                <option value="PERSONAL_LOAN">Personal Loan (13.75% p.a.)</option>
                <option value="CAR_LOAN">Car Loan (10.25% p.a.)</option>
                <option value="EDUCATION_LOAN">Education Loan (9.0% p.a.)</option>
                <option value="BUSINESS_LOAN">Business Loan (12.5% p.a.)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Principal Amount (USD) *</label>
              <input type="number" [(ngModel)]="loan.principalAmount" name="principalAmount"
                     placeholder="e.g. 240000"
                     required min="1000" class="form-input" />
            </div>

            <div class="form-group">
              <label>Tenure (Months) *</label>
              <input type="number" [(ngModel)]="loan.tenureMonths" name="tenureMonths"
                     placeholder="e.g. 240 (20 years)"
                     required min="1" max="360" class="form-input" />
            </div>

            <div class="form-group full-width">
              <label>Purpose / Description</label>
              <input type="text" [(ngModel)]="loan.purpose" name="purpose"
                     placeholder="e.g. Purchase residential property in New York"
                     class="form-input" />
            </div>

          </div>

          <div class="info-box">
            <div class="info-title">ℹ️ How it works</div>
            <ul>
              <li>Your application goes through a <strong>Credit Assessment</strong> (simulated credit score check).</li>
              <li>If approved, the EMI is calculated using the standard formula: <code>EMI = P × r × (1+r)^n / ((1+r)^n - 1)</code></li>
              <li>After approval, you can disburse the loan which triggers the <strong>Saga pattern</strong>: Account Check → Loan Created → Funds Disbursed to Account.</li>
            </ul>
          </div>

          <div class="form-actions">
            <button type="submit" [disabled]="submitting || !loanForm.valid" class="btn-submit">
              {{ submitting ? 'Processing...' : 'Submit Application' }}
            </button>
            <a routerLink="/loans" class="btn-cancel">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; margin-top: 0.25rem; font-size: 0.9rem; }
    .btn-back { color: #6366f1; text-decoration: none; font-weight: 600; padding: 0.5rem 1rem; border: 1px solid #6366f1; border-radius: 8px; }
    .form-card { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .form-input { padding: 0.65rem 0.9rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; color: #1e293b; outline: none; transition: border-color 0.2s; }
    .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .hint { font-size: 0.75rem; color: #94a3b8; }
    .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; }
    .info-title { font-weight: 700; color: #0369a1; margin-bottom: 0.5rem; }
    .info-box ul { margin: 0; padding-left: 1.2rem; }
    .info-box li { font-size: 0.85rem; color: #374151; margin-bottom: 0.3rem; }
    code { background: #e2e8f0; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
    .form-actions { display: flex; gap: 1rem; align-items: center; }
    .btn-submit { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel { color: #64748b; text-decoration: none; font-weight: 500; }
    .success-banner { background: linear-gradient(135deg,#d1fae5,#a7f3d0); border: 1px solid #6ee7b7; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .success-title { font-size: 1.2rem; font-weight: 700; color: #065f46; margin-bottom: 1rem; }
    .success-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem; color: #374151; }
    .success-actions { display: flex; gap: 1rem; }
    .btn-primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .btn-secondary { background: #fff; color: #6366f1; border: 1px solid #6366f1; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
    .error-banner { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 1rem; color: #991b1b; margin-bottom: 1rem; }
    .breakdown-box { background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 8px; padding: 1rem; margin: 1rem 0; font-family: inherit; }
    .breakdown-title { font-weight: 700; color: #4338ca; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .breakdown-text { margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 0.82rem; color: #1e293b; line-height: 1.4; white-space: pre-wrap; font-weight: 600; }
  `]
})
export class LoanFormComponent {
  loan: Loan = {
    customerId: '',
    accountId: '',
    loanType: '',
    principalAmount: 0,
    tenureMonths: 0,
    purpose: ''
  };
  submitting = false;
  error = '';
  successLoan: Loan | null = null;

  constructor(private loanService: LoanService, private router: Router) {}

  onSubmit() {
    this.submitting = true;
    this.error = '';
    this.loanService.applyForLoan(this.loan).subscribe({
      next: (created) => {
        this.successLoan = created;
        this.submitting = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to submit application. Check if Loan Service is running on port 8084.';
        this.submitting = false;
      }
    });
  }

  resetForm() {
    this.successLoan = null;
    this.loan = { customerId: '', accountId: '', loanType: '', principalAmount: 0, tenureMonths: 0 };
  }
}
