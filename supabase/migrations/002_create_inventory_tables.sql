-- =====================================================
-- Ganger Platform Database Schema - Inventory Tables
-- Migration: 002_create_inventory_tables.sql
-- Created: June 5, 2025
-- =====================================================

-- =====================================================
-- INVENTORY ITEMS TABLE
-- =====================================================
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50),
    henry_schein_id VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_items_unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT inventory_items_quantity_non_negative CHECK (quantity_on_hand >= 0),
    CONSTRAINT inventory_items_reorder_level_non_negative CHECK (reorder_level >= 0)
);

-- =====================================================
-- INVENTORY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('scan', 'manual_count', 'order', 'adjustment', 'receive', 'waste', 'transfer')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reference_id UUID, -- Can reference orders, transfers, etc.
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_transactions_quantity_valid CHECK (new_quantity >= 0)
);

-- =====================================================
-- PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'ordered', 'partially_received', 'received', 'cancelled')),
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    shipping_amount DECIMAL(12,2) DEFAULT 0.00,
    ordered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ordered_at TIMESTAMPTZ,
    expected_delivery DATE,
    actual_delivery DATE,
    vendor_order_number VARCHAR(100),
    tracking_number VARCHAR(100),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT purchase_orders_total_amount_non_negative CHECK (total_amount >= 0),
    CONSTRAINT purchase_orders_tax_amount_non_negative CHECK (tax_amount >= 0),
    CONSTRAINT purchase_orders_shipping_amount_non_negative CHECK (shipping_amount >= 0)
);

-- =====================================================
-- PURCHASE ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    quantity_received INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT purchase_order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT purchase_order_items_unit_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT purchase_order_items_quantity_received_valid CHECK (quantity_received >= 0 AND quantity_received <= quantity)
);

-- =====================================================
-- INVENTORY COUNTS TABLE (for periodic counting)
-- =====================================================
CREATE TABLE inventory_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    count_type VARCHAR(20) NOT NULL CHECK (count_type IN ('full', 'cycle', 'spot')),
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    started_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVENTORY COUNT ITEMS TABLE
-- =====================================================
CREATE TABLE inventory_count_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    system_quantity INTEGER NOT NULL,
    counted_quantity INTEGER,
    variance INTEGER GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    counted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    counted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_count_items_system_quantity_non_negative CHECK (system_quantity >= 0),
    CONSTRAINT inventory_count_items_counted_quantity_non_negative CHECK (counted_quantity IS NULL OR counted_quantity >= 0),
    UNIQUE(count_id, item_id)
);

-- =====================================================
-- VENDOR CATALOG TABLE (for external product data)
-- =====================================================
CREATE TABLE vendor_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor VARCHAR(100) NOT NULL,
    vendor_product_id VARCHAR(100) NOT NULL,
    sku VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit_price DECIMAL(10,2),
    unit_of_measure VARCHAR(20),
    manufacturer VARCHAR(100),
    manufacturer_part_number VARCHAR(100),
    barcode VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vendor_catalog_unit_price_non_negative CHECK (unit_price IS NULL OR unit_price >= 0),
    UNIQUE(vendor, vendor_product_id)
);

-- =====================================================
-- INVENTORY ITEM MAPPINGS (link internal items to vendor catalog)
-- =====================================================
CREATE TABLE inventory_vendor_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    vendor_catalog_id UUID REFERENCES vendor_catalog(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    price_multiplier DECIMAL(5,4) DEFAULT 1.0000,
    minimum_order_quantity INTEGER DEFAULT 1,
    lead_time_days INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_vendor_mappings_price_multiplier_positive CHECK (price_multiplier > 0),
    CONSTRAINT inventory_vendor_mappings_min_order_quantity_positive CHECK (minimum_order_quantity > 0),
    CONSTRAINT inventory_vendor_mappings_lead_time_non_negative CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
    UNIQUE(inventory_item_id, vendor_catalog_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Inventory items indexes
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_barcode ON inventory_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_inventory_items_henry_schein_id ON inventory_items(henry_schein_id) WHERE henry_schein_id IS NOT NULL;
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_vendor ON inventory_items(vendor);
CREATE INDEX idx_inventory_items_location_id ON inventory_items(location_id);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(location_id, reorder_level, quantity_on_hand) WHERE quantity_on_hand <= reorder_level;

-- Inventory transactions indexes
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX idx_inventory_transactions_reference_id ON inventory_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_order_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor);
CREATE INDEX idx_purchase_orders_location_id ON purchase_orders(location_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_ordered_by ON purchase_orders(ordered_by);
CREATE INDEX idx_purchase_orders_ordered_at ON purchase_orders(ordered_at);
CREATE INDEX idx_purchase_orders_expected_delivery ON purchase_orders(expected_delivery);

-- Purchase order items indexes
CREATE INDEX idx_purchase_order_items_order_id ON purchase_order_items(order_id);
CREATE INDEX idx_purchase_order_items_item_id ON purchase_order_items(item_id);

-- Inventory counts indexes
CREATE INDEX idx_inventory_counts_location_id ON inventory_counts(location_id);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);
CREATE INDEX idx_inventory_counts_started_at ON inventory_counts(started_at);

-- Inventory count items indexes
CREATE INDEX idx_inventory_count_items_count_id ON inventory_count_items(count_id);
CREATE INDEX idx_inventory_count_items_item_id ON inventory_count_items(item_id);
CREATE INDEX idx_inventory_count_items_variance ON inventory_count_items(variance) WHERE variance != 0;

-- Vendor catalog indexes
CREATE INDEX idx_vendor_catalog_vendor ON vendor_catalog(vendor);
CREATE INDEX idx_vendor_catalog_vendor_product_id ON vendor_catalog(vendor_product_id);
CREATE INDEX idx_vendor_catalog_sku ON vendor_catalog(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_vendor_catalog_barcode ON vendor_catalog(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_vendor_catalog_category ON vendor_catalog(category);
CREATE INDEX idx_vendor_catalog_is_available ON vendor_catalog(is_available);

-- Inventory vendor mappings indexes
CREATE INDEX idx_inventory_vendor_mappings_inventory_item_id ON inventory_vendor_mappings(inventory_item_id);
CREATE INDEX idx_inventory_vendor_mappings_vendor_catalog_id ON inventory_vendor_mappings(vendor_catalog_id);
CREATE INDEX idx_inventory_vendor_mappings_is_primary ON inventory_vendor_mappings(is_primary) WHERE is_primary = true;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_counts_updated_at BEFORE UPDATE ON inventory_counts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_count_items_updated_at BEFORE UPDATE ON inventory_count_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_catalog_updated_at BEFORE UPDATE ON vendor_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_vendor_mappings_updated_at BEFORE UPDATE ON inventory_vendor_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR INVENTORY MANAGEMENT
-- =====================================================

-- Function to update inventory quantity and create transaction
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
    SELECT quantity_on_hand INTO v_current_quantity
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
    SET quantity_on_hand = v_new_quantity,
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

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO v_total
    FROM purchase_order_items
    WHERE order_id = p_order_id;
    
    UPDATE purchase_orders
    SET total_amount = v_total,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update order totals
CREATE OR REPLACE FUNCTION trigger_calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_order_total(OLD.order_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_order_total(NEW.order_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total_on_items
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_order_total();