import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan, LoanPayment, LoanDashboardStats } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoanService {

  private readonly baseUrl = 'http://localhost:8084/api/v1/loans';

  constructor(private http: HttpClient) {}

  getAllLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(this.baseUrl);
  }

  getLoanById(id: string): Observable<Loan> {
    return this.http.get<Loan>(`${this.baseUrl}/${id}`);
  }

  getLoansByCustomer(customerId: string): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  applyForLoan(loan: Loan): Observable<Loan> {
    return this.http.post<Loan>(`${this.baseUrl}/apply`, loan);
  }

  disburseLoan(id: string): Observable<Loan> {
    return this.http.post<Loan>(`${this.baseUrl}/${id}/disburse`, {});
  }

  repayEmi(id: string): Observable<LoanPayment> {
    return this.http.post<LoanPayment>(`${this.baseUrl}/${id}/repay`, {});
  }

  getLoanPayments(id: string): Observable<LoanPayment[]> {
    return this.http.get<LoanPayment[]>(`${this.baseUrl}/${id}/payments`);
  }

  getDashboardStats(): Observable<LoanDashboardStats> {
    return this.http.get<LoanDashboardStats>(`${this.baseUrl}/stats/dashboard`);
  }
}
