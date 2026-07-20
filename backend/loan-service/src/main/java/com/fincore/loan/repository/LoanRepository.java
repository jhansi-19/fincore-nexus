package com.fincore.loan.repository;

import com.fincore.loan.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface LoanRepository extends JpaRepository<Loan, UUID> {

    List<Loan> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<Loan> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT COUNT(l) FROM Loan l")
    long countTotalLoans();

    @Query("SELECT COALESCE(SUM(l.principalAmount), 0) FROM Loan l WHERE l.status IN ('DISBURSED', 'ACTIVE', 'NPA')")
    BigDecimal sumTotalDisbursed();

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.status = 'NPA'")
    long countNpaLoans();

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.status = 'ACTIVE'")
    long countActiveLoans();

    @Query("SELECT COALESCE(SUM(l.outstandingAmount), 0) FROM Loan l WHERE l.status = 'ACTIVE'")
    BigDecimal sumOutstandingAmount();
}
