-- Chit Fund Management System schema for PostgreSQL

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(150) UNIQUE,
  address TEXT,
  profile_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
  member_id INTEGER UNIQUE REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chit_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  monthly_amount NUMERIC(12,2) NOT NULL CHECK (monthly_amount > 0),
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  start_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UPCOMING', 'CLOSED')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (group_id, member_id)
);

CREATE TABLE IF NOT EXISTS contributions (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution_month INTEGER NOT NULL CHECK (contribution_month > 0),
  amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid > 0),
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(40) NOT NULL DEFAULT 'CASH',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, member_id, contribution_month)
);

CREATE TABLE IF NOT EXISTS auctions (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES chit_groups(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL CHECK (month_number > 0),
  scheduled_on DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  winner_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  bid_discount_percent NUMERIC(5,2),
  pool_amount NUMERIC(14,2),
  winner_payout NUMERIC(14,2),
  dividend_per_member NUMERIC(14,2),
  completed_on TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, month_number)
);

CREATE TABLE IF NOT EXISTS payouts (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL UNIQUE REFERENCES auctions(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member ON group_members(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_group_member ON contributions(group_id, member_id);
CREATE INDEX IF NOT EXISTS idx_auctions_group ON auctions(group_id);
CREATE INDEX IF NOT EXISTS idx_payouts_member ON payouts(member_id);
