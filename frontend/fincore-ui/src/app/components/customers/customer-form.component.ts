import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent {
  customer: Customer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    customerType: 'INDIVIDUAL',
    kycStatus: 'PENDING'
  };

  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.customerService.createCustomer(this.customer).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/customers']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(err.error?.error || 'An error occurred while creating customer.');
        this.loading.set(false);
      }
    });
  }
}
