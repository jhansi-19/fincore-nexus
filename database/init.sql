-- =========================================================
-- FinCore Nexus - Milestone 1: Account & Customer Services
-- PostgreSQL 17 Database Schema + Seed Data
-- =========================================================

-- Create database (run as superuser first if needed)
-- \c postgres
-- DROP DATABASE IF EXISTS fincore_db;
-- CREATE DATABASE fincore_db;
-- \c fincore_db

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- TABLE: customers
-- =========================================================
CREATE TABLE IF NOT EXISTS customers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    phone            VARCHAR(20),
    date_of_birth    DATE,
    address          TEXT,
    city             VARCHAR(100),
    state            VARCHAR(100),
    postal_code      VARCHAR(20),
    country          VARCHAR(100) DEFAULT 'USA',
    kyc_status       VARCHAR(20)  DEFAULT 'PENDING'
                       CHECK (kyc_status IN ('PENDING','IN_REVIEW','VERIFIED','REJECTED')),
    customer_type    VARCHAR(20)  DEFAULT 'INDIVIDUAL'
                       CHECK (customer_type IN ('INDIVIDUAL','CORPORATE')),
    is_active        BOOLEAN      DEFAULT TRUE,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: accounts
-- =========================================================
CREATE TABLE IF NOT EXISTS accounts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number   VARCHAR(25) UNIQUE NOT NULL,
    customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    account_type     VARCHAR(20) NOT NULL
                       CHECK (account_type IN ('SAVINGS','CURRENT','FIXED_DEPOSIT')),
    status           VARCHAR(20)  DEFAULT 'ACTIVE'
                       CHECK (status IN ('PENDING','ACTIVE','DORMANT','CLOSED','FROZEN')),
    balance          DECIMAL(18,2) DEFAULT 0.00,
    currency         VARCHAR(3)    DEFAULT 'USD',
    interest_rate    DECIMAL(5,2)  DEFAULT 0.00,
    minimum_balance  DECIMAL(18,2) DEFAULT 0.00,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: transactions
-- =========================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference  VARCHAR(60) UNIQUE NOT NULL,
    account_id             UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    transaction_type       VARCHAR(20) NOT NULL
                             CHECK (transaction_type IN ('DEPOSIT','WITHDRAWAL','TRANSFER','FEE','INTEREST')),
    amount                 DECIMAL(18,2) NOT NULL,
    balance_before         DECIMAL(18,2),
    balance_after          DECIMAL(18,2),
    description            TEXT,
    status                 VARCHAR(20) DEFAULT 'SUCCESS'
                             CHECK (status IN ('PENDING','SUCCESS','FAILED','REVERSED')),
    kafka_event_id         VARCHAR(100),
    kafka_event_status     VARCHAR(20) DEFAULT 'PUBLISHED',
    latency_ms             INTEGER     DEFAULT 0,
    created_at             TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: kyc_documents
-- =========================================================
CREATE TABLE IF NOT EXISTS kyc_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    document_type       VARCHAR(50) NOT NULL,
    document_number     VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verified_at         TIMESTAMP,
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: audit_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type   VARCHAR(50) NOT NULL,
    entity_id     UUID,
    action        VARCHAR(50) NOT NULL,
    performed_by  VARCHAR(100) DEFAULT 'SYSTEM',
    old_value     TEXT,
    new_value     TEXT,
    ip_address    VARCHAR(50),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_accounts_customer_id   ON accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status        ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_account   ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type      ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created   ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_email        ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_kyc          ON customers(kyc_status);

-- =========================================================
-- SEED DATA: Customers
-- =========================================================
INSERT INTO customers (id, first_name, last_name, email, phone, date_of_birth,
    address, city, state, postal_code, kyc_status, customer_type)
VALUES
  ('a0000001-0000-0000-0000-000000000001','John','Smith',
   'john.smith@fincore.com','+1-555-0101','1985-03-15',
   '123 Main Street','New York','NY','10001','VERIFIED','INDIVIDUAL'),

  ('a0000001-0000-0000-0000-000000000002','Jane','Doe',
   'jane.doe@fincore.com','+1-555-0102','1990-07-22',
   '456 Oak Avenue','Los Angeles','CA','90001','VERIFIED','INDIVIDUAL'),

  ('a0000001-0000-0000-0000-000000000003','Robert','Johnson',
   'robert.johnson@fincore.com','+1-555-0103','1978-11-08',
   '789 Pine Road','Chicago','IL','60601','IN_REVIEW','INDIVIDUAL'),

  ('a0000001-0000-0000-0000-000000000004','Michael','Williams',
   'michael.williams@fincore.com','+1-555-0104','1995-02-14',
   '321 Elm Street','Houston','TX','77001','PENDING','INDIVIDUAL'),

  ('a0000001-0000-0000-0000-000000000005','FinCore','Corp',
   'corporate@fincoreltd.com','+1-555-0200',NULL,
   '1 Financial Plaza','New York','NY','10004','VERIFIED','CORPORATE')
