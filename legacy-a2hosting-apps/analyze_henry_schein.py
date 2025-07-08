#!/usr/bin/env python3
import csv
import re
from collections import defaultdict
from datetime import datetime

# Read the Henry Schein CSV file
henry_schein_orders = []
with open('1eb6921b-e392-457b-8a1f-a08236e20da9.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    print("Henry Schein CSV Headers:", headers[:10])  # Show first 10 headers
    
    for row in reader:
        henry_schein_orders.append(row)

print(f"Total Henry Schein orders: {len(henry_schein_orders)}")

# Try to identify key columns
sample_row = henry_schein_orders[0] if henry_schein_orders else {}
print("\nSample row keys:")
for key in list(sample_row.keys())[:15]:
    print(f"  {key}: {sample_row[key]}")

# Analyze Henry Schein spending
total_hs_spending = 0
hs_categories = defaultdict(lambda: {'total': 0, 'items': []})
hs_items = []

# Try different possible column names for price/amount
price_columns = ['Total', 'Amount', 'Price', 'Extended Price', 'Line Total', 'Total Amount', 'Net Amount']
desc_columns = ['Description', 'Product Description', 'Item Description', 'Product Name', 'Item']
qty_columns = ['Quantity', 'Qty', 'Units', 'Count']
date_columns = ['Date', 'Order Date', 'Ship Date', 'Invoice Date']

# Find the correct column names
price_col = None
desc_col = None
qty_col = None
date_col = None

for col in sample_row.keys():
    col_lower = col.lower()
    if not price_col and any(pc.lower() in col_lower for pc in price_columns):
        price_col = col
    if not desc_col and any(dc.lower() in col_lower for dc in desc_columns):
        desc_col = col
    if not qty_col and any(qc.lower() in col_lower for qc in qty_columns):
        qty_col = col
    if not date_col and any(dc.lower() in col_lower for dc in date_columns):
        date_col = col

print(f"\nDetected columns:")
print(f"Price: {price_col}")
print(f"Description: {desc_col}")
print(f"Quantity: {qty_col}")
print(f"Date: {date_col}")

# Process Henry Schein orders
for order in henry_schein_orders:
    try:
        # Extract price
        price_str = order.get(price_col, '0') if price_col else '0'
        price = float(re.sub(r'[^\d.-]', '', str(price_str))) if price_str else 0
        
        # Extract description
        description = order.get(desc_col, 'Unknown Item') if desc_col else 'Unknown Item'
        
        # Extract quantity
        qty_str = order.get(qty_col, '1') if qty_col else '1'
        qty = int(re.sub(r'[^\d]', '', str(qty_str))) if qty_str and str(qty_str).strip() else 1
        
        # Extract date
        order_date = order.get(date_col, '') if date_col else ''
        
        if price > 0:
            hs_items.append({
                'description': description,
                'price': price,
                'quantity': qty,
                'unit_price': price / qty if qty > 0 else price,
                'date': order_date
            })
            total_hs_spending += price
            
            # Categorize items
            desc_lower = description.lower()
            if any(word in desc_lower for word in ['glove', 'exam', 'nitrile', 'latex']):
                category = 'Gloves/PPE'
            elif any(word in desc_lower for word in ['syringe', 'needle', 'injection']):
                category = 'Syringes/Needles'
            elif any(word in desc_lower for word in ['bandage', 'gauze', 'tape', 'wound']):
                category = 'Wound Care'
            elif any(word in desc_lower for word in ['mask', 'face', 'surgical']):
                category = 'Masks/Face Protection'
            elif any(word in desc_lower for word in ['antiseptic', 'alcohol', 'sanitizer', 'disinfect']):
                category = 'Antiseptics/Sanitizers'
            elif any(word in desc_lower for word in ['paper', 'towel', 'tissue']):
                category = 'Paper Products'
            elif any(word in desc_lower for word in ['drug', 'medication', 'pharmaceutical']):
                category = 'Pharmaceuticals'
            else:
                category = 'Other Medical Supplies'
            
            hs_categories[category]['total'] += price
            hs_categories[category]['items'].append(hs_items[-1])
    
    except Exception as e:
        continue

# Sort items by price
hs_items.sort(key=lambda x: x['price'], reverse=True)

print(f"\n💊 HENRY SCHEIN SPENDING ANALYSIS")
print(f"="*60)
print(f"Total Henry Schein Spending: ${total_hs_spending:.2f}")
print(f"Total Orders: {len(hs_items)}")
print(f"Average Order: ${total_hs_spending/len(hs_items):.2f}" if hs_items else "No orders")

print(f"\n📊 SPENDING BY CATEGORY:")
print(f"-"*60)
for category, data in sorted(hs_categories.items(), key=lambda x: x[1]['total'], reverse=True):
    percentage = (data['total'] / total_hs_spending * 100) if total_hs_spending > 0 else 0
    print(f"{category}: ${data['total']:.2f} ({percentage:.1f}%) - {len(data['items'])} items")

print(f"\n🏆 TOP 15 HENRY SCHEIN PURCHASES:")
print(f"-"*60)
for i, item in enumerate(hs_items[:15], 1):
    print(f"{i}. {item['description'][:70]}...")
    print(f"   ${item['price']:.2f} (Qty: {item['quantity']}, Unit: ${item['unit_price']:.2f})")

# Find frequently ordered items
item_frequency = defaultdict(lambda: {'count': 0, 'total_spent': 0, 'prices': []})
for item in hs_items:
    # Normalize description for grouping
    normalized = re.sub(r'\b\d+\s*(count|ct|pack|box|case|each|ea)\b', '', item['description'].lower())
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    if len(normalized) > 10:  # Only group meaningful descriptions
        item_frequency[normalized]['count'] += item['quantity']
        item_frequency[normalized]['total_spent'] += item['price']
        item_frequency[normalized]['prices'].append(item['unit_price'])

frequent_items = {k: v for k, v in item_frequency.items() if len(v['prices']) > 2}

print(f"\n📈 FREQUENTLY ORDERED ITEMS (3+ orders):")
print(f"-"*60)
for item, data in sorted(frequent_items.items(), key=lambda x: x[1]['total_spent'], reverse=True)[:10]:
    avg_price = sum(data['prices']) / len(data['prices'])
    min_price = min(data['prices'])
    max_price = max(data['prices'])
    price_variance = max_price - min_price
    
    print(f"{item[:60]}...")
    print(f"  Orders: {len(data['prices'])}, Total: ${data['total_spent']:.2f}")
    print(f"  Price range: ${min_price:.2f} - ${max_price:.2f} (variance: ${price_variance:.2f})")

# Compare with Amazon data
print(f"\n🔄 AMAZON vs HENRY SCHEIN COMPARISON:")
print(f"="*60)
print(f"Amazon Annual Spend: ~$44,000")
print(f"Henry Schein Annual Spend: ${total_hs_spending:.2f}")
print(f"Total Medical Spend: ${44000 + total_hs_spending:.2f}")

# Look for potential overlaps
amazon_medical_keywords = [
    'medical', 'clinical', 'exam', 'glove', 'mask', 'sanitizer', 
    'bandage', 'gauze', 'syringe', 'needle', 'antiseptic'
]

print(f"\n💡 OPTIMIZATION OPPORTUNITIES:")
print(f"-"*60)
print(f"1. Total medical supply spending across both platforms")
print(f"2. Items with high price variance could benefit from Provista GPO pricing")
print(f"3. Consider consolidating frequent items to one platform for better pricing")

# Save detailed analysis
with open('henry_schein_analysis.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Description', 'Price', 'Quantity', 'Unit Price', 'Date', 'Category'])
    
    for item in hs_items:
        # Determine category
        desc_lower = item['description'].lower()
        if any(word in desc_lower for word in ['glove', 'exam', 'nitrile']):
            cat = 'Gloves/PPE'
        elif any(word in desc_lower for word in ['syringe', 'needle']):
            cat = 'Syringes/Needles'
        elif any(word in desc_lower for word in ['bandage', 'gauze', 'tape']):
            cat = 'Wound Care'
        elif any(word in desc_lower for word in ['mask', 'face']):
            cat = 'Masks'
        else:
            cat = 'Other Medical'
            
        writer.writerow([
            item['description'][:100],
            f"${item['price']:.2f}",
            item['quantity'],
            f"${item['unit_price']:.2f}",
            item['date'],
            cat
        ])

print(f"\n📄 Detailed analysis saved to: henry_schein_analysis.csv")
print(f"\n🎯 NEXT STEPS:")
print(f"1. Compare your most frequent Henry Schein items with Amazon Business pricing")
print(f"2. Look for items you're buying on both platforms")
print(f"3. Consider Provista GPO for items with high price variance")
print(f"4. Evaluate if consolidating to one platform provides volume discounts")