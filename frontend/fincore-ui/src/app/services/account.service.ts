import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private baseUrl = 'http://localhost:8081/api/v1/accounts';

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.baseUrl);
  }

  getAccountById(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  getAccountByNumber(accountNumber: string): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/number/${accountNumber}`);
  }

  getAccountsByCustomerId(customerId: string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  createAccount(account: Account): Observable<Account> {
    return this.http.post<Account>(this.baseUrl, account);
  }

  updateStatus(id: string, status: string): Observable<Account> {
    return this.http.put<Account>(`${this.baseUrl}/${id}/status?status=${status}`, {});
  }

  deposit(id: string, amount: number): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/${id}/deposit`, { amount });
  }

  withdraw(id: string, amount: number): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/${id}/withdraw`, { amount });
  }

  getBalance(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/balance`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats/dashboard`);
  }
}
