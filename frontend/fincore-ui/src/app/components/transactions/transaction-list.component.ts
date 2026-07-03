import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { AccountService } from '../../services/account.service';
import { Transaction } from '../../models/transaction.model';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
  transactions = signal<Transaction[]>([]);
  accounts = signal<Account[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // Statement Generation inputs
  selectedAccountId = signal<string>('');
  fromDate = signal<string>('2026-01-01');
  toDate = signal<string>('2026-12-31');
  generatingStatement = signal<boolean>(false);

  constructor(
    private transactionService: TransactionService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadAccounts();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.error.set('');
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load transaction history.');
        this.loading.set(false);
      }
    });
  }

  loadAccounts(): void {
    this.accountService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        if (data.length > 0) {
          this.selectedAccountId.set(data[0].id || '');
        }
      },
      error: (err) => console.error(err)
    });
  }

  generateStatement(): void {
    if (!this.selectedAccountId()) {
      alert('Please select an account');
      return;
    }
    this.generatingStatement.set(true);
    this.transactionService.getAccountStatement(
      this.selectedAccountId(),
      this.fromDate(),
      this.toDate()
    ).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.generatingStatement.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('Failed to generate account statement.');
        this.generatingStatement.set(false);
      }
    });
  }
}
