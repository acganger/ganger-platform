#!/usr/bin/env python3
"""
Find critical database schema changes - focused version
"""

import re
import os
import json

# Focus on the most critical changes that will break the codebase
CRITICAL_CHANGES = {
    "table_changes": {
        "staff_tickets": "tickets",
        "staff_approvals": "REMOVED",
        "staff_file_uploads": "file_uploads", 
        "staff_job_queue": "REMOVED",
        "staff_login_attempts": "REMOVED -> audit_logs",
        "staff_notifications": "REMOVED",
        "staff_pending_hires": "REMOVED",
        "users": "profiles",  # Consolidated
    },
    
    "column_changes": {
        "audit_logs.timestamp": "audit_logs.created_at",
        "profiles.position": 'profiles."position"',  # Now quoted
        "tickets": {
            "removed": ["form_type", "location", "assigned_to_email", "action_taken_at", "completed_by", "payload", "request_type_virtual"],
            "changed": {
                "submitter_email": "user_id (UUID reference)",
                "assigned_to_email": "assigned_to (UUID reference)"
            }
        }
    },
    
    "status_mappings": {
        "tickets.status": {
            "Pending Approval": "open",
            "Open": "open", 
            "In Progress": "in-progress",
            "Stalled": "in-progress",
            "Approved": "resolved",
            "Denied": "closed",
            "Completed": "resolved"
        }
    }
}

def quick_scan(directory):
    """Do a quick scan for the most critical issues"""
    
    print("Critical Schema Change Analysis")
    print("=" * 50)
    
    critical_files = []
    issues = {
        "staff_tables": [],
        "column_refs": [],
        "status_refs": []
    }
    
    # First, find files that reference staff_ tables
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and build directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'mcp-servers']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Quick check for staff_ tables
                        if re.search(r'staff_[a-z_]+', content):
                            critical_files.append(filepath.replace(directory, ''))
                            
                            # Find specific references
                            for match in re.finditer(r'staff_\w+', content):
                                table = match.group()
                                if table in CRITICAL_CHANGES["table_changes"]:
                                    line_num = content[:match.start()].count('\n') + 1
                                    issues["staff_tables"].append({
                                        "file": filepath.replace(directory, ''),
                                        "line": line_num,
                                        "table": table,
                                        "new_name": CRITICAL_CHANGES["table_changes"][table]
                                    })
                        
                        # Check for removed columns in tickets
                        if 'tickets' in content or 'staff_tickets' in content:
                            for col in CRITICAL_CHANGES["column_changes"]["tickets"]["removed"]:
                                if col in content:
                                    issues["column_refs"].append({
                                        "file": filepath.replace(directory, ''),
                                        "column": col,
                                        "note": "Column removed from tickets table"
                                    })
                        
                        # Check for old status values
                        for old_status in CRITICAL_CHANGES["status_mappings"]["tickets.status"].keys():
                            if f"'{old_status}'" in content or f'"{old_status}"' in content:
                                issues["status_refs"].append({
                                    "file": filepath.replace(directory, ''),
                                    "old_status": old_status,
                                    "new_status": CRITICAL_CHANGES["status_mappings"]["tickets.status"][old_status]
                                })
                
                except Exception as e:
                    continue
    
    return critical_files, issues

# Run the scan
directory = "/q/Projects/ganger-platform"
critical_files, issues = quick_scan(directory)

print(f"\nFiles with staff_ table references: {len(critical_files)}")
print(f"Total staff_ table references: {len(issues['staff_tables'])}")
print(f"Removed column references: {len(issues['column_refs'])}")
print(f"Old status value references: {len(issues['status_refs'])}")

# Show sample of issues
print("\n" + "-" * 50)
print("SAMPLE OF CRITICAL ISSUES FOUND:")
print("-" * 50)

print("\n1. Staff Table References (showing first 10):")
for issue in issues["staff_tables"][:10]:
    print(f"   {issue['file']}:{issue['line']}")
    print(f"     {issue['table']} -> {issue['new_name']}")

print("\n2. Removed Column References (showing all):")
unique_cols = {}
for issue in issues["column_refs"]:
    key = f"{issue['file']} - {issue['column']}"
    if key not in unique_cols:
        unique_cols[key] = issue
        
for issue in list(unique_cols.values())[:10]:
    print(f"   {issue['file']}")
    print(f"     Column '{issue['column']}' {issue['note']}")

print("\n3. Old Status Values (showing first 5):")
unique_statuses = {}
for issue in issues["status_refs"]:
    key = f"{issue['file']} - {issue['old_status']}"
    if key not in unique_statuses:
        unique_statuses[key] = issue
        
for issue in list(unique_statuses.values())[:5]:
    print(f"   {issue['file']}")
    print(f"     '{issue['old_status']}' -> '{issue['new_status']}'")

# Save summary
summary = {
    "critical_files_count": len(critical_files),
    "issues_count": {
        "staff_tables": len(issues["staff_tables"]),
        "removed_columns": len(issues["column_refs"]),
        "old_statuses": len(issues["status_refs"])
    },
    "critical_files": critical_files[:20],  # First 20 files
    "sample_issues": {
        "staff_tables": issues["staff_tables"][:20],
        "column_refs": list(unique_cols.values())[:20],
        "status_refs": list(unique_statuses.values())[:20]
    }
}

with open('critical-schema-changes.json', 'w') as f:
    json.dump(summary, f, indent=2)

print(f"\n\nSummary saved to: critical-schema-changes.json")
print("\nNEXT STEPS:")
print("1. Update all staff_* table references to new names")
print("2. Handle removed columns (especially 'payload' -> 'form_data')")  
print("3. Update status values to new format")
print("4. Update email references to use UUID user_id instead")