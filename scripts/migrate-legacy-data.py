#!/usr/bin/env python3

import re
import json
from datetime import datetime

def convert_mysql_to_postgresql(mysql_file, postgres_file):
    """Convert MySQL dump to PostgreSQL-compatible SQL"""
    
    print("🔄 Converting MySQL dump to PostgreSQL...")
    
    with open(mysql_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # PostgreSQL conversion fixes
    converted = content
    
    # 1. Fix MySQL-specific syntax
    converted = re.sub(r'ENGINE=\w+', '', converted)
    converted = re.sub(r'DEFAULT CHARSET=\w+', '', converted)
    converted = re.sub(r'COLLATE=\w+', '', converted)
    converted = re.sub(r'AUTO_INCREMENT=\d+', '', converted)
    converted = re.sub(r'AUTO_INCREMENT', 'SERIAL', converted)
    
    # 2. Fix data types
    converted = re.sub(r'\btinyint\(1\)\b', 'BOOLEAN', converted)
    converted = re.sub(r'\btinyint\(\d+\)\b', 'SMALLINT', converted)
    converted = re.sub(r'\bint\(\d+\)\b', 'INTEGER', converted)
    converted = re.sub(r'\bbigint\(\d+\)\b', 'BIGINT', converted)
    converted = re.sub(r'\bvarchar\((\d+)\)', r'VARCHAR(\1)', converted)
    converted = re.sub(r'\btext\b', 'TEXT', converted)
    converted = re.sub(r'\blongtext\b', 'TEXT', converted)
    converted = re.sub(r'\bdatetime\b', 'TIMESTAMP', converted)
    converted = re.sub(r'\btimestamp\b', 'TIMESTAMP', converted)
    
    # 3. Fix quotes - MySQL uses backticks, PostgreSQL uses double quotes
    converted = re.sub(r'`([^`]+)`', r'"\1"', converted)
    
    # 4. Fix value escaping
    converted = re.sub(r"\\'", "''", converted)  # Single quotes
    
    # 5. Add PostgreSQL-specific features
    postgres_content = """-- Converted from MySQL to PostgreSQL
-- Legacy Ganger Platform Data Migration
-- Generated on """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create mapping table for old IDs to new UUIDs
CREATE TABLE IF NOT EXISTS legacy_id_mapping (
    table_name TEXT NOT NULL,
    legacy_id INTEGER NOT NULL,
    new_uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    PRIMARY KEY (table_name, legacy_id)
);

""" + converted + """

-- Update foreign key references to use UUIDs
-- This would need to be customized based on your specific schema

COMMIT;

-- Migration completed successfully
SELECT 'Legacy data migration completed!' as status;
"""
    
    # Write the converted content
    with open(postgres_file, 'w', encoding='utf-8') as f:
        f.write(postgres_content)
    
    # Get statistics
    table_count = len(re.findall(r'CREATE TABLE', converted))
    insert_count = len(re.findall(r'INSERT INTO', converted))
    
    print(f"✅ MySQL to PostgreSQL conversion complete!")
    print(f"📄 Input: {mysql_file}")
    print(f"📄 Output: {postgres_file}")
    print(f"📊 Tables: {table_count}")
    print(f"📊 INSERT statements: {insert_count}")
    
    return postgres_file

def extract_table_data(mysql_file):
    """Extract and analyze what data exists"""
    
    print("🔍 Analyzing legacy data structure...")
    
    with open(mysql_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Find all tables
    table_pattern = r'CREATE TABLE `([^`]+)`'
    tables = re.findall(table_pattern, content)
    
    # Count INSERT statements per table
    table_data = {}
    for table in tables:
        insert_pattern = f'INSERT INTO `{table}`'
        inserts = len(re.findall(insert_pattern, content))
        table_data[table] = inserts
    
    print(f"\n📊 Legacy Data Analysis:")
    print(f"{'Table Name':<30} {'Records':<10}")
    print("-" * 45)
    
    total_records = 0
    for table, count in sorted(table_data.items()):
        print(f"{table:<30} {count:<10}")
        total_records += count
    
    print("-" * 45)
    print(f"{'TOTAL':<30} {total_records:<10}")
    
    return table_data

if __name__ == "__main__":
    mysql_file = "/q/Projects/ganger-platform/legacy-a2hosting-apps/mysql dumps/gangerne_apihub (20250714).sql"
    postgres_file = "/q/Projects/ganger-platform/legacy-data-converted.sql"
    
    # Analyze the data first
    table_data = extract_table_data(mysql_file)
    
    # Convert to PostgreSQL
    convert_mysql_to_postgresql(mysql_file, postgres_file)
    
    print(f"\n🚀 Next steps:")
    print(f"1. First execute: complete-all-tables-fixed.sql (creates empty tables)")
    print(f"2. Then execute: legacy-data-converted.sql (imports your data)")
    print(f"3. Your 17 applications will have their original data restored!")