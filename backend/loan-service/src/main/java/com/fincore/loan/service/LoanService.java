package com.fincore.loan.service;

import com.fincore.loan.entity.Loan;
import com.fincore.loan.entity.LoanPayment;
import com.fincore.loan.repository.LoanPaymentRepository;
import com.fincore.loan.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final LoanPaymentRepository loanPaymentRepository;
    private final RestTemplate restTemplate;

    @Value("${fincore.account-service.url}")
    private String accountServiceUrl;

    public LoanService(LoanRepository loanRepository,
                       LoanPaymentRepository loanPaymentRepository,
                       RestTemplate restTemplate) {
        this.loanRepository = loanRepository;
        this.loanPaymentRepository = loanPaymentRepository;
        this.restTemplate = restTemplate;
    }

    // ============================================================
    // GET ALL LOANS
    // ============================================================
    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    // ============================================================
    // GET LOAN BY ID
    // ============================================================
    public Loan getLoanById(UUID id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found with id: " + id));
    }

    // ============================================================
    // GET LOANS BY CUSTOMER
    // ============================================================
    public List<Loan> getLoansByCustomerId(UUID customerId) {
        return loanRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    // ============================================================
    // APPLY FOR LOAN (Origination + Credit Check)
    // ============================================================
    @Transactional
    public Loan applyForLoan(Loan loan) {

        // Step 1: Verify the account exists in Account Service
        String balanceUrl = accountServiceUrl + "/api/v1/accounts/" + loan.getAccountId() + "/balance";
        try {
            restTemplate.getForObject(balanceUrl, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Account not found. Please verify the account ID is correct.");
        }

        // Step 2: Generate loan number (HL-2026-XXXX format)
        String prefix = getLoanPrefix(loan.getLoanType());
        String loanNumber = prefix + "-2026-" + (1000 + (int)(Math.random() * 8999));
        loan.setLoanNumber(loanNumber);

        // Step 3: Perform Credit Assessment (Real-time Internal Score Engine)
        Map<String, Object> assessment = calculateCreditScoreDetails(loan.getCustomerId(), loan.getAccountId());
        int creditScore = (int) assessment.get("score");
        String breakdown = (String) assessment.get("breakdown");
        
        loan.setCreditScore(creditScore);
        loan.setCreditScoreBreakdown(breakdown);
        loan.setStatus("CREDIT_CHECK");
        
        // Set default interest rate immediately so database constraints are satisfied
        loan.setInterestRate(getDefaultInterestRate(loan.getLoanType()));

        if (creditScore >= 700) {
            loan.setCreditAssessmentResult("APPROVED");
            loan.setStatus("APPROVED");
        } else if (creditScore >= 600) {
            loan.setCreditAssessmentResult("MANUAL_REVIEW");
            loan.setStatus("PENDING");
        } else {
            loan.setCreditAssessmentResult("REJECTED");
            loan.setStatus("REJECTED");
            loan.setOutstandingAmount(BigDecimal.ZERO);
            loan.setEmiAmount(BigDecimal.ZERO);
            loan.setSagaStatus("Account→Loan→Rejected");
            loan.setSagaStep("REJECTED");
            loan.setKafkaEventId("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            loan.setKafkaEventStatus("PUBLISHED");
            loan.setLatencyMs((int)(Math.random() * 60) + 15);
            return loanRepository.save(loan);
        }

        // Step 5: Calculate EMI using standard formula
        // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        BigDecimal principal = loan.getPrincipalAmount();
        BigDecimal annualRate = loan.getInterestRate();
        int months = loan.getTenureMonths();

        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal onePlusRPowN = onePlusR.pow(months, MathContext.DECIMAL128);
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(onePlusRPowN);
        BigDecimal denominator = onePlusRPowN.subtract(BigDecimal.ONE);
        BigDecimal emi = numerator.divide(denominator, 2, RoundingMode.HALF_UP);

        StringBuilder emiBreakdown = new StringBuilder();
        emiBreakdown.append("Formula: EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]\n")
                .append("- Principal (P): $").append(principal).append("\n")
                .append("- Annual Rate: ").append(annualRate).append("% p.a.\n")
                .append("- Monthly Rate (r): ").append(monthlyRate.setScale(6, RoundingMode.HALF_UP)).append(" (Annual Rate / 12 / 100)\n")
                .append("- Tenure (n): ").append(months).append(" months\n")
                .append("- Factor (1+r)^n: ").append(onePlusRPowN.setScale(6, RoundingMode.HALF_UP)).append("\n")
                .append("- Numerator [P x r x (1+r)^n]: ").append(numerator.setScale(2, RoundingMode.HALF_UP)).append("\n")
                .append("- Denominator [(1+r)^n - 1]: ").append(denominator.setScale(6, RoundingMode.HALF_UP)).append("\n")
                .append("Final Calculated EMI: $").append(emi);

        loan.setEmiCalculationBreakdown(emiBreakdown.toString());
        loan.setEmiAmount(emi);
        loan.setOutstandingAmount(principal);

        // Step 6: Saga Tracking
        loan.setSagaStatus("Account→Loan→Payment");
        loan.setSagaStep("LOAN_CREATED");

        // Step 7: Kafka simulation
        loan.setKafkaEventId("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        loan.setKafkaEventStatus("PUBLISHED");
        loan.setLatencyMs((int)(Math.random() * 60) + 15);

        return loanRepository.save(loan);
    }

    // ============================================================
    // DISBURSE LOAN (Saga: Account Check → Loan → Disburse)
    // ============================================================
    @Transactional
    public Loan disburseLoan(UUID loanId) {
        Loan loan = getLoanById(loanId);

        if (!"APPROVED".equals(loan.getStatus())) {
            throw new RuntimeException("Loan cannot be disbursed. Current status: " + loan.getStatus());
        }

        // Saga Step 1: Account Check
        loan.setSagaStep("ACCOUNT_CHECKED");
        String balanceUrl = accountServiceUrl + "/api/v1/accounts/" + loan.getAccountId() + "/balance";
        try {
            restTemplate.getForObject(balanceUrl, Map.class);
        } catch (Exception e) {
            loan.setStatus("REJECTED");
            loan.setSagaStep("FAILED");
            loanRepository.save(loan);
            throw new RuntimeException("Account Service unreachable during disbursement.");
        }

        // Saga Step 2: Loan Created / Disbursement Initiated
        loan.setSagaStep("DISBURSING");

        // Saga Step 3: Credit Disbursement Amount to Account (Real HTTP Call)
        String depositUrl = accountServiceUrl + "/api/v1/accounts/" + loan.getAccountId() + "/deposit";
        try {
            Map<String, Object> depositRequest = Map.of("amount", loan.getPrincipalAmount());
            restTemplate.postForObject(depositUrl, depositRequest, Map.class);
        } catch (Exception e) {
            loan.setStatus("PENDING");
            loan.setSagaStep("FAILED");
            loanRepository.save(loan);
            throw new RuntimeException("Disbursement failed: could not credit account. " + e.getMessage());
        }

        // Saga Step 4: Mark Disbursed
        loan.setStatus("DISBURSED");
        loan.setSagaStep("DISBURSED");
        loan.setSagaStatus("Account→Loan→Disbursed");
        loan.setDisbursedAt(LocalDateTime.now());
        loan.setNextEmiDate(LocalDate.now().plusMonths(1));
        loan.setKafkaEventId("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        loan.setKafkaEventStatus("PUBLISHED");
        loan.setLatencyMs((int)(Math.random() * 60) + 20);

        return loanRepository.save(loan);
    }

    // ============================================================
    // REPAY EMI (Debit Account Service + Record Payment)
    // ============================================================
    @Transactional
    public LoanPayment repayEmi(UUID loanId) {
        Loan loan = getLoanById(loanId);

        if (!"DISBURSED".equals(loan.getStatus()) && !"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not in a repayable state. Status: " + loan.getStatus());
        }

        if (loan.getOutstandingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Loan is already fully repaid.");
        }

        // Step 1: Debit EMI amount from Account Service (Real HTTP Call)
        String withdrawUrl = accountServiceUrl + "/api/v1/accounts/" + loan.getAccountId() + "/withdraw";
        BigDecimal emiToPay = loan.getEmiAmount().min(loan.getOutstandingAmount());
        try {
            Map<String, Object> withdrawRequest = Map.of("amount", emiToPay);
            restTemplate.postForObject(withdrawUrl, withdrawRequest, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("EMI debit failed: " + e.getMessage());
        }

        // Step 2: Calculate principal and interest breakdown
        BigDecimal monthlyRate = loan.getInterestRate()
                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);
        BigDecimal interestComponent = loan.getOutstandingAmount()
                .multiply(monthlyRate)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal principalComponent = emiToPay.subtract(interestComponent).max(BigDecimal.ZERO);
        BigDecimal outstandingAfter = loan.getOutstandingAmount().subtract(principalComponent).max(BigDecimal.ZERO);

        // Step 3: Update loan record
        long paymentCount = loanPaymentRepository.countByLoanId(loanId);
        loan.setOutstandingAmount(outstandingAfter);
        loan.setLastPaymentDate(LocalDate.now());
        loan.setStatus(outstandingAfter.compareTo(BigDecimal.ZERO) == 0 ? "CLOSED" : "ACTIVE");
        loan.setNextEmiDate(outstandingAfter.compareTo(BigDecimal.ZERO) > 0
                ? LocalDate.now().plusMonths(1) : null);
        loanRepository.save(loan);

        // Step 4: Record the payment
        LoanPayment payment = new LoanPayment();
        payment.setLoanId(loanId);
        payment.setPaymentReference("LPAY-" + System.currentTimeMillis() + "-" + String.format("%03d", paymentCount + 1));
        payment.setEmiNumber((int) paymentCount + 1);
        payment.setAmountPaid(emiToPay);
        payment.setPrincipalComponent(principalComponent);
        payment.setInterestComponent(interestComponent);
        payment.setOutstandingAfter(outstandingAfter);
        payment.setPaymentDate(LocalDate.now());
        payment.setStatus("SUCCESS");
        payment.setPaymentMode("ACCOUNT_DEBIT");

        return loanPaymentRepository.save(payment);
    }

    // ============================================================
    // GET EMI PAYMENTS FOR A LOAN
    // ============================================================
    public List<LoanPayment> getLoanPayments(UUID loanId) {
        return loanPaymentRepository.findByLoanIdOrderByCreatedAtDesc(loanId);
    }

    // ============================================================
    // DASHBOARD STATS
    // ============================================================
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLoans", loanRepository.countTotalLoans());
        stats.put("totalDisbursed", loanRepository.sumTotalDisbursed());
        stats.put("npaCount", loanRepository.countNpaLoans());
        stats.put("activeLoans", loanRepository.countActiveLoans());
        stats.put("outstandingAmount", loanRepository.sumOutstandingAmount());
        return stats;
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    // Standard EMI formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    private BigDecimal calculateEmi(BigDecimal principal, BigDecimal annualRate, int months) {
        if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
        }
        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal onePlusRPowN = onePlusR.pow(months, MathContext.DECIMAL128);
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(onePlusRPowN);
        BigDecimal denominator = onePlusRPowN.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private Map<String, Object> calculateCreditScoreDetails(UUID customerId, UUID accountId) {
        int score = 600; // Base score
        StringBuilder breakdown = new StringBuilder("Base Credit Score: 600\n");

        // 1. Check KYC Status via Customer Service (GET http://localhost:8082/api/v1/customers/{customerId})
        String customerUrl = "http://localhost:8082/api/v1/customers/" + customerId;
        try {
            Map<String, Object> customerResponse = restTemplate.getForObject(customerUrl, Map.class);
            if (customerResponse != null && customerResponse.containsKey("kycStatus")) {
                String kycStatus = (String) customerResponse.get("kycStatus");
                breakdown.append("- KYC Status: ").append(kycStatus);
                if ("VERIFIED".equalsIgnoreCase(kycStatus)) {
                    score += 100;
                    breakdown.append(" (+100)\n");
                } else if ("REJECTED".equalsIgnoreCase(kycStatus)) {
                    score -= 100;
                    breakdown.append(" (-100)\n");
                } else {
                    breakdown.append(" (+0)\n");
                }
            } else {
                breakdown.append("- KYC Status: Unknown (+0)\n");
            }
        } catch (Exception e) {
            breakdown.append("- KYC Status: Could not check (+0)\n");
        }

        // 2. Check Account Balance via Account Service (GET http://localhost:8081/api/v1/accounts/{accountId}/balance)
        String balanceUrl = accountServiceUrl + "/api/v1/accounts/" + accountId + "/balance";
        BigDecimal balance = BigDecimal.ZERO;
        try {
            Map<String, Object> balanceResponse = restTemplate.getForObject(balanceUrl, Map.class);
            if (balanceResponse != null && balanceResponse.containsKey("balance")) {
                balance = new BigDecimal(balanceResponse.get("balance").toString());
                breakdown.append("- Account Balance: $").append(balance.setScale(2, RoundingMode.HALF_UP));
                if (balance.compareTo(BigDecimal.valueOf(50000)) >= 0) {
                    score += 150;
                    breakdown.append(" (High: +150)\n");
                } else if (balance.compareTo(BigDecimal.valueOf(10000)) >= 0) {
                    score += 100;
                    breakdown.append(" (Medium: +100)\n");
                } else if (balance.compareTo(BigDecimal.valueOf(1000)) < 0) {
                    score -= 50;
                    breakdown.append(" (Low: -50)\n");
                } else {
                    breakdown.append(" (+0)\n");
                }
            } else {
                breakdown.append("- Account Balance: Unknown (+0)\n");
            }
        } catch (Exception e) {
            breakdown.append("- Account Balance: Could not check (+0)\n");
        }

        // 3. Scan Transaction History via Transaction Service (GET http://localhost:8083/api/v1/transactions/account/{accountId})
        String txUrl = "http://localhost:8083/api/v1/transactions/account/" + accountId;
        try {
            List<Map<String, Object>> transactions = restTemplate.getForObject(txUrl, List.class);
            boolean hasSalary = false;
            if (transactions != null) {
                for (Map<String, Object> tx : transactions) {
                    String desc = (String) tx.get("description");
                    if (desc != null && (desc.toLowerCase().contains("salary") || desc.toLowerCase().contains("credit"))) {
                        hasSalary = true;
                        break;
                    }
                }
            }
            if (hasSalary) {
                score += 100;
                breakdown.append("- Transaction History: Salary/Credits Detected (+100)\n");
            } else {
                breakdown.append("- Transaction History: No Salary/Credits (+0)\n");
            }
        } catch (Exception e) {
            breakdown.append("- Transaction History: Could not check (+0)\n");
        }

        // 4. Check Existing Active Loans in Loan Service Repository
        try {
            List<Loan> existingLoans = loanRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
            boolean hasActiveLoan = false;
            for (Loan l : existingLoans) {
                if ("ACTIVE".equalsIgnoreCase(l.getStatus()) || "DISBURSED".equalsIgnoreCase(l.getStatus())) {
                    hasActiveLoan = true;
                    break;
                }
            }
            if (hasActiveLoan) {
                score -= 100;
                breakdown.append("- Existing Loans: Active Debt Found (-100)\n");
            } else {
                score += 50;
                breakdown.append("- Existing Loans: No Active Debt (+50)\n");
            }
        } catch (Exception e) {
            breakdown.append("- Existing Loans: Could not check (+0)\n");
        }

        // Ensure score stays within standard FICO limits (300 to 850)
        score = Math.max(300, Math.min(850, score));
        breakdown.append("Final Calculated Credit Score: ").append(score);

        return Map.of("score", score, "breakdown", breakdown.toString());
    }

    private String getLoanPrefix(String loanType) {
        return switch (loanType.toUpperCase()) {
            case "HOME_LOAN" -> "HL";
            case "PERSONAL_LOAN" -> "PL";
            case "CAR_LOAN" -> "CL";
            case "EDUCATION_LOAN" -> "EL";
            case "BUSINESS_LOAN" -> "BL";
            default -> "LN";
        };
    }

    private BigDecimal getDefaultInterestRate(String loanType) {
        return switch (loanType.toUpperCase()) {
            case "HOME_LOAN" -> BigDecimal.valueOf(8.50);
            case "CAR_LOAN" -> BigDecimal.valueOf(10.25);
            case "EDUCATION_LOAN" -> BigDecimal.valueOf(9.00);
            case "BUSINESS_LOAN" -> BigDecimal.valueOf(12.50);
            default -> BigDecimal.valueOf(13.75); // PERSONAL_LOAN
        };
    }
}
