-- Seed Data for AI Purchasing Agent
-- Based on actual purchase history analysis from Amazon and Henry Schein

-- Insert vendor configurations
INSERT INTO public.vendor_configurations (vendor_name, is_active, supports_real_time_pricing, supports_bulk_ordering, minimum_order_amount, free_shipping_threshold, average_delivery_days, notes)
VALUES 
  ('Henry Schein', true, false, true, 50.00, 100.00, 3, 'Primary medical supply vendor - 68% of spend'),
  ('Amazon Business', true, true, true, 0.00, 25.00, 2, 'Secondary vendor - 32% of spend, healthcare marketplace available'),
  ('McKesson', true, false, true, 100.00, 250.00, 5, 'Alternative vendor for comparison'),
  ('Cardinal Health', true, false, true, 150.00, 300.00, 5, 'Alternative vendor for comparison'),
  ('Medline', false, false, true, 75.00, 200.00, 4, 'Future vendor option');

-- Insert standardized products based on purchase history
-- Gloves (most frequently ordered)
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage, is_critical)
VALUES 
  ('Criterion Nitrile Exam Gloves - Medium', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 50, true),
  
  ('Criterion Nitrile Exam Gloves - Large', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 35, true),
  
  ('Criterion Nitrile Exam Gloves - Small', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 25, true),
  
  ('Criterion Nitrile Exam Gloves - X-Large', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 10, true);

-- Gauze and wound care
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage, is_critical)
VALUES 
  ('Gauze Sponges 4x4 inch', 'wound_care', '100% cotton gauze sponges, 12-ply, non-sterile', 
   '["4x4 inch size", "12-ply", "Non-sterile", "100% cotton", "Highly absorbent"]'::jsonb, 
   '1 case (10 packs)', 'case', 2000, 1, 30, true),
  
  ('Gauze Sponges 2x2 inch', 'wound_care', '100% cotton gauze sponges, 8-ply, non-sterile', 
   '["2x2 inch size", "8-ply", "Non-sterile", "100% cotton", "Highly absorbent"]'::jsonb, 
   '1 case (25 packs)', 'case', 5000, 1, 15, true),
  
  ('Telfa Non-Adherent Dressing 3x4 inch', 'wound_care', 'Non-adherent wound dressing, sterile', 
   '["3x4 inch size", "Non-adherent", "Sterile", "Individually wrapped"]'::jsonb, 
   '1 box (50 count)', 'box', 50, 1, 5, false);

-- Syringes and needles
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage, is_critical)
VALUES 
  ('Dialysis Syringe 1cc', 'syringes', '1cc syringe with no dead space, without needle', 
   '["1cc capacity", "No dead space", "Luer lock", "Sterile", "Latex-free"]'::jsonb, 
   '1 case (18 boxes)', 'case', 1800, 1, 8, true),
  
  ('Hypodermic Needle 30G x 1/2 inch', 'syringes', '30 gauge hypodermic needle, regular bevel', 
   '["30 gauge", "1/2 inch length", "Regular bevel", "Sterile", "Latex-free"]'::jsonb, 
   '1 box (100 count)', 'box', 100, 1, 20, true),
  
  ('Luer-Lok Syringe 3cc', 'syringes', '3cc syringe with Luer-Lok tip, graduated', 
   '["3cc capacity", "Luer-Lok tip", "1/10cc graduation", "Sterile", "Latex-free"]'::jsonb, 
   '1 box (100 count)', 'box', 100, 1, 10, true);

-- Paper products
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage)
VALUES 
  ('Exam Table Paper 18 inch', 'paper_products', 'Smooth white exam table paper, 225 feet per roll', 
   '["18 inch width", "225 feet per roll", "Smooth finish", "White color"]'::jsonb, 
   '1 case (12 rolls)', 'case', 12, 1, 4),
  
  ('Professional Towels 2-ply', 'paper_products', '2-ply tissue/poly professional towels', 
   '["13x18 inch size", "2-ply", "Tissue/poly blend", "White color"]'::jsonb, 
   '1 case (500 count)', 'case', 500, 1, 2);

-- Antiseptics and disinfectants
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage)
VALUES 
  ('CaviWipes Disinfectant Wipes', 'antiseptics', 'Surface disinfectant wipes, large canister', 
   '["6x6.75 inch size", "160 wipes per canister", "EPA registered", "Kills TB, HBV, HCV, viruses"]'::jsonb, 
   '1 case (12 canisters)', 'case', 1920, 1, 2),
  
  ('Alcohol Prep Pads Large', 'antiseptics', '70% isopropyl alcohol prep pads, sterile', 
   '["Large size", "70% isopropyl alcohol", "Sterile", "Individually wrapped"]'::jsonb, 
   '1 case (20 boxes)', 'case', 2000, 1, 1);

-- Now create vendor product mappings for Henry Schein (primary vendor)
WITH henry_schein AS (SELECT id FROM vendor_configurations WHERE vendor_name = 'Henry Schein' LIMIT 1),
     amazon AS (SELECT id FROM vendor_configurations WHERE vendor_name = 'Amazon Business' LIMIT 1)
INSERT INTO public.vendor_product_mappings 
  (standardized_product_id, vendor_id, vendor_sku, vendor_product_name, vendor_package_size, last_known_price, is_preferred, is_contract_item, lead_time_days)
