import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private baseUrl = 'http://localhost:8083/api/v1/transactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.baseUrl);
  }

  getRecentTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/recent`);
  }

  getTransactionsByAccountId(accountId: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/account/${accountId}`);
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/${id}`);
  }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.baseUrl, transaction);
  }

  getAccountStatement(accountId: string, from: string, to: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/account/${accountId}/statement?from=${from}&to=${to}`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats/dashboard`);
  }
}
