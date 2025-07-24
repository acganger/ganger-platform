-- =====================================================
-- Fix inventory_items table column mismatches
-- Migration: 20250722_fix_inventory_items_columns.sql
-- Created: July 22, 2025
-- =====================================================

-- Step 1: Rename existing columns to match the code
ALTER TABLE inventory_items 
  RENAME COLUMN quantity_on_hand TO current_stock;

ALTER TABLE inventory_items 
  RENAME COLUMN reorder_level TO minimum_stock;

ALTER TABLE inventory_items 
  RENAME COLUMN unit_price TO cost_per_unit;

-- Step 2: Add missing columns that the code expects
ALTER TABLE inventory_items 
  ADD COLUMN IF NOT EXISTS maximum_stock INTEGER,
  ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Step 3: Add constraints for the new columns
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_maximum_stock_non_negative 
    CHECK (maximum_stock IS NULL OR maximum_stock >= 0),
  ADD CONSTRAINT inventory_items_status_valid 
    CHECK (status IN ('active', 'inactive', 'discontinued'));

-- Step 4: Update the low stock index to use new column names
DROP INDEX IF EXISTS idx_inventory_items_low_stock;
CREATE INDEX idx_inventory_items_low_stock 
  ON inventory_items(location_id, minimum_stock, current_stock) 
  WHERE current_stock <= minimum_stock;

-- Step 5: Update the function that references old column names
CREATE OR REPLACE FUNCTION update_inventory_quantity(
    p_item_id UUID,
    p_quantity_change INTEGER,
    p_transaction_type VARCHAR,
    p_user_id UUID,
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Get current quantity with row lock
    SELECT current_stock INTO v_current_quantity
    FROM inventory_items
    WHERE id = p_item_id
    FOR UPDATE;
    
    IF v_current_quantity IS NULL THEN
        RAISE EXCEPTION 'Inventory item not found: %', p_item_id;
    END IF;
    
    v_new_quantity := v_current_quantity + p_quantity_change;
    
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient inventory. Current: %, Requested change: %', v_current_quantity, p_quantity_change;
    END IF;
    
    -- Update inventory quantity
    UPDATE inventory_items
    SET current_stock = v_new_quantity,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    -- Create transaction record
    INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        user_id,
        reference_id,
        notes
    ) VALUES (
        p_item_id,
        p_transaction_type,
        p_quantity_change,
        v_current_quantity,
        v_new_quantity,
        p_user_id,
        p_reference_id,
        p_notes
    );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add column to track last ordered date (expected by API)
ALTER TABLE inventory_items 
  ADD COLUMN IF NOT EXISTS last_ordered TIMESTAMPTZ;

-- Step 7: Rename vendor to supplier to match API expectations
ALTER TABLE inventory_items 
  RENAME COLUMN vendor TO supplier;

-- Step 8: Update vendor index to use new column name
DROP INDEX IF EXISTS idx_inventory_items_vendor;
CREATE INDEX idx_inventory_items_supplier ON inventory_items(supplier);

-- Step 9: Add location column (expected by API but missing in schema)
ALTER TABLE inventory_items 
  ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Create index for location
CREATE INDEX idx_inventory_items_location ON inventory_items(location) WHERE location IS NOT NULL;

-- Step 10: Update check constraints to use new column names
ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_quantity_non_negative,
  DROP CONSTRAINT IF EXISTS inventory_items_reorder_level_non_negative;

ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_current_stock_non_negative CHECK (current_stock >= 0),
  ADD CONSTRAINT inventory_items_minimum_stock_non_negative CHECK (minimum_stock >= 0);

-- Step 11: Add comment documenting the column mapping
COMMENT ON TABLE inventory_items IS 'Medical inventory items with stock tracking. Column names updated to match application code.';