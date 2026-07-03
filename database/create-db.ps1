# FinCore Nexus - Create PostgreSQL Database
# Run this script once to set up the database

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "fincore123"

Write-Host "Creating FinCore database..." -ForegroundColor Cyan

# Create the database
& "$pgBin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS fincore_db;" 2>&1
& "$pgBin\psql.exe" -U postgres -c "CREATE DATABASE fincore_db;" 2>&1

# Run init.sql on the new database
& "$pgBin\psql.exe" -U postgres -d fincore_db -f "$PSScriptRoot\init.sql" 2>&1

Write-Host "Database setup complete!" -ForegroundColor Green