ON CONFLICT (email) DO NOTHING;

-- =========================================================
-- SEED DATA: Accounts
-- =========================================================
INSERT INTO accounts (id, account_number, customer_id, account_type, status,
    balance, currency, interest_rate, minimum_balance)
VALUES
  ('b0000001-0000-0000-0000-000000000001','1234-5678-9012',
   'a0000001-0000-0000-0000-000000000001','SAVINGS','ACTIVE',12847.50,'USD',3.50,500.00),

  ('b0000001-0000-0000-0000-000000000002','1234-5678-9013',
   'a0000001-0000-0000-0000-000000000002','CURRENT','ACTIVE',45230.00,'USD',0.00,1000.00),

  ('b0000001-0000-0000-0000-000000000003','1234-5678-9014',
   'a0000001-0000-0000-0000-000000000003','SAVINGS','ACTIVE',8950.75,'USD',3.50,500.00),

  ('b0000001-0000-0000-0000-000000000004','1234-5678-9015',
   'a0000001-0000-0000-0000-000000000004','SAVINGS','PENDING',0.00,'USD',3.50,500.00),

  ('b0000001-0000-0000-0000-000000000005','1234-5678-9016',
   'a0000001-0000-0000-0000-000000000005','FIXED_DEPOSIT','ACTIVE',250000.00,'USD',6.75,10000.00)
ON CONFLICT (account_number) DO NOTHING;

-- =========================================================
-- SEED DATA: Transactions
-- =========================================================
INSERT INTO transactions (id, transaction_reference, account_id, transaction_type,
    amount, balance_before, balance_after, description, status, kafka_event_status, latency_ms)
VALUES
  ('c0000001-0000-0000-0000-000000000001','TXN-2024-000001',
   'b0000001-0000-0000-0000-000000000001','DEPOSIT',
   2400.00,10447.50,12847.50,'Salary Credit - June 2024','SUCCESS','PUBLISHED',47),

  ('c0000001-0000-0000-0000-000000000002','TXN-2024-000002',
   'b0000001-0000-0000-0000-000000000001','WITHDRAWAL',
   500.00,12847.50,12347.50,'ATM Withdrawal - Times Square','SUCCESS','PUBLISHED',32),

  ('c0000001-0000-0000-0000-000000000003','TXN-2024-000003',
   'b0000001-0000-0000-0000-000000000002','DEPOSIT',
   15000.00,30230.00,45230.00,'Wire Transfer - Client Payment','SUCCESS','PUBLISHED',55),

  ('c0000001-0000-0000-0000-000000000004','TXN-2024-000004',
   'b0000001-0000-0000-0000-000000000003','DEPOSIT',
   1000.00,7950.75,8950.75,'Online Transfer - Savings','SUCCESS','PUBLISHED',28),

  ('c0000001-0000-0000-0000-000000000005','TXN-2024-000005',
   'b0000001-0000-0000-0000-000000000001','DEPOSIT',
   5000.00,12347.50,17347.50,'Investment Returns','SUCCESS','PUBLISHED',41),

  ('c0000001-0000-0000-0000-000000000006','TXN-2024-000006',
   'b0000001-0000-0000-0000-000000000002','WITHDRAWAL',
   2000.00,45230.00,43230.00,'Vendor Payment','SUCCESS','PUBLISHED',38)
ON CONFLICT (transaction_reference) DO NOTHING;

-- =========================================================
-- SEED DATA: KYC Documents
-- =========================================================
INSERT INTO kyc_documents (customer_id, document_type, document_number, verification_status, verified_at)
VALUES
  ('a0000001-0000-0000-0000-000000000001','PASSPORT','P123456789','VERIFIED',CURRENT_TIMESTAMP),
  ('a0000001-0000-0000-0000-000000000001','DRIVING_LICENSE','DL987654321','VERIFIED',CURRENT_TIMESTAMP),
  ('a0000001-0000-0000-0000-000000000002','NATIONAL_ID','NID246813579','VERIFIED',CURRENT_TIMESTAMP),
  ('a0000001-0000-0000-0000-000000000003','PASSPORT','P987654321','PENDING',NULL);

-- =========================================================
-- Done! (Milestone 1)
-- =========================================================

-- =========================================================
-- Milestone 2: Loan Management
-- =========================================================

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
CREATE INDEX IF NOT EXISTS idx_loans_customer    ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status      ON loans(status);
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

-- =========================================================
-- Final Status
-- =========================================================
SELECT 'FinCore Nexus DB initialized successfully!' AS status;
SELECT COUNT(*) AS customer_count FROM customers;
SELECT COUNT(*) AS account_count  FROM accounts;
SELECT COUNT(*) AS txn_count      FROM transactions;
SELECT COUNT(*) AS loan_count     FROM loans;

