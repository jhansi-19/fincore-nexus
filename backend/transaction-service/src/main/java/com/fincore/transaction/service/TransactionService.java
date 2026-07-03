package com.fincore.transaction.service;

import com.fincore.transaction.entity.Transaction;
import com.fincore.transaction.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;

    @Value("${fincore.account-service.url}")
    private String accountServiceUrl;

    public TransactionService(TransactionRepository transactionRepository, RestTemplate restTemplate) {
        this.transactionRepository = transactionRepository;
        this.restTemplate = restTemplate;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public List<Transaction> getRecentTransactions() {
        return transactionRepository.findTop10ByOrderByCreatedAtDesc();
    }

    public List<Transaction> getTransactionsByAccountId(UUID accountId) {
        return transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
    }

    public Transaction getTransactionById(UUID id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction) {
        // 1. Get current balance from Account Service
        String balanceUrl = accountServiceUrl + "/api/v1/accounts/" + transaction.getAccountId() + "/balance";
        Map<String, Object> balanceResponse;
        try {
            balanceResponse = restTemplate.getForObject(balanceUrl, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Account Service is unreachable or account does not exist");
        }

        if (balanceResponse == null || !balanceResponse.containsKey("balance")) {
            throw new RuntimeException("Failed to retrieve balance for account: " + transaction.getAccountId());
        }

        BigDecimal balanceBefore = new BigDecimal(balanceResponse.get("balance").toString());
        transaction.setBalanceBefore(balanceBefore);

        // Generate Transaction Reference
        transaction.setTransactionReference("TXN-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));

        // Generate Kafka Event Details (Simulated Event-Driven architecture)
        transaction.setKafkaEventId("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        transaction.setKafkaEventStatus("PUBLISHED");
        transaction.setLatencyMs((int)(Math.random() * 60) + 15); // Simulated latency between 15ms and 75ms

        // 2. Call Account Service to update balance
        String updateUrl;
        if ("DEPOSIT".equalsIgnoreCase(transaction.getTransactionType()) || "INTEREST".equalsIgnoreCase(transaction.getTransactionType())) {
            updateUrl = accountServiceUrl + "/api/v1/accounts/" + transaction.getAccountId() + "/deposit";
            transaction.setBalanceAfter(balanceBefore.add(transaction.getAmount()));
        } else if ("WITHDRAWAL".equalsIgnoreCase(transaction.getTransactionType()) || "TRANSFER".equalsIgnoreCase(transaction.getTransactionType()) || "FEE".equalsIgnoreCase(transaction.getTransactionType())) {
            updateUrl = accountServiceUrl + "/api/v1/accounts/" + transaction.getAccountId() + "/withdraw";
            transaction.setBalanceAfter(balanceBefore.subtract(transaction.getAmount()));
        } else {
            throw new RuntimeException("Invalid transaction type: " + transaction.getTransactionType());
        }

        try {
            Map<String, Object> request = Map.of("amount", transaction.getAmount());
            restTemplate.postForObject(updateUrl, request, Map.class);
            transaction.setStatus("SUCCESS");
        } catch (Exception e) {
            transaction.setStatus("FAILED");
            transaction.setBalanceAfter(balanceBefore); // Balance didn't change
            transactionRepository.save(transaction);
            throw new RuntimeException("Transaction failed: " + e.getMessage());
        }

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getAccountStatement(UUID accountId, LocalDate from, LocalDate to) {
        LocalDateTime startDateTime = from.atStartOfDay();
        LocalDateTime endDateTime = to.atTime(LocalTime.MAX);
        return transactionRepository.findByAccountIdAndCreatedAtBetweenOrderByCreatedAtDesc(accountId, startDateTime, endDateTime);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTransactions", transactionRepository.countTotalTransactions());
        stats.put("totalVolume", transactionRepository.sumTotalVolume());
        stats.put("successCount", transactionRepository.countSuccessfulTransactions());
        return stats;
    }
}
