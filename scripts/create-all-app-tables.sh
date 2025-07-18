#!/bin/bash

# Create All Application Tables Script
# This recreates the complete database schema for all 17 Ganger Platform applications

echo "🚀 Creating Complete Database Schema for All 17 Applications"
echo "==========================================================="
echo ""
echo "📋 Applications that need database tables:"
echo "  1. Ganger Actions (employee hub)"
echo "  2. Inventory Management" 
echo "  3. Patient Handouts"
echo "  4. EOS L10 (team management)"
echo "  5. Clinical Staffing"
echo "  6. Call Center Operations"
echo "  7. Compliance Training"
echo "  8. Batch Closeout"
echo "  9. Socials & Reviews"
echo " 10. Platform Dashboard"
echo " 11. Config Dashboard"
echo " 12. Integration Status"
echo " 13. Component Showcase"
echo " 14. AI Receptionist"
echo " 15. Medication Authorization"
echo " 16. Pharma Scheduling"
echo " 17. Check-in Kiosk"
echo ""

# Create output file
OUTPUT_FILE="scripts/complete-database-schema.sql"
echo "-- Complete Ganger Platform Database Schema" > "$OUTPUT_FILE"
echo "-- Generated on $(date)" >> "$OUTPUT_FILE"
echo "-- Includes tables for all 17 applications" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "BEGIN;" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Process all migration files in order
for migration_file in supabase/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo "📄 Adding $filename..."
        
        echo "-- =============================================" >> "$OUTPUT_FILE"
        echo "-- Migration: $filename" >> "$OUTPUT_FILE"
        echo "-- =============================================" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        cat "$migration_file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

echo "COMMIT;" >> "$OUTPUT_FILE"

# Get file info
line_count=$(wc -l < "$OUTPUT_FILE")
file_size=$(du -h "$OUTPUT_FILE" | cut -f1)

echo ""
echo "✅ Complete database schema created!"
echo "📄 File: $OUTPUT_FILE"
echo "📊 Lines: $line_count"
echo "📦 Size: $file_size"
echo ""
echo "🔧 Execute this in Supabase SQL Editor:"
echo "   1. Go to: https://supabase.com/dashboard"
echo "   2. Open your project (supa.gangerdermatology.com)"
echo "   3. Click 'SQL Editor' in sidebar"
echo "   4. Copy contents of: $OUTPUT_FILE"
echo "   5. Paste and click 'Run'"
echo ""
echo "⚠️  Note: This is a large file ($line_count lines)."
echo "   You may need to execute it in smaller chunks if it times out."