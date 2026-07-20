package com.fincore.loan.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "loan_number", nullable = false, unique = true)
    private String loanNumber; // e.g. HL-2024-1247

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId; // Disbursement account

    @Column(name = "loan_type", nullable = false)
    private String loanType; // HOME_LOAN, PERSONAL_LOAN, CAR_LOAN, EDUCATION_LOAN, BUSINESS_LOAN

    @Column(name = "principal_amount", nullable = false)
    private BigDecimal principalAmount;

    @Column(name = "outstanding_amount")
    private BigDecimal outstandingAmount;

    @Column(name = "interest_rate", nullable = false)
    private BigDecimal interestRate; // Annual %

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "emi_amount")
    private BigDecimal emiAmount;

    @Column(nullable = false)
    private String status = "PENDING";
    // PENDING, CREDIT_CHECK, APPROVED, REJECTED, DISBURSED, ACTIVE, CLOSED, NPA

    @Column(name = "credit_score")
    private Integer creditScore;

    @Column(name = "credit_assessment_result")
    private String creditAssessmentResult; // APPROVED, REJECTED, MANUAL_REVIEW

    @Column(name = "credit_score_breakdown", length = 1000)
    private String creditScoreBreakdown;

    @Column(name = "emi_calculation_breakdown", length = 1000)
    private String emiCalculationBreakdown;

    // Saga pattern tracking
    @Column(name = "saga_status")
    private String sagaStatus; // e.g. "Account→Loan→Payment"

    @Column(name = "saga_step")
    private String sagaStep; // ACCOUNT_CHECKED, LOAN_CREATED, DISBURSED, FAILED

    // Kafka simulation
    @Column(name = "kafka_event_id")
    private String kafkaEventId;

    @Column(name = "kafka_event_status")
    private String kafkaEventStatus = "PENDING";

    @Column(name = "latency_ms")
    private Integer latencyMs = 0;

    @Column(name = "disbursed_at")
    private LocalDateTime disbursedAt;

    @Column(name = "next_emi_date")
    private LocalDate nextEmiDate;

    @Column(name = "last_payment_date")
    private LocalDate lastPaymentDate;

    @Column(name = "overdue_days")
    private Integer overdueDays = 0;

    @Column(name = "purpose")
    private String purpose;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Loan() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getLoanNumber() { return loanNumber; }
    public void setLoanNumber(String loanNumber) { this.loanNumber = loanNumber; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public UUID getAccountId() { return accountId; }
    public void setAccountId(UUID accountId) { this.accountId = accountId; }

    public String getLoanType() { return loanType; }
    public void setLoanType(String loanType) { this.loanType = loanType; }

    public BigDecimal getPrincipalAmount() { return principalAmount; }
    public void setPrincipalAmount(BigDecimal principalAmount) { this.principalAmount = principalAmount; }

    public BigDecimal getOutstandingAmount() { return outstandingAmount; }
    public void setOutstandingAmount(BigDecimal outstandingAmount) { this.outstandingAmount = outstandingAmount; }

    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }

    public Integer getTenureMonths() { return tenureMonths; }
    public void setTenureMonths(Integer tenureMonths) { this.tenureMonths = tenureMonths; }

    public BigDecimal getEmiAmount() { return emiAmount; }
    public void setEmiAmount(BigDecimal emiAmount) { this.emiAmount = emiAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getCreditScore() { return creditScore; }
    public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }

    public String getCreditAssessmentResult() { return creditAssessmentResult; }
    public void setCreditAssessmentResult(String creditAssessmentResult) { this.creditAssessmentResult = creditAssessmentResult; }

    public String getSagaStatus() { return sagaStatus; }
    public void setSagaStatus(String sagaStatus) { this.sagaStatus = sagaStatus; }

    public String getSagaStep() { return sagaStep; }
    public void setSagaStep(String sagaStep) { this.sagaStep = sagaStep; }

    public String getKafkaEventId() { return kafkaEventId; }
    public void setKafkaEventId(String kafkaEventId) { this.kafkaEventId = kafkaEventId; }

    public String getKafkaEventStatus() { return kafkaEventStatus; }
    public void setKafkaEventStatus(String kafkaEventStatus) { this.kafkaEventStatus = kafkaEventStatus; }

    public Integer getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Integer latencyMs) { this.latencyMs = latencyMs; }

    public LocalDateTime getDisbursedAt() { return disbursedAt; }
    public void setDisbursedAt(LocalDateTime disbursedAt) { this.disbursedAt = disbursedAt; }

    public LocalDate getNextEmiDate() { return nextEmiDate; }
    public void setNextEmiDate(LocalDate nextEmiDate) { this.nextEmiDate = nextEmiDate; }

    public LocalDate getLastPaymentDate() { return lastPaymentDate; }
    public void setLastPaymentDate(LocalDate lastPaymentDate) { this.lastPaymentDate = lastPaymentDate; }

    public Integer getOverdueDays() { return overdueDays; }
    public void setOverdueDays(Integer overdueDays) { this.overdueDays = overdueDays; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getCreditScoreBreakdown() { return creditScoreBreakdown; }
    public void setCreditScoreBreakdown(String creditScoreBreakdown) { this.creditScoreBreakdown = creditScoreBreakdown; }

    public String getEmiCalculationBreakdown() { return emiCalculationBreakdown; }
    public void setEmiCalculationBreakdown(String emiCalculationBreakdown) { this.emiCalculationBreakdown = emiCalculationBreakdown; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
