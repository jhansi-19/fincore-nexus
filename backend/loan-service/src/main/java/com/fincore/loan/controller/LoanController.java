package com.fincore.loan.controller;

import com.fincore.loan.entity.Loan;
import com.fincore.loan.entity.LoanPayment;
import com.fincore.loan.service.LoanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loans")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    // GET all loans
    @GetMapping
    public ResponseEntity<List<Loan>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    // GET loan by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getLoanById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(loanService.getLoanById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET loans by customer ID
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Loan>> getLoansByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(loanService.getLoansByCustomerId(customerId));
    }

    // POST - Apply for a new loan
    @PostMapping("/apply")
    public ResponseEntity<?> applyForLoan(@RequestBody Loan loan) {
        try {
            Loan created = loanService.applyForLoan(loan);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST - Disburse loan (Saga)
    @PostMapping("/{id}/disburse")
    public ResponseEntity<?> disburseLoan(@PathVariable UUID id) {
        try {
            Loan disbursed = loanService.disburseLoan(id);
            return ResponseEntity.ok(disbursed);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST - Repay EMI (debits Account Service)
    @PostMapping("/{id}/repay")
    public ResponseEntity<?> repayEmi(@PathVariable UUID id) {
        try {
            LoanPayment payment = loanService.repayEmi(id);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET - EMI payment history for a loan
    @GetMapping("/{id}/payments")
    public ResponseEntity<List<LoanPayment>> getLoanPayments(@PathVariable UUID id) {
        return ResponseEntity.ok(loanService.getLoanPayments(id));
    }

    // GET - Dashboard statistics
    @GetMapping("/stats/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(loanService.getDashboardStats());
    }
}
