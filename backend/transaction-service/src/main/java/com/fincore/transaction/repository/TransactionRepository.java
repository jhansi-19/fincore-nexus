package com.fincore.transaction.repository;

import com.fincore.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByAccountIdOrderByCreatedAtDesc(UUID accountId);
    List<Transaction> findTop10ByOrderByCreatedAtDesc();
    
    @Query("SELECT COUNT(t) FROM Transaction t")
    long countTotalTransactions();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status = 'SUCCESS'")
    BigDecimal sumTotalVolume();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'SUCCESS'")
    long countSuccessfulTransactions();

    List<Transaction> findByAccountIdAndCreatedAtBetweenOrderByCreatedAtDesc(UUID accountId, LocalDateTime start, LocalDateTime end);
}
