import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'customers',
    loadComponent: () => import('./components/customers/customer-list.component').then(m => m.CustomerListComponent)
  },
  {
    path: 'customers/new',
    loadComponent: () => import('./components/customers/customer-form.component').then(m => m.CustomerFormComponent)
  },
  {
    path: 'accounts',
    loadComponent: () => import('./components/accounts/account-list.component').then(m => m.AccountListComponent)
  },
  {
    path: 'accounts/new',
    loadComponent: () => import('./components/accounts/account-form.component').then(m => m.AccountFormComponent)
  },
  {
    path: 'transactions',
    loadComponent: () => import('./components/transactions/transaction-list.component').then(m => m.TransactionListComponent)
  },
  {
    path: 'transactions/new',
    loadComponent: () => import('./components/transactions/transaction-form.component').then(m => m.TransactionFormComponent)
  },
  {
    path: 'loans',
    loadComponent: () => import('./components/loans/loan-list.component').then(m => m.LoanListComponent)
  },
  {
    path: 'loans/new',
    loadComponent: () => import('./components/loans/loan-form.component').then(m => m.LoanFormComponent)
  },
  {
    path: 'loans/:id',
    loadComponent: () => import('./components/loans/loan-detail.component').then(m => m.LoanDetailComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];

