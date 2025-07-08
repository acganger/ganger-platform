#!/usr/bin/env python3
import csv
import re
from collections import defaultdict

# Read the Henry Schein data again to look at specific items
henry_schein_orders = []
with open('1eb6921b-e392-457b-8a1f-a08236e20da9.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        henry_schein_orders.append(row)

# Focus on the specific items mentioned
criterion_gloves = []
gauze_sponges = []

for order in henry_schein_orders:
    description = order.get('Extended Description', '').lower()
    amount = float(re.sub(r'[^\d.-]', '', order.get('Amount', '0'))) if order.get('Amount') else 0
    qty = int(re.sub(r'[^\d]', '', order.get('Qty', '1'))) if order.get('Qty') else 1
    uom = order.get('Uom', '')
    date = order.get('LastPurchasedDate', '')
    
    if amount > 0:
        if 'criterion' in description and 'nitrile' in description and 'glove' in description:
            criterion_gloves.append({
                'description': order.get('Extended Description', ''),
                'amount': amount,
                'qty': qty,
                'uom': uom,
                'unit_price': amount / qty if qty > 0 else amount,
                'date': date,
                'price_per_glove': None  # Will calculate based on package size
            })
        
        if ('gauze' in description and 'sponge' in description) or ('cotton' in description and 'gauze' in description):
            gauze_sponges.append({
                'description': order.get('Extended Description', ''),
                'amount': amount,
                'qty': qty,
                'uom': uom,
                'unit_price': amount / qty if qty > 0 else amount,
                'date': date
            })

print("🧤 CRITERION NITRILE GLOVES - DETAILED ANALYSIS")
print("="*80)
print(f"Total Criterion Glove Purchases: {len(criterion_gloves)}")

for i, item in enumerate(criterion_gloves, 1):
    print(f"\n{i}. {item['description']}")
    print(f"   Date: {item['date']}")
    print(f"   Quantity: {item['qty']} {item['uom']}")
    print(f"   Total: ${item['amount']:.2f}")
    print(f"   Price per {item['uom']}: ${item['unit_price']:.2f}")
    
    # Try to extract glove count from description
    desc = item['description'].lower()
    if 'box' in desc or 'bx' in desc:
        # Look for numbers that might indicate gloves per box
        numbers = re.findall(r'\b(\d+)\b', desc)
        if numbers:
            # Common glove box sizes: 100, 200, 250
            likely_count = None
            for num in numbers:
                if int(num) in [100, 200, 250, 300]:
                    likely_count = int(num)
                    break
            if likely_count:
                price_per_glove = item['unit_price'] / likely_count
                print(f"   Estimated gloves per box: {likely_count}")
                print(f"   Price per glove: ${price_per_glove:.4f}")
                item['price_per_glove'] = price_per_glove

print("\n🩹 GAUZE SPONGES - DETAILED ANALYSIS")
print("="*80)
print(f"Total Gauze Sponge Purchases: {len(gauze_sponges)}")

for i, item in enumerate(gauze_sponges, 1):
    print(f"\n{i}. {item['description']}")
    print(f"   Date: {item['date']}")
    print(f"   Quantity: {item['qty']} {item['uom']}")
    print(f"   Total: ${item['amount']:.2f}")
    print(f"   Price per {item['uom']}: ${item['unit_price']:.2f}")
    
    # Try to extract sponge count from description
    desc = item['description'].lower()
    # Look for package sizes like 200/pk, 100/bx, etc.
    package_match = re.search(r'(\d+)/(?:pk|bx|box|pack)', desc)
    if package_match:
        sponges_per_pack = int(package_match.group(1))
        price_per_sponge = item['unit_price'] / sponges_per_pack
        print(f"   Sponges per package: {sponges_per_pack}")
        print(f"   Price per sponge: ${price_per_sponge:.4f}")

# Summary analysis
print("\n📊 PRICE VARIANCE ANALYSIS")
print("="*80)

if criterion_gloves:
    unit_prices = [item['unit_price'] for item in criterion_gloves]
    glove_prices = [item['price_per_glove'] for item in criterion_gloves if item['price_per_glove']]
    
    print(f"\nCriterion Gloves:")
    print(f"Price per package range: ${min(unit_prices):.2f} - ${max(unit_prices):.2f}")
    if glove_prices:
        print(f"Price per individual glove range: ${min(glove_prices):.4f} - ${max(glove_prices):.4f}")
        if max(glove_prices) > min(glove_prices):
            variance_pct = ((max(glove_prices) - min(glove_prices)) / min(glove_prices)) * 100
            print(f"Per-glove price variance: {variance_pct:.1f}%")

if gauze_sponges:
    unit_prices = [item['unit_price'] for item in gauze_sponges]
    print(f"\nGauze Sponges:")
    print(f"Price per package range: ${min(unit_prices):.2f} - ${max(unit_prices):.2f}")
    variance_pct = ((max(unit_prices) - min(unit_prices)) / min(unit_prices)) * 100
    print(f"Package price variance: {variance_pct:.1f}%")

print("\n💡 UNIT ANALYSIS CONCLUSIONS:")
print("="*80)
print("1. Need to verify if price differences are due to:")
print("   - Different package sizes (100ct vs 200ct boxes)")
print("   - Different product specifications (powder-free vs powdered)")
print("   - Bulk discount tiers")
print("   - Promotional pricing vs regular pricing")
print("   - Different item codes for same product")
print("\n2. True savings opportunities exist only if:")
print("   - Same exact product specifications")
print("   - Same package sizes")
print("   - Consistent quality/brand")
print("\n3. Recommended next steps:")
print("   - Get Henry Schein to standardize item codes")
print("   - Negotiate volume pricing contracts")
print("   - Compare per-unit costs across all purchases")

# Create detailed CSV for manual review
with open('unit_pricing_analysis.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Item Type', 'Description', 'Date', 'Qty', 'UOM', 'Total Price', 'Price per UOM', 'Estimated Per-Unit Price'])
    
    for item in criterion_gloves:
        per_glove = item['price_per_glove'] if item['price_per_glove'] else 'Unknown'
        writer.writerow([
            'Criterion Gloves',
            item['description'][:100],
            item['date'],
            item['qty'],
            item['uom'],
            f"${item['amount']:.2f}",
            f"${item['unit_price']:.2f}",
            f"${per_glove:.4f}" if isinstance(per_glove, float) else per_glove
        ])
    
    for item in gauze_sponges:
        writer.writerow([
            'Gauze Sponges',
            item['description'][:100],
            item['date'],
            item['qty'],
            item['uom'],
            f"${item['amount']:.2f}",
            f"${item['unit_price']:.2f}",
            'Need to calculate'
        ])

print(f"\n📄 Detailed unit analysis saved to: unit_pricing_analysis.csv")