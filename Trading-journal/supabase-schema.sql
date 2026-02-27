-- ============================================
-- Trading Journal - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Settings table for user configuration (base capital, etc.)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default base capital
INSERT INTO settings (key, value) VALUES ('base_capital', '21000')
ON CONFLICT (key) DO NOTHING;

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Trade identification
  underlying TEXT NOT NULL,           -- e.g., SPY, AAPL, QQQ
  strategy TEXT NOT NULL,             -- Bull Put Spread, Bear Call Spread, Iron Condor, Wheel, Covered Call
  status TEXT NOT NULL DEFAULT 'open', -- open, closed, expired

  -- Dates
  open_date DATE NOT NULL,
  expiration_date DATE,
  close_date DATE,

  -- Legs / strike info
  short_strike NUMERIC,
  long_strike NUMERIC,
  short_call_strike NUMERIC,          -- For Iron Condor
  long_call_strike NUMERIC,           -- For Iron Condor

  -- Position details
  contracts INTEGER NOT NULL DEFAULT 1,
  premium_received NUMERIC NOT NULL DEFAULT 0,  -- Credit received
  premium_paid NUMERIC DEFAULT 0,               -- Debit paid (to close or for protection)
  commission NUMERIC DEFAULT 0,

  -- P&L
  close_price NUMERIC DEFAULT 0,       -- Cost to close
  realized_pnl NUMERIC DEFAULT 0,      -- Final P&L when closed
  current_price NUMERIC DEFAULT 0,     -- Current mark price for open positions

  -- Risk
  max_loss NUMERIC DEFAULT 0,          -- Maximum possible loss
  collateral NUMERIC DEFAULT 0,        -- Capital tied up / margin requirement

  -- Notes
  notes TEXT DEFAULT '',
  tags TEXT DEFAULT ''                  -- Comma-separated tags
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_underlying ON trades(underlying);
CREATE INDEX IF NOT EXISTS idx_trades_open_date ON trades(open_date);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy);

-- Enable Row Level Security (optional - enable if using auth)
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
