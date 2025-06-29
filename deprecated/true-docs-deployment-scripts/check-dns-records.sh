#!/bin/bash

# Check Cloudflare DNS records for gangerdermatology.com

CLOUDFLARE_ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"

echo "📡 Checking DNS records at Cloudflare..."
echo "========================================"

# Get DNS records
response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?per_page=100" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

# Parse and display relevant records
echo "$response" | python3 -c "
import json
import sys

data = json.load(sys.stdin)
if not data.get('success'):
    print('❌ Failed to fetch DNS records')
    print(data.get('errors', []))
    sys.exit(1)

records = data.get('result', [])

# Filter for our subdomains
subdomains = ['staff', 'lunch', 'kiosk', 'handouts', 'l10']
relevant_records = []

print('\n🔍 Relevant DNS Records:')
print('-' * 80)
print('{:<30} {:<6} {:<40} {:<8}'.format('Name', 'Type', 'Content', 'Proxied'))
print('-' * 80)

for record in records:
    name = record.get('name', '')
    # Check if it's one of our subdomains or the root domain
    if any(name.startswith(sub + '.') for sub in subdomains) or name == 'gangerdermatology.com':
        record_type = record.get('type', '')
        content = record.get('content', '')
        proxied = '🟠 Yes' if record.get('proxied', False) else '⚪ No'
        
        # Truncate long content
        if len(content) > 40:
            content = content[:37] + '...'
            
        print(f'{name:<30} {record_type:<6} {content:<40} {proxied:<8}')
        relevant_records.append(record)

if not relevant_records:
    print('No DNS records found for the expected subdomains')
    
print()
print('📋 Summary:')
print(f'Total DNS records: {len(records)}')
print(f'Relevant subdomain records: {len(relevant_records)}')
print()
print('🎯 Required DNS Records:')
print('- staff.gangerdermatology.com → Staff Portal Vercel deployment')
print('- lunch.gangerdermatology.com → Pharma Scheduling app')
print('- kiosk.gangerdermatology.com → Check-in Kiosk app')
print('- handouts.gangerdermatology.com → Patient Handouts app')
"