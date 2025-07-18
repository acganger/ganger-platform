#!/usr/bin/env python3

import re

def fix_sql_syntax(input_file, output_file):
    """Fix common SQL syntax errors in migration files"""
    
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Fix INDEX statements inside CREATE TABLE
    # Pattern: INDEX name ON table(columns) -> CREATE INDEX name ON table(columns);
    fixed_content = content
    
    # Find all problematic INDEX lines
    index_pattern = r'^\s+INDEX\s+(\w+)\s+ON\s+(\w+)\([^)]+\),?\s*$'
    matches = re.findall(index_pattern, content, re.MULTILINE)
    
    print(f"Found {len(matches)} INDEX statements to fix")
    
    # Comment out INDEX statements inside CREATE TABLE
    fixed_content = re.sub(index_pattern, r'    -- INDEX \1 ON \2(...) - moved outside table', fixed_content, flags=re.MULTILINE)
    
    # Add proper CREATE INDEX statements after the table creation
    index_statements = []
    for match in matches:
        index_name, table_name = match
        # Extract the full index definition
        pattern = f'INDEX\\s+{index_name}\\s+ON\\s+{table_name}\\([^)]+\\)'
        full_match = re.search(pattern, content)
        if full_match:
            index_def = full_match.group(0)
            # Convert to proper CREATE INDEX
            create_index = f"CREATE INDEX IF NOT EXISTS {index_def};"
            index_statements.append(create_index)
    
    # Add the CREATE INDEX statements at the end before COMMIT
    if index_statements:
        index_section = "\n-- ============================================\n"
        index_section += "-- CREATE INDEX statements (fixed from table definitions)\n"
        index_section += "-- ============================================\n\n"
        index_section += "\n".join(index_statements) + "\n\n"
        
        # Insert before COMMIT
        fixed_content = fixed_content.replace("COMMIT;", index_section + "COMMIT;")
    
    # Write the fixed content
    with open(output_file, 'w') as f:
        f.write(fixed_content)
    
    print(f"✅ Fixed SQL syntax errors")
    print(f"📄 Input: {input_file}")
    print(f"📄 Output: {output_file}")
    print(f"🔧 Fixed {len(matches)} INDEX statements")

if __name__ == "__main__":
    fix_sql_syntax("/q/Projects/ganger-platform/complete-all-tables.sql", 
                   "/q/Projects/ganger-platform/complete-all-tables-fixed.sql")