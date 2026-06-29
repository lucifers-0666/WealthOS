-- Migration: 011_sandbox_fixes.sql

-- 1. Add realized_pnl to sandbox_wallet
ALTER TABLE sandbox_wallet
ADD COLUMN IF NOT EXISTS realized_pnl DECIMAL(15,2) NOT NULL DEFAULT 0.00;

-- 2. Modify constraints on sandbox_orders to allow 'RESET'
ALTER TABLE sandbox_orders DROP CONSTRAINT IF EXISTS sandbox_orders_order_type_check;
ALTER TABLE sandbox_orders ADD CONSTRAINT sandbox_orders_order_type_check CHECK (order_type IN ('EQUITY','OPTION','FUTURE','RESET'));

ALTER TABLE sandbox_orders DROP CONSTRAINT IF EXISTS sandbox_orders_action_check;
ALTER TABLE sandbox_orders ADD CONSTRAINT sandbox_orders_action_check CHECK (action IN ('BUY','SELL','RESET'));
