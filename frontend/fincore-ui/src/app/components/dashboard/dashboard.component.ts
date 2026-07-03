import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomerService } from '../../services/customer.service';
import { AccountService } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Signals for state
  customerStats = signal<any>({ totalCustomers: 0, verifiedCustomers: 0, pendingKyc: 0 });
  accountStats = signal<any>({ totalAccounts: 0, activeAccounts: 0, totalBalance: 0, pendingAccounts: 0 });
  transactionStats = signal<any>({ totalTransactions: 0, totalVolume: 0, successCount: 0 });
  recentTransactions = signal<Transaction[]>([]);
  
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private customerService: CustomerService,
    private accountService: AccountService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      cStats: this.customerService.getDashboardStats().pipe(catchError(() => of({ totalCustomers: 0, verifiedCustomers: 0, pendingKyc: 0 }))),
      aStats: this.accountService.getDashboardStats().pipe(catchError(() => of({ totalAccounts: 0, activeAccounts: 0, totalBalance: 0, pendingAccounts: 0 }))),
      tStats: this.transactionService.getDashboardStats().pipe(catchError(() => of({ totalTransactions: 0, totalVolume: 0, successCount: 0 }))),
      txns: this.transactionService.getRecentTransactions().pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.customerStats.set(res.cStats);
        this.accountStats.set(res.aStats);
        this.transactionStats.set(res.tStats);
        this.recentTransactions.set(res.txns);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching dashboard metrics', err);
        this.errorMessage.set('Failed to connect to backend microservices. Make sure they are running.');
        this.loading.set(false);
      }
    });
  }
}
