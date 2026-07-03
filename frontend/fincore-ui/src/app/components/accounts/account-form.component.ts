import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { CustomerService } from '../../services/customer.service';
import { Account } from '../../models/account.model';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account-form.component.html',
  styleUrls: ['./account-form.component.css']
})
export class AccountFormComponent implements OnInit {
  account: Account = {
    customerId: '',
    accountType: 'SAVINGS',
    balance: 0,
    currency: 'USD'
  };

  customers = signal<Customer[]>([]);
  loading = signal<boolean>(false);
  loadingCustomers = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private accountService: AccountService,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers.set(data);
        if (data.length > 0) {
          this.account.customerId = data[0].id || '';
        }
        this.loadingCustomers.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Failed to load customers for selection.');
        this.loadingCustomers.set(false);
      }
    });
  }

  onSubmit(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.accountService.createAccount(this.account).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/accounts']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(err.error?.error || 'An error occurred while opening account.');
        this.loading.set(false);
      }
    });
  }
}
