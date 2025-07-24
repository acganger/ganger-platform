-- Migration: Fix staff_tickets table naming
-- Issue: Code expects 'staff_tickets' but schema has 'tickets'
-- Solution: Rename table to match code expectations

-- Check if tickets table exists and staff_tickets doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_tickets' AND table_schema = 'public') THEN
        
        -- Rename the table
        ALTER TABLE public.tickets RENAME TO staff_tickets;
        
        -- Update any associated sequences
        IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'tickets_id_seq') THEN
            ALTER SEQUENCE tickets_id_seq RENAME TO staff_tickets_id_seq;
        END IF;
        
        -- Update any indexes that might have the old table name
        -- Note: PostgreSQL automatically updates foreign key constraints
        
        RAISE NOTICE 'Successfully renamed tickets table to staff_tickets';
    ELSE
        RAISE NOTICE 'Table renaming not needed - either staff_tickets already exists or tickets does not exist';
    END IF;
END $$;

-- Verify the change
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_tickets' AND table_schema = 'public')
        THEN 'SUCCESS: staff_tickets table exists'
        ELSE 'WARNING: staff_tickets table does not exist'
    END as status;