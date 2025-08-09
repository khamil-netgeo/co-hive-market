-- Extend enums to support rider earnings and payouts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'ledger_entry_type' AND e.enumlabel = 'rider_earning') THEN
    ALTER TYPE public.ledger_entry_type ADD VALUE IF NOT EXISTS 'rider_earning';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'ledger_entry_type' AND e.enumlabel = 'rider_payout') THEN
    ALTER TYPE public.ledger_entry_type ADD VALUE IF NOT EXISTS 'rider_payout';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'beneficiary_type' AND e.enumlabel = 'rider') THEN
    ALTER TYPE public.beneficiary_type ADD VALUE IF NOT EXISTS 'rider';
  END IF;
END $$;