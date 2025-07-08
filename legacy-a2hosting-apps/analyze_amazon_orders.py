#!/usr/bin/env python3
import csv
import re
from collections import defaultdict
from datetime import datetime

# Read the CSV file
orders = []
with open('orders_from_20240707_to_20250707_20250707_1040.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        orders.append(row)

print(f"Total orders: {len(orders)}")

# Analyze items
item_analysis = defaultdict(lambda: {
    'count': 0,
    'total_cost': 0,
    'unit_prices': [],
    'quantities': [],
    'dates': [],
    'full_titles': []
})

# Process each order
for order in orders:
    title = order.get('Title', '')
    quantity = order.get('Quantity', '1')
    unit_price = order.get('Unit Price', '0')
    unit_price_tax = order.get('Unit Price Tax', '0')
    order_date = order.get('Order Date', '')
    
    # Clean and parse values
    try:
        qty = int(quantity) if quantity else 1
    except:
        qty = 1
    
    try:
        # Remove currency symbols and convert to float
        price = float(re.sub(r'[^\d.]', '', unit_price)) if unit_price else 0
        tax = float(re.sub(r'[^\d.]', '', unit_price_tax)) if unit_price_tax else 0
        total_unit_price = price + tax
    except:
        total_unit_price = 0
    
    if title and total_unit_price > 0:
        # Create a normalized key for similar items
        # Remove size/count variations for grouping
        normalized_title = title.lower()
        
        # Try to extract the main product name
        # Remove common size/quantity patterns
        normalized_title = re.sub(r'\b\d+\s*(count|pack|ct|oz|ounce|lb|pound|inch|in|ft|feet|meter|m|cm|mm|gallon|gal|liter|l|ml|piece|pcs|pc|sheet|roll|box|case|dozen|pair|set|kit|bundle)\b', '', normalized_title, flags=re.IGNORECASE)
        normalized_title = re.sub(r'\([^)]*\)', '', normalized_title)  # Remove parenthetical info
        normalized_title = re.sub(r'\s+', ' ', normalized_title).strip()
        
        # Skip if title becomes too short after normalization
        if len(normalized_title) > 10:
            item_analysis[normalized_title]['count'] += qty
            item_analysis[normalized_title]['total_cost'] += total_unit_price * qty
            item_analysis[normalized_title]['unit_prices'].append(total_unit_price)
            item_analysis[normalized_title]['quantities'].append(qty)
            item_analysis[normalized_title]['dates'].append(order_date)
            item_analysis[normalized_title]['full_titles'].append(title)

# Filter items ordered more than twice
recurring_items = {
    k: v for k, v in item_analysis.items() 
    if len(v['dates']) > 2 or v['count'] > 2
}

# Calculate savings potential
savings_opportunities = []
for item, data in recurring_items.items():
    avg_price = sum(data['unit_prices']) / len(data['unit_prices'])
    min_price = min(data['unit_prices'])
    max_price = max(data['unit_prices'])
    
    # Potential savings if bought at minimum price
    potential_savings = data['total_cost'] - (data['count'] * min_price)
    
    # Annual projection (assuming similar usage)
    annual_cost = data['total_cost']
    
    savings_opportunities.append({
        'item': item,
        'full_titles': list(set(data['full_titles']))[:3],  # Show up to 3 variations
        'times_ordered': len(data['dates']),
        'total_quantity': data['count'],
        'total_spent': data['total_cost'],
        'avg_price': avg_price,
        'min_price': min_price,
        'max_price': max_price,
        'price_variance': max_price - min_price,
        'potential_savings': potential_savings,
        'savings_percent': (potential_savings / data['total_cost'] * 100) if data['total_cost'] > 0 else 0
    })

# Sort by total spent (highest first)
savings_opportunities.sort(key=lambda x: x['total_spent'], reverse=True)

# Generate markdown report
markdown_report = """# Amazon Order Analysis - Prime Day Savings Opportunities

**Analysis Period**: July 7, 2024 - July 7, 2025  
**Total Orders Analyzed**: {}  
**Items Ordered 3+ Times**: {}  

## Top Savings Opportunities

Below are items ordered multiple times with the highest potential for savings:

### High-Value Recurring Purchases (Sorted by Total Spent)

""".format(len(orders), len(savings_opportunities))

# Add top 20 items to report
for i, item in enumerate(savings_opportunities[:20], 1):
    markdown_report += f"""
#### {i}. {item['item'].title()}
- **Example Products**: 
{chr(10).join(f'  - {title}' for title in item['full_titles'][:2])}
- **Purchase Frequency**: {item['times_ordered']} orders, {item['total_quantity']} units total
- **Total Spent**: ${item['total_spent']:.2f}
- **Price Range**: ${item['min_price']:.2f} - ${item['max_price']:.2f} (variance: ${item['price_variance']:.2f})
- **Average Price**: ${item['avg_price']:.2f}
- **Potential Savings**: ${item['potential_savings']:.2f} ({item['savings_percent']:.1f}% if bought at lowest price)
- **🎯 Prime Day Target**: Look for deals below ${item['min_price']:.2f}
"""

# Add summary section
markdown_report += """
## Summary Recommendations

### Top Categories to Watch on Prime Day:
"""

# Group by general categories
categories = defaultdict(lambda: {'items': [], 'total_spent': 0})
category_keywords = {
    'Office Supplies': ['paper', 'pen', 'pencil', 'marker', 'tape', 'staple', 'folder', 'binder', 'clipboard', 'label'],
    'Cleaning Supplies': ['clean', 'wipe', 'sanitiz', 'disinfect', 'soap', 'detergent', 'tissue', 'towel'],
    'Medical/PPE': ['mask', 'glove', 'medical', 'surgical', 'bandage', 'gauze', 'alcohol', 'thermometer'],
    'Electronics': ['battery', 'cable', 'charger', 'adapter', 'electronic', 'computer', 'phone'],
    'Kitchen/Break Room': ['coffee', 'tea', 'cup', 'plate', 'utensil', 'snack', 'water', 'beverage'],
    'Storage/Organization': ['box', 'container', 'storage', 'organizer', 'shelf', 'bag', 'zip']
}

for item in savings_opportunities[:30]:
    categorized = False
    item_lower = item['item'].lower()
    for category, keywords in category_keywords.items():
        if any(keyword in item_lower for keyword in keywords):
            categories[category]['items'].append(item)
            categories[category]['total_spent'] += item['total_spent']
            categorized = True
            break
    if not categorized:
        categories['Other']['items'].append(item)
        categories['Other']['total_spent'] += item['total_spent']

# Sort categories by total spent
sorted_categories = sorted(categories.items(), key=lambda x: x[1]['total_spent'], reverse=True)

for category, data in sorted_categories[:5]:
    if data['items']:
        markdown_report += f"\n**{category}** (${data['total_spent']:.2f} annual spend)\n"
        for item in data['items'][:3]:
            markdown_report += f"- {item['item'].title()}: ${item['total_spent']:.2f}/year, {item['times_ordered']} orders\n"

markdown_report += """
## Prime Day Shopping Strategy

1. **Bulk Buy Opportunities**: Focus on non-perishable items ordered frequently
2. **Price Tracking**: Set alerts for items that show high price variance
3. **Storage Consideration**: Ensure adequate storage before bulk purchasing
4. **Budget Allocation**: Total potential savings across all items: ${}

""".format(sum(item['potential_savings'] for item in savings_opportunities))

# Save the report
with open('amazon_savings_analysis.md', 'w', encoding='utf-8') as f:
    f.write(markdown_report)

print(f"\nAnalysis complete! Found {len(savings_opportunities)} recurring items.")
print(f"Report saved to: amazon_savings_analysis.md")
print(f"\nTop 5 items by total spend:")
for i, item in enumerate(savings_opportunities[:5], 1):
    print(f"{i}. {item['item'][:50]}: ${item['total_spent']:.2f} ({item['times_ordered']} orders)")