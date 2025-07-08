#!/usr/bin/env python3
import csv
import re
from collections import defaultdict

# Read the CSV file
orders = []
with open('orders_from_20240707_to_20250707_20250707_1040.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        orders.append(row)

# Categories of potentially excessive items
excessive_categories = {
    'luxury_electronics': {
        'keywords': ['sonos', 'bose', 'beats', 'airpods', 'premium', 'gaming', 'rgb', 'smart home', 'alexa', 'echo'],
        'items': [],
        'total': 0
    },
    'premium_coffee': {
        'keywords': ['starbucks', 'premium roast', 'specialty coffee', 'artisan'],
        'items': [],
        'total': 0
    },
    'expensive_furniture': {
        'keywords': ['executive', 'ergonomic', 'premium chair', 'luxury', 'designer'],
        'items': [],
        'total': 0
    },
    'decorative_non_essential': {
        'keywords': ['decorative', 'ornament', 'artwork', 'aesthetic', 'design', 'funny sign', 'garden sign', 'decoration'],
        'items': [],
        'total': 0
    },
    'premium_food_treats': {
        'keywords': ['gourmet', 'candy', 'chocolate', 'snacks', 'treats', 'cookies', 'gumball', 'grand bar'],
        'items': [],
        'total': 0
    },
    'excessive_lighting': {
        'keywords': ['landscape light', 'pathway light', 'decorative light', 'led strip', 'accent light'],
        'items': [],
        'total': 0
    },
    'questionable_medical': {
        'keywords': ['massage chair', 'personal massager', 'spa', 'relaxation'],
        'items': [],
        'total': 0
    },
    'premium_supplies': {
        'keywords': ['premium', 'luxury', 'high-end', 'professional grade'],
        'items': [],
        'total': 0
    },
    'entertainment': {
        'keywords': ['toy', 'game', 'puzzle', 'fun', 'party', 'gift'],
        'items': [],
        'total': 0
    }
}

# Individual high-cost items
high_cost_items = []
suspicious_items = []

# Process each order
for order in orders:
    title = order.get('Title', '')
    title_lower = title.lower()
    asin = order.get('ASIN', '')
    quantity = order.get('Item Quantity', '1')
    subtotal = order.get('Item Subtotal', '0')
    order_date = order.get('Order Date', '')
    category = order.get('Amazon-Internal Product Category', '')
    
    try:
        qty = int(quantity) if quantity else 1
        total_price = float(re.sub(r'[^\d.]', '', subtotal)) if subtotal else 0
        unit_price = total_price / qty if qty > 0 else 0
    except:
        continue
    
    if total_price > 0:
        # Check for excessive categories
        categorized = False
        for cat_name, cat_data in excessive_categories.items():
            if any(keyword in title_lower for keyword in cat_data['keywords']):
                cat_data['items'].append({
                    'title': title,
                    'total_price': total_price,
                    'unit_price': unit_price,
                    'quantity': qty,
                    'date': order_date,
                    'category': category
                })
                cat_data['total'] += total_price
                categorized = True
                break
        
        # Flag high-cost single items (over $100)
        if unit_price > 100:
            high_cost_items.append({
                'title': title,
                'total_price': total_price,
                'unit_price': unit_price,
                'quantity': qty,
                'date': order_date,
                'category': category
            })
        
        # Look for specific red flags
        red_flags = [
            'personal use', 'home use', 'residential', 'consumer', 'entertainment',
            'luxury', 'premium', 'gift', 'party', 'decoration', 'ornament',
            'candy', 'snack', 'treat', 'chocolate', 'cookie'
        ]
        
        if any(flag in title_lower for flag in red_flags):
            suspicious_items.append({
                'title': title,
                'total_price': total_price,
                'reason': 'Contains keywords suggesting non-business use',
                'date': order_date
            })

# Generate report
print("\n🚨 EXCESSIVE SPENDING ANALYSIS 🚨")
print("="*80)
print("Items that may be inappropriate for a cost-conscious medical practice:\n")

# Report on excessive categories
total_excessive = 0
for cat_name, cat_data in excessive_categories.items():
    if cat_data['total'] > 0:
        print(f"\n{cat_name.upper().replace('_', ' ')}: ${cat_data['total']:.2f}")
        print("-"*60)
        # Sort by price and show top items
        cat_data['items'].sort(key=lambda x: x['total_price'], reverse=True)
        for item in cat_data['items'][:5]:  # Top 5 per category
            print(f"  • {item['title'][:70]}...")
            print(f"    ${item['total_price']:.2f} (Qty: {item['quantity']}) - {item['date']}")
        if len(cat_data['items']) > 5:
            print(f"  ... and {len(cat_data['items']) - 5} more items")
        total_excessive += cat_data['total']

# High-cost items analysis
print(f"\n\n💸 HIGH-COST SINGLE ITEMS (>$100 per unit):")
print("-"*80)
high_cost_items.sort(key=lambda x: x['unit_price'], reverse=True)
for item in high_cost_items[:15]:
    print(f"${item['unit_price']:.2f} - {item['title'][:70]}...")
    print(f"         Category: {item['category']}, Date: {item['date']}")

# Specific problematic purchases
print(f"\n\n🚩 SPECIFICALLY QUESTIONABLE PURCHASES:")
print("-"*80)

# Look for non-medical/non-office categories
problematic_categories = {}
for order in orders:
    category = order.get('Amazon-Internal Product Category', '')
    title = order.get('Title', '')
    try:
        total_price = float(re.sub(r'[^\d.]', '', order.get('Item Subtotal', '0')))
    except:
        total_price = 0
    
    if total_price > 0:
        if category in ['Toy', 'Video Games', 'Music', 'DVD', 'Sports', 'Apparel', 'Shoes', 'Jewelry', 'Watch']:
            if category not in problematic_categories:
                problematic_categories[category] = {'total': 0, 'items': []}
            problematic_categories[category]['total'] += total_price
            problematic_categories[category]['items'].append({
                'title': title,
                'price': total_price
            })

for cat, data in sorted(problematic_categories.items(), key=lambda x: x[1]['total'], reverse=True):
    if data['total'] > 0:
        print(f"\n{cat}: ${data['total']:.2f}")
        for item in data['items'][:3]:
            print(f"  • {item['title'][:70]}... (${item['price']:.2f})")

# Summary recommendations
print(f"\n\n📊 COST-CUTTING RECOMMENDATIONS:")
print("="*80)
print(f"Total Potentially Excessive Spending: ${total_excessive:.2f}")
print(f"\nCategories to Review/Eliminate:")
print(f"1. Decorative/Aesthetic Items: Can be eliminated entirely")
print(f"2. Premium Coffee/Snacks: Switch to basic/bulk options")
print(f"3. Landscape Lighting: Non-essential for medical practice")
print(f"4. High-End Electronics: Use standard business-grade equipment")
print(f"5. Luxury Furniture: Standard office furniture is sufficient")

# Calculate potential savings
essential_replacements = {
    'Premium Coffee': {'current': 251.65, 'basic': 100, 'savings': 151.65},
    'Snacks/Candy': {'current': excessive_categories['premium_food_treats']['total'], 
                     'basic': 0, 'savings': excessive_categories['premium_food_treats']['total']},
    'Decorative Items': {'current': excessive_categories['decorative_non_essential']['total'], 
                         'basic': 0, 'savings': excessive_categories['decorative_non_essential']['total']},
    'Landscape Lighting': {'current': excessive_categories['excessive_lighting']['total'], 
                           'basic': 0, 'savings': excessive_categories['excessive_lighting']['total']}
}

print(f"\n💰 POTENTIAL ANNUAL SAVINGS BY CATEGORY:")
print("-"*60)
total_potential_savings = 0
for item, values in essential_replacements.items():
    if values['savings'] > 0:
        print(f"{item}: ${values['savings']:.2f}")
        total_potential_savings += values['savings']

print(f"\nTOTAL POTENTIAL SAVINGS: ${total_potential_savings:.2f}")
# Calculate total spending
total_spending = sum(float(re.sub(r'[^\d.]', '', o.get('Item Subtotal', '0')) or 0) for o in orders if o.get('Item Subtotal'))
savings_percentage = (total_potential_savings / total_spending * 100) if total_spending > 0 else 0
print(f"\nThis represents {savings_percentage:.1f}% of your total Amazon spending")

# Create detailed CSV of questionable items
with open('excessive_spending_audit.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Category', 'Title', 'Total Price', 'Quantity', 'Unit Price', 'Date', 'Recommendation'])
    
    for cat_name, cat_data in excessive_categories.items():
        for item in cat_data['items']:
            recommendation = 'Eliminate' if cat_name in ['decorative_non_essential', 'entertainment', 'excessive_lighting'] else 'Find cheaper alternative'
            writer.writerow([
                cat_name.replace('_', ' ').title(),
                item['title'][:100],
                f"${item['total_price']:.2f}",
                item['quantity'],
                f"${item['unit_price']:.2f}",
                item['date'],
                recommendation
            ])

print(f"\n📄 Detailed audit saved to: excessive_spending_audit.csv")