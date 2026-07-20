package com.fincore.loan.repository;

import com.fincore.loan.entity.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, UUID> {

    List<LoanPayment> findByLoanIdOrderByCreatedAtDesc(UUID loanId);

    long countByLoanId(UUID loanId);
}
