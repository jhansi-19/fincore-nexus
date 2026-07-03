import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { AccountService } from '../../services/account.service';
import { Transaction } from '../../models/transaction.model';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css']
})
export class TransactionFormComponent implements OnInit {
  transaction: Transaction = {
    accountId: '',
    transactionType: 'DEPOSIT',
    amount: 100,
    description: ''
  };

  accounts = signal<Account[]>([]);
  loading = signal<boolean>(false);
  loadingAccounts = signal<boolean>(true);
  errorMessage = signal<string>('');
  
  // Signal to show successful receipt matching Milestone 1 Expected Output Screen
  successReceipt = signal<any>(null);

  constructor(
    private transactionService: TransactionService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.accountService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        if (data.length > 0) {
          this.transaction.accountId = data[0].id || '';
        }
        this.loadingAccounts.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Failed to load accounts for selection.');
        this.loadingAccounts.set(false);
      }
    });
  }

  onSubmit(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successReceipt.set(null);

    this.transactionService.createTransaction(this.transaction).subscribe({
      next: (res) => {
        this.loading.set(false);
        // Find corresponding account number
        const selectedAcc = this.accounts().find(a => a.id === res.accountId);
        this.successReceipt.set({
          accountNumber: selectedAcc ? selectedAcc.accountNumber : 'Unknown',
          balance: res.balanceAfter,
          amount: res.amount,
          type: res.transactionType,
          kafkaEvent: res.kafkaEventStatus,
          latency: res.latencyMs,
          reference: res.transactionReference,
          status: res.status
        });
        
        // Reset form amount
        this.transaction.amount = 100;
        this.transaction.description = '';
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(err.error?.error || 'An error occurred during transaction processing.');
        this.loading.set(false);
      }
    });
  }
}
