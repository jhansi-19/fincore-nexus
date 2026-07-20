-- =========================================================
-- FinCore Nexus - Milestone 2: Loan Management Tables
-- Run this in psql or pgAdmin on fincore_db
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TABLE: loans
CREATE TABLE IF NOT EXISTS loans (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_number              VARCHAR(30) UNIQUE NOT NULL,
    customer_id              UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    account_id               UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    loan_type                VARCHAR(30) NOT NULL
                               CHECK (loan_type IN ('HOME_LOAN','PERSONAL_LOAN','CAR_LOAN','EDUCATION_LOAN','BUSINESS_LOAN')),
    principal_amount         DECIMAL(18,2) NOT NULL,
    outstanding_amount       DECIMAL(18,2) DEFAULT 0.00,
    interest_rate            DECIMAL(5,2)  NOT NULL,
    tenure_months            INTEGER       NOT NULL,
    emi_amount               DECIMAL(18,2),
    status                   VARCHAR(20)   DEFAULT 'PENDING'
                               CHECK (status IN ('PENDING','CREDIT_CHECK','APPROVED','REJECTED','DISBURSED','ACTIVE','CLOSED','NPA')),
    credit_score             INTEGER,
    credit_assessment_result VARCHAR(20),
    saga_status              VARCHAR(60),
    saga_step                VARCHAR(30),
    kafka_event_id           VARCHAR(100),
    kafka_event_status       VARCHAR(20)   DEFAULT 'PENDING',
    latency_ms               INTEGER       DEFAULT 0,
    disbursed_at             TIMESTAMP,
    next_emi_date            DATE,
    last_payment_date        DATE,
    overdue_days             INTEGER       DEFAULT 0,
    purpose                  TEXT,
    created_at               TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: loan_payments
CREATE TABLE IF NOT EXISTS loan_payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id             UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    payment_reference   VARCHAR(60) UNIQUE NOT NULL,
    emi_number          INTEGER,
    amount_paid         DECIMAL(18,2) NOT NULL,
    principal_component DECIMAL(18,2),
    interest_component  DECIMAL(18,2),
    outstanding_after   DECIMAL(18,2),
    payment_date        DATE,
    status              VARCHAR(20) DEFAULT 'SUCCESS'
                          CHECK (status IN ('SUCCESS','FAILED','REVERSED')),
    payment_mode        VARCHAR(30) DEFAULT 'ACCOUNT_DEBIT',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_loans_customer     ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status       ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);

-- =========================================================
-- SEED DATA: Loans
-- =========================================================
INSERT INTO loans (id, loan_number, customer_id, account_id, loan_type,
    principal_amount, outstanding_amount, interest_rate, tenure_months,
    emi_amount, status, credit_score, credit_assessment_result,
    saga_status, saga_step, kafka_event_id, kafka_event_status,
    latency_ms, disbursed_at, next_emi_date)
VALUES
  ('d0000001-0000-0000-0000-000000000001','HL-2026-1247',
   'a0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   'HOME_LOAN', 240000.00, 238153.00, 8.50, 240,
   1847.00, 'ACTIVE', 780, 'APPROVED',
   'Account→Loan→Disbursed','DISBURSED','EVT-A1B2C3D4','PUBLISHED',
   47, CURRENT_TIMESTAMP - INTERVAL '1 month', CURRENT_DATE + INTERVAL '5 days'),

  ('d0000001-0000-0000-0000-000000000002','PL-2026-3892',
   'a0000001-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000002',
   'PERSONAL_LOAN', 25000.00, 24100.00, 13.75, 36,
   848.00, 'ACTIVE', 720, 'APPROVED',
   'Account→Loan→Disbursed','DISBURSED','EVT-B2C3D4E5','PUBLISHED',
   32, CURRENT_TIMESTAMP - INTERVAL '1 month', CURRENT_DATE + INTERVAL '3 days'),

  ('d0000001-0000-0000-0000-000000000003','CL-2026-5021',
   'a0000001-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000003',
   'CAR_LOAN', 35000.00, 35000.00, 10.25, 60,
   748.00, 'APPROVED', 695, 'APPROVED',
   'Account→Loan→Payment','LOAN_CREATED','EVT-C3D4E5F6','PUBLISHED',
   28, NULL, NULL),

  ('d0000001-0000-0000-0000-000000000004','BL-2026-7734',
   'a0000001-0000-0000-0000-000000000005',
   'b0000001-0000-0000-0000-000000000005',
   'BUSINESS_LOAN', 500000.00, 500000.00, 12.50, 84,
   8432.00, 'DISBURSED', 810, 'APPROVED',
   'Account→Loan→Disbursed','DISBURSED','EVT-D4E5F6G7','PUBLISHED',
   55, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '1 month')
ON CONFLICT (loan_number) DO NOTHING;

-- SEED DATA: Loan Payments
INSERT INTO loan_payments (loan_id, payment_reference, emi_number, amount_paid,
    principal_component, interest_component, outstanding_after, payment_date, status, payment_mode)
VALUES
  ('d0000001-0000-0000-0000-000000000001','LPAY-1000000001-001',
   1, 1847.00, 147.00, 1700.00, 238153.00,
   CURRENT_DATE - INTERVAL '1 month', 'SUCCESS', 'ACCOUNT_DEBIT'),

  ('d0000001-0000-0000-0000-000000000002','LPAY-1000000002-001',
   1, 848.00, 561.00, 287.00, 24439.00,
   CURRENT_DATE - INTERVAL '1 month', 'SUCCESS', 'ACCOUNT_DEBIT')
ON CONFLICT (payment_reference) DO NOTHING;

SELECT 'Milestone 2 tables created successfully!' AS status;
SELECT COUNT(*) AS loan_count FROM loans;
SELECT COUNT(*) AS payment_count FROM loan_payments;
