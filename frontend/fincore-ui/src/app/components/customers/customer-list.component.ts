import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers = signal<Customer[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.error.set('');
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load customers from database.');
        this.loading.set(false);
      }
    });
  }

  changeKyc(customerId: string, status: string): void {
    this.customerService.updateKycStatus(customerId, status).subscribe({
      next: () => {
        this.loadCustomers(); // Reload list
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update KYC status: ' + (err.error?.error || err.message));
      }
    });
  }
}
