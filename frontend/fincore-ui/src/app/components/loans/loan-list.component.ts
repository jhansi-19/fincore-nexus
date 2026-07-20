import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Loan Management</h1>
          <p class="page-subtitle">Milestone 2 — Loan Origination & Servicing</p>
        </div>
        <a routerLink="/loans/new" class="btn-primary">+ Apply for Loan</a>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">🏦</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalLoans }}</div>
            <div class="stat-label">Total Loans</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">\${{ stats.totalDisbursed | number:'1.0-0' }}</div>
            <div class="stat-label">Total Disbursed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeLoans }}</div>
            <div class="stat-label">Active Loans</div>
          </div>
        </div>
        <div class="stat-card npa">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.npaCount }}</div>
            <div class="stat-label">NPA Loans</div>
          </div>
        </div>
      </div>

      <!-- Loan Table -->
      <div class="table-card">
        <div class="table-header">
          <h2>All Loans</h2>
          <span class="badge">{{ loans.length }} records</span>
        </div>

        <div *ngIf="loading" class="loading-state">Loading loans...</div>
        <div *ngIf="error" class="error-state">{{ error }}</div>

        <div class="table-wrapper" *ngIf="!loading && !error">
          <table>
            <thead>
              <tr>
                <th>Loan Number</th>
                <th>Type</th>
                <th>Principal</th>
                <th>EMI</th>
                <th>Outstanding</th>
                <th>Credit Score</th>
                <th>Saga Status</th>
                <th>Status</th>
                <th>Next EMI</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let loan of loans">
                <td class="loan-number">{{ loan.loanNumber }}</td>
                <td><span class="type-badge">{{ formatLoanType(loan.loanType) }}</span></td>
                <td class="amount">\${{ loan.principalAmount | number:'1.2-2' }}</td>
                <td class="amount">\${{ loan.emiAmount | number:'1.2-2' }}</td>
                <td class="amount">\${{ loan.outstandingAmount | number:'1.2-2' }}</td>
                <td>
                  <span class="credit-score" [class]="getCreditClass(loan.creditScore)">
                    {{ loan.creditScore || 'N/A' }}
                  </span>
                </td>
                <td class="saga">{{ loan.sagaStatus || '—' }}</td>
                <td><span class="status-badge" [class]="getStatusClass(loan.status)">{{ loan.status }}</span></td>
                <td>{{ loan.nextEmiDate ? (loan.nextEmiDate | date:'dd-MMM-yyyy') : '—' }}</td>
                <td>
                  <a [routerLink]="['/loans', loan.id]" class="btn-view">View</a>
                </td>
              </tr>
              <tr *ngIf="loans.length === 0">
                <td colspan="10" class="empty-row">No loans found. Apply for one!</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; margin-top: 0.25rem; font-size: 0.9rem; }
    .btn-primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #fff; border-radius: 12px; padding: 1.2rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .stat-card.npa { border-left: 4px solid #ef4444; }
    .stat-icon { font-size: 2rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; }
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .table-header { display: flex; align-items: center; gap: 1rem; padding: 1.2rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .table-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #1e293b; }
    .badge { background: #ede9fe; color: #7c3aed; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f8fafc; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    tbody td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #374151; vertical-align: middle; }
    tbody tr:hover { background: #fafafe; }
    .loan-number { font-family: monospace; font-weight: 700; color: #6366f1; }
    .amount { font-weight: 600; color: #059669; }
    .saga { font-size: 0.78rem; color: #64748b; font-family: monospace; }
    .type-badge { background: #ede9fe; color: #7c3aed; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
    .status-badge { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-approved { background: #dbeafe; color: #1d4ed8; }
    .status-disbursed { background: #ede9fe; color: #6d28d9; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-closed { background: #f1f5f9; color: #64748b; }
    .status-npa { background: #fee2e2; color: #991b1b; }
    .credit-score { font-weight: 700; }
    .credit-good { color: #059669; }
    .credit-fair { color: #d97706; }
    .credit-poor { color: #dc2626; }
    .btn-view { background: #ede9fe; color: #7c3aed; padding: 0.3rem 0.7rem; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 600; }
    .loading-state, .error-state { padding: 2rem; text-align: center; color: #64748b; }
    .error-state { color: #dc2626; }
    .empty-row { text-align: center; color: #94a3b8; padding: 2rem !important; }
  `]
})
export class LoanListComponent implements OnInit {
  loans: Loan[] = [];
  stats: any = null;
  loading = true;
  error = '';

  constructor(private loanService: LoanService) {}

  ngOnInit() {
    this.loadLoans();
    this.loadStats();
  }

  loadLoans() {
    this.loading = true;
    this.loanService.getAllLoans().subscribe({
      next: (data) => { this.loans = data; this.loading = false; },
      error: (err) => { this.error = 'Could not connect to Loan Service on port 8084. Make sure it is running.'; this.loading = false; }
    });
  }

  loadStats() {
    this.loanService.getDashboardStats().subscribe({
      next: (data) => this.stats = data,
      error: () => {}
    });
  }

  getStatusClass(status?: string): string {
    const s = (status || '').toLowerCase();
    return `status-${s}`;
  }

  getCreditClass(score?: number): string {
    if (!score) return '';
    if (score >= 700) return 'credit-good';
    if (score >= 600) return 'credit-fair';
    return 'credit-poor';
  }

  formatLoanType(type?: string): string {
    return (type || '').replace(/_/g, ' ');
  }
}
