package com.fincore.account.service;

import com.fincore.account.entity.Account;
import com.fincore.account.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getAccountById(UUID id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + id));
    }

    public Account getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found with number: " + accountNumber));
    }

    public List<Account> getAccountsByCustomerId(UUID customerId) {
        return accountRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Account createAccount(Account account) {
        // Generate unique account number if not provided
        if (account.getAccountNumber() == null || account.getAccountNumber().trim().isEmpty()) {
            account.setAccountNumber(generateUniqueAccountNumber());
        } else {
            // Check if user-provided account number already exists
            if (accountRepository.findByAccountNumber(account.getAccountNumber()).isPresent()) {
                throw new RuntimeException("Account number already exists: " + account.getAccountNumber());
            }
        }

        // Set interest rates based on account type
        if ("SAVINGS".equalsIgnoreCase(account.getAccountType())) {
            account.setInterestRate(new BigDecimal("3.50"));
            account.setMinimumBalance(new BigDecimal("500.00"));
        } else if ("CURRENT".equalsIgnoreCase(account.getAccountType())) {
            account.setInterestRate(BigDecimal.ZERO);
            account.setMinimumBalance(new BigDecimal("1000.00"));
        } else if ("FIXED_DEPOSIT".equalsIgnoreCase(account.getAccountType())) {
            account.setInterestRate(new BigDecimal("6.75"));
            account.setMinimumBalance(new BigDecimal("10000.00"));
        }

        return accountRepository.save(account);
    }

    @Transactional
    public Account deposit(UUID accountId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Deposit amount must be greater than zero");
        }
        Account account = getAccountById(accountId);
        if ("CLOSED".equalsIgnoreCase(account.getStatus()) || "FROZEN".equalsIgnoreCase(account.getStatus())) {
            throw new RuntimeException("Cannot deposit to a " + account.getStatus() + " account");
        }
        account.setBalance(account.getBalance().add(amount));
        return accountRepository.save(account);
    }

    @Transactional
    public Account withdraw(UUID accountId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Withdrawal amount must be greater than zero");
        }
        Account account = getAccountById(accountId);
        if ("CLOSED".equalsIgnoreCase(account.getStatus()) || "FROZEN".equalsIgnoreCase(account.getStatus())) {
            throw new RuntimeException("Cannot withdraw from a " + account.getStatus() + " account");
        }
        if (account.getBalance().subtract(amount).compareTo(account.getMinimumBalance()) < 0) {
            throw new RuntimeException("Insufficient funds. Withdrawal would fall below minimum balance of " + account.getMinimumBalance());
        }
        account.setBalance(account.getBalance().subtract(amount));
        return accountRepository.save(account);
    }

    @Transactional
    public Account updateStatus(UUID accountId, String status) {
        Account account = getAccountById(accountId);
        String s = status.toUpperCase();
        if (!s.equals("PENDING") && !s.equals("ACTIVE") && !s.equals("DORMANT") && !s.equals("CLOSED") && !s.equals("FROZEN")) {
            throw new RuntimeException("Invalid account status: " + status);
        }
        account.setStatus(s);
        return accountRepository.save(account);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAccounts", accountRepository.count());
        stats.put("activeAccounts", accountRepository.countActiveAccounts());
        stats.put("totalBalance", accountRepository.sumTotalBalance());
        stats.put("pendingAccounts", accountRepository.countPendingAccounts());
        return stats;
    }

    private String generateUniqueAccountNumber() {
        Random rand = new Random();
        String accountNumber;
        do {
            // Generates 12-digit number format: 1234-5678-9012
            int group1 = rand.nextInt(9000) + 1000;
            int group2 = rand.nextInt(9000) + 1000;
            int group3 = rand.nextInt(9000) + 1000;
            accountNumber = String.format("%04d-%04d-%04d", group1, group2, group3);
        } while (accountRepository.findByAccountNumber(accountNumber).isPresent());
        return accountNumber;
    }
}
