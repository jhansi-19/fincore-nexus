import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.css']
})
export class AccountListComponent implements OnInit {
  accounts = signal<Account[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.error.set('');
    this.accountService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load accounts from database.');
        this.loading.set(false);
      }
    });
  }

  updateStatus(accountId: string, status: string): void {
    this.accountService.updateStatus(accountId, status).subscribe({
      next: () => {
        this.loadAccounts(); // Reload list
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update account status: ' + (err.error?.error || err.message));
      }
    });
  }
}
