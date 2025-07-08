#!/usr/bin/env python3
import csv
import re
from collections import defaultdict
from datetime import datetime

# Read the CSV file
orders = []
with open('orders_from_20240707_to_20250707_20250707_1040.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        orders.append(row)

print(f"Total orders: {len(orders)}")

# Analyze items
item_analysis = defaultdict(lambda: {
    'count': 0,
    'total_cost': 0,
    'prices': [],
    'quantities': [],
    'dates': [],
    'asins': set(),
    'full_title': ''
})

# Process each order
for order in orders:
    title = order.get('Title', '')
    asin = order.get('ASIN', '')
    quantity = order.get('Item Quantity', '1')
    subtotal = order.get('Item Subtotal', '0')
    order_date = order.get('Order Date', '')
    
    # Clean and parse values
    try:
        qty = int(quantity) if quantity else 1
    except:
        qty = 1
    
    try:
        # Remove currency symbols and convert to float
        total_price = float(re.sub(r'[^\d.]', '', subtotal)) if subtotal else 0
        unit_price = total_price / qty if qty > 0 else 0
    except:
        total_price = 0
        unit_price = 0
    
    if title and total_price > 0:
        # Use ASIN as primary key if available, otherwise use title
        key = asin if asin else title
        
        item_analysis[key]['count'] += qty
        item_analysis[key]['total_cost'] += total_price
        item_analysis[key]['prices'].append(unit_price)
        item_analysis[key]['quantities'].append(qty)
        item_analysis[key]['dates'].append(order_date)
        item_analysis[key]['asins'].add(asin)
        item_analysis[key]['full_title'] = title

# Filter items ordered more than twice
recurring_items = {
    k: v for k, v in item_analysis.items() 
    if len(v['dates']) > 2
}

# Calculate savings potential
savings_opportunities = []
for item_key, data in recurring_items.items():
    if data['prices']:
        avg_price = sum(data['prices']) / len(data['prices'])
        min_price = min(data['prices'])
        max_price = max(data['prices'])
        
        # Potential savings if bought at minimum price
        potential_savings = sum((p - min_price) * q for p, q in zip(data['prices'], data['quantities']))
        
        savings_opportunities.append({
            'item_key': item_key,
            'title': data['full_title'],
            'asins': list(data['asins']),
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

# Add top 25 items to report
for i, item in enumerate(savings_opportunities[:25], 1):
    markdown_report += f"""
#### {i}. {item['title'][:100]}...
- **ASIN**: {', '.join(item['asins']) if item['asins'][0] else 'N/A'}
- **Purchase Frequency**: {item['times_ordered']} orders, {item['total_quantity']} units total
- **Total Spent**: ${item['total_spent']:.2f}
- **Price Range**: ${item['min_price']:.2f} - ${item['max_price']:.2f} (variance: ${item['price_variance']:.2f})
- **Average Price**: ${item['avg_price']:.2f}
- **Potential Savings**: ${item['potential_savings']:.2f} ({item['savings_percent']:.1f}% if bought at lowest price)
- **🎯 Prime Day Target**: Look for deals below ${item['min_price']:.2f}
"""

# Add category analysis
markdown_report += """
## Category Analysis

### Top Categories by Spending:
"""

# Group by category from the data
category_spending = defaultdict(float)
category_items = defaultdict(list)

for order in orders:
    category = order.get('Amazon-Internal Product Category', 'Unknown')
    subtotal = order.get('Item Subtotal', '0')
    title = order.get('Title', '')
    
    try:
        amount = float(re.sub(r'[^\d.]', '', subtotal)) if subtotal else 0
    except:
        amount = 0
    
    if amount > 0:
        category_spending[category] += amount
        if title:
            category_items[category].append(title)

# Sort categories by spending
sorted_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)

for category, total in sorted_categories[:10]:
    markdown_report += f"\n**{category}**: ${total:.2f}\n"
    # Show sample items
    unique_items = list(set(category_items[category]))[:3]
    for item in unique_items:
        markdown_report += f"  - {item[:80]}...\n"

# Calculate total potential savings
total_potential_savings = sum(item['potential_savings'] for item in savings_opportunities)

markdown_report += f"""
## Prime Day Shopping Strategy

### Key Recommendations:

1. **Total Potential Annual Savings**: ${total_potential_savings:.2f}
2. **Focus on High-Frequency Items**: Items ordered 5+ times offer the best bulk-buy opportunities
3. **Price Variance Items**: Items with high price variance (>${10:.2f}) indicate good deal potential
4. **Top 5 Items to Stock Up On**:
"""

# List top 5 by order frequency
freq_sorted = sorted(savings_opportunities, key=lambda x: x['times_ordered'], reverse=True)[:5]
for i, item in enumerate(freq_sorted, 1):
    markdown_report += f"   {i}. {item['title'][:60]}... ({item['times_ordered']} orders)\n"

markdown_report += """
### Budget Allocation Guide:

Based on your ordering patterns, consider allocating your Prime Day budget as follows:
"""

# Calculate budget recommendations
budget_categories = [
    ("High-frequency consumables (10+ orders/year)", 
     sum(item['total_spent'] for item in savings_opportunities if item['times_ordered'] >= 10)),
    ("Medium-frequency items (5-9 orders/year)", 
     sum(item['total_spent'] for item in savings_opportunities if 5 <= item['times_ordered'] < 10)),
    ("Regular supplies (3-4 orders/year)", 
     sum(item['total_spent'] for item in savings_opportunities if 3 <= item['times_ordered'] < 5))
]

for category, amount in budget_categories:
    if amount > 0:
        markdown_report += f"- {category}: ${amount:.2f} ({amount/sum(x[1] for x in budget_categories)*100:.1f}%)\n"

# Save the report
with open('amazon_savings_analysis.md', 'w', encoding='utf-8') as f:
    f.write(markdown_report)

# Also create a CSV for easy reference
with open('amazon_recurring_items.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Title', 'ASIN', 'Times Ordered', 'Total Quantity', 'Total Spent', 
                     'Avg Price', 'Min Price', 'Max Price', 'Potential Savings %'])
    for item in savings_opportunities[:50]:
        writer.writerow([
            item['title'][:100],
            item['asins'][0] if item['asins'][0] else 'N/A',
            item['times_ordered'],
            item['total_quantity'],
            f"${item['total_spent']:.2f}",
            f"${item['avg_price']:.2f}",
            f"${item['min_price']:.2f}",
            f"${item['max_price']:.2f}",
            f"{item['savings_percent']:.1f}%"
        ])

print(f"\nAnalysis complete! Found {len(savings_opportunities)} recurring items.")
print(f"Reports saved to:")
print(f"  - amazon_savings_analysis.md")
print(f"  - amazon_recurring_items.csv")
print(f"\nTop 5 items by total spend:")
for i, item in enumerate(savings_opportunities[:5], 1):
    print(f"{i}. {item['title'][:60]}...: ${item['total_spent']:.2f} ({item['times_ordered']} orders)")