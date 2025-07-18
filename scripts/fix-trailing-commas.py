#!/usr/bin/env python3

import re

def fix_trailing_commas(input_file, output_file):
    """Fix trailing commas in CREATE TABLE statements"""
    
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Fix trailing commas before closing parenthesis in CREATE TABLE
    # Pattern: comma followed by whitespace/comments and closing parenthesis
    pattern = r',\s*(?:--[^\n]*\n\s*)*\)'
    fixed_content = re.sub(pattern, '\n)', content)
    
    # Also fix cases where there's a comma at the end of the last column definition
    # Pattern: comma, optional whitespace, optional comment, newline, closing paren
    pattern2 = r',(\s*(?:--[^\n]*)?)\s*\n\s*\);'
    fixed_content = re.sub(pattern2, r'\1\n);', fixed_content)
    
    with open(output_file, 'w') as f:
        f.write(fixed_content)
    
    print(f"✅ Fixed trailing commas")
    print(f"📄 Input: {input_file}")
    print(f"📄 Output: {output_file}")

if __name__ == "__main__":
    fix_trailing_commas("/q/Projects/ganger-platform/complete-all-tables-fixed.sql", 
                       "/q/Projects/ganger-platform/complete-all-tables-final.sql")