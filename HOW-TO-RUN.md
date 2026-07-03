# How to Run FinCore Nexus – Milestone 1

Follow these instructions to run the **FinCore Nexus - Milestone 1 (Account & Customer Services)** application locally on your Windows machine using VSCode.

---

## Prerequisites Checklist

Ensure you have installed:
1. **Java Development Kit (JDK) 21 or 25**
2. **Apache Maven 3.9+**
3. **Node.js (v18+) & npm (v9+)**
4. **PostgreSQL (v15+)** (with superuser `postgres` and password `fincore123`)

---

## Step 1: Initialize the PostgreSQL Database

1. Open a terminal in VSCode (PowerShell).
2. Execute the PowerShell helper script located in the `database` folder:
   ```powershell
   cd c:\fincore\database
   .\create-db.ps1
   ```
   *Note: If you run into registry permission issues with the script, you can initialize manually by running:*
   ```powershell
   & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE fincore_db;"
   & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d fincore_db -f c:\fincore\database\init.sql
   ```
3. Type the password `fincore123` when prompted.

---

## Step 2: Run the Backend Microservices

You will need **three separate terminals** in VSCode to run the three Spring Boot microservices simultaneously.

### Terminal 1: Customer Service (Port 8082)
```powershell
cd c:\fincore\backend\customer-service
mvn spring-boot:run
```

### Terminal 2: Account Service (Port 8081)
```powershell
cd c:\fincore\backend\account-service
mvn spring-boot:run
```

### Terminal 3: Transaction Service (Port 8083)
```powershell
cd c:\fincore\backend\transaction-service
mvn spring-boot:run
```

*Wait for all three services to output `Started ...Application in X seconds`.*

---

## Step 3: Run the Angular Frontend App

### Terminal 4: Frontend CLI (Port 4200)
1. Open a fourth terminal.
2. Install the frontend dependencies (only needed the first time):
   ```powershell
   cd c:\fincore\frontend\fincore-ui
   npm install
   ```
3. Start the Angular dev server:
   ```powershell
   npm start
   ```
4. Once compiled, open your browser and navigate to:
   👉 **`http://localhost:4200`**

---

## Verification & Testing Guide

Once everything is up, check out these features in the portal:

1. **Dashboard Overview**: Check the real-time card counters for Customers, Accounts, and total processed value.
2. **Milestone 1 Expected Output Screen**: Locate the verification board on the dashboard displaying the exact target output specs:
   - Account Number: `1234-5678-9012`
   - Balance: `$12,847.50`
   - Transaction: `Deposit $2,400`
   - Kafka Event: `Published`
   - Latency: `47 ms`
3. **Register Customer**: Go to **Customers** -> **Register Customer** and fill the profile form.
4. **KYC Verification**: In the **Customers** list, test modifying the KYC status dropdowns (Verify, Reject, Review).
5. **Open Account**: Go to **Accounts** -> **Open Account** and associate a new Savings, Current, or Fixed Deposit account with a registered customer.
6. **Post Transactions**: Go to **Transactions** -> **Post Transaction** to submit deposits or withdrawals. The system will output the live transaction receipt displaying the unique reference, simulated Kafka event status, and processing latency.
7. **Statement Generation**: Go to **Transactions** and use the **Statement Generation Engine** to filter statements by dates and accounts.
