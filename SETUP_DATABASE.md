# PostgreSQL Database Setup

This guide helps you set up the PostgreSQL database for the Chit Fund Management System.

## Prerequisites

- PostgreSQL 12 or higher installed
- psql command-line tool available
- Sufficient permissions to create databases and users

## Installation Steps

### 1. Start PostgreSQL Service

**Windows (via Services)**:
```
services.msc → Find PostgreSQL → Start
```

**Windows (Command Line)**:
```bash
net start postgresql-x64-14
```

**macOS**:
```bash
brew services start postgresql
```

**Linux**:
```bash
sudo systemctl start postgresql
```

### 2. Connect to PostgreSQL

```bash
psql -U postgres
```

When prompted, enter your PostgreSQL password.

### 3. Create Database and User

```sql
-- Create database
CREATE DATABASE chit_fund_db;

-- Create user
CREATE USER chit_user WITH PASSWORD 'chit_password';

-- Grant privileges
ALTER ROLE chit_user SET client_encoding TO 'utf8';
ALTER ROLE chit_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE chit_user SET default_transaction_deferrable TO on;
ALTER ROLE chit_user SET default_transaction_readonly TO off;
GRANT ALL PRIVILEGES ON DATABASE chit_fund_db TO chit_user;

-- Exit psql
\q
```

### 4. Load Database Schema

```bash
cd database

# Load schema
psql -U chit_user -d chit_fund_db -f schema.sql

# Load sample data (optional)
psql -U chit_user -d chit_fund_db -f seed.sql
```

### 5. Verify Installation

```bash
psql -U chit_user -d chit_fund_db -c "SELECT COUNT(*) FROM users;"
```

Should return `0` if schema loaded successfully.

## Connection String

For backend `.env`:
```
DATABASE_URL=postgresql://chit_user:chit_password@localhost:5432/chit_fund_db
```

## Backup Database

```bash
pg_dump -U chit_user -d chit_fund_db > backup.sql
```

## Restore Database

```bash
psql -U chit_user -d chit_fund_db < backup.sql
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL service is running
- Check if port 5432 is not blocked
- Verify username and password

### Permission Denied
```bash
psql -U postgres -d chit_fund_db -c "ALTER USER chit_user WITH CREATEDB;"
```

### File Not Found
- Ensure schema.sql exists in `database/` directory
- Use absolute path to file

## Database Tables

- `users` - User authentication
- `members` - Member information
- `chit_groups` - Group definitions
- `group_members` - Group membership
- `contributions` - Member payments
- `auctions` - Monthly auctions
- `payouts` - Payout records

See [schema.sql](schema.sql) for complete DDL.