SELECT 
  sp.id,
  hs.id,
  CASE sp.name
    WHEN 'Criterion Nitrile Exam Gloves - Medium' THEN 'C-N100-M'
    WHEN 'Criterion Nitrile Exam Gloves - Large' THEN 'C-N100-L'
    WHEN 'Criterion Nitrile Exam Gloves - Small' THEN 'C-N100-S'
    WHEN 'Criterion Nitrile Exam Gloves - X-Large' THEN 'C-N100-XL'
    WHEN 'Gauze Sponges 4x4 inch' THEN 'HS-GZ-4X4-NS'
    WHEN 'Gauze Sponges 2x2 inch' THEN 'HS-GZ-2X2-NS'
    WHEN 'Dialysis Syringe 1cc' THEN 'INJ-DS-1CC'
    WHEN 'Hypodermic Needle 30G x 1/2 inch' THEN 'ND-30G-05'
    WHEN 'Exam Table Paper 18 inch' THEN 'HSI-ETP-18'
    WHEN 'CaviWipes Disinfectant Wipes' THEN 'CAVI-LG-160'
    ELSE 'SKU-' || LEFT(MD5(sp.name), 8)
  END,
  sp.name || ' - Henry Schein Brand',
  sp.standard_package_size,
  CASE sp.name
    WHEN 'Criterion Nitrile Exam Gloves - Medium' THEN 54.01
    WHEN 'Criterion Nitrile Exam Gloves - Large' THEN 54.24
    WHEN 'Criterion Nitrile Exam Gloves - Small' THEN 53.73
    WHEN 'Criterion Nitrile Exam Gloves - X-Large' THEN 44.57
    WHEN 'Gauze Sponges 4x4 inch' THEN 53.17
    WHEN 'Gauze Sponges 2x2 inch' THEN 30.92
    WHEN 'Dialysis Syringe 1cc' THEN 82.80
    WHEN 'Hypodermic Needle 30G x 1/2 inch' THEN 7.05
    WHEN 'Exam Table Paper 18 inch' THEN 36.55
    WHEN 'CaviWipes Disinfectant Wipes' THEN 77.88
    ELSE ROUND((RANDOM() * 50 + 20)::numeric, 2)
  END,
  true,  -- is_preferred
  true,  -- is_contract_item
  3      -- lead_time_days
FROM standardized_products sp, henry_schein hs
WHERE sp.is_active = true;

-- Add Amazon Business mappings (usually slightly cheaper)
INSERT INTO public.vendor_product_mappings 
  (standardized_product_id, vendor_id, vendor_sku, vendor_product_name, vendor_package_size, last_known_price, is_preferred, is_contract_item, lead_time_days)
SELECT 
  sp.id,
  amz.id,
  'B0' || LEFT(MD5(sp.name), 8),
  sp.name || ' - Amazon Basics',
  sp.standard_package_size,
  ROUND((hsp.last_known_price * 0.92)::numeric, 2), -- Amazon typically 8% cheaper
  false, -- not preferred
  false, -- not contract item
  2      -- faster delivery
FROM standardized_products sp
JOIN vendor_product_mappings hsp ON hsp.standardized_product_id = sp.id
JOIN vendor_configurations hs ON hs.id = hsp.vendor_id AND hs.vendor_name = 'Henry Schein'
CROSS JOIN (SELECT id FROM vendor_configurations WHERE vendor_name = 'Amazon Business' LIMIT 1) amz
WHERE sp.is_active = true;

-- Create a sample consolidated order template for clinical staff
INSERT INTO public.consolidated_orders (order_number, requester_email, requester_name, department, status, notes)
VALUES 
  ('CO-TEMPLATE-001', 'nurse@gangerdermatology.com', 'Sample Nurse', 'Clinical', 'draft', 
   'This is a template order showing commonly requested items');

-- Add template items
WITH template_order AS (SELECT id FROM consolidated_orders WHERE order_number = 'CO-TEMPLATE-001' LIMIT 1)
INSERT INTO public.consolidated_order_items (consolidated_order_id, standardized_product_id, requested_quantity, justification)
SELECT 
  t.id,
  sp.id,
  CASE 
    WHEN sp.name LIKE '%Gloves%' THEN 5
    WHEN sp.name LIKE '%Gauze%' THEN 3
    WHEN sp.name LIKE '%Syringe%' THEN 2
    ELSE 1
  END,
  'Standard monthly replenishment'
FROM standardized_products sp
CROSS JOIN template_order t
WHERE sp.is_critical = true
LIMIT 10;

-- Insert sample procurement analytics
INSERT INTO public.procurement_analytics 
  (period_start, period_end, total_spend, total_savings, savings_percentage, total_orders, average_order_value, contract_compliance_rate, vendor_diversity_score)
VALUES 
  ('2024-01-01', '2024-12-31', 134982.00, 6750.00, 5.0, 156, 865.27, 60.0, 32.0),
  ('2024-12-01', '2024-12-31', 11248.50, 843.64, 7.5, 13, 865.27, 65.0, 35.0);

-- Update sequences and order numbers
SELECT setval(pg_get_serial_sequence('purchase_requests', 'id'), 1000);
SELECT setval(pg_get_serial_sequence('consolidated_orders', 'id'), 1000);