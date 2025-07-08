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

# Coffee-related keywords
coffee_keywords = [
    'coffee', 'keurig', 'k-cup', 'k cup', 'kcup', 'starbucks', 'folgers', 
    'creamer', 'coffee mate', 'coffeemate', 'espresso', 'cappuccino', 
    'latte', 'brew', 'roast', 'cafe', 'caffeine', 'pods'
]

# Analyze coffee items
coffee_items = []
total_coffee_spending = 0
coffee_categories = defaultdict(lambda: {'items': [], 'total': 0, 'count': 0})

for order in orders:
    title = order.get('Title', '').lower()
    asin = order.get('ASIN', '')
    quantity = order.get('Item Quantity', '1')
    subtotal = order.get('Item Subtotal', '0')
    order_date = order.get('Order Date', '')
    
    # Check if it's coffee-related
    is_coffee = any(keyword in title for keyword in coffee_keywords)
    
    if is_coffee:
        try:
            qty = int(quantity) if quantity else 1
        except:
            qty = 1
        
        try:
            total_price = float(re.sub(r'[^\d.]', '', subtotal)) if subtotal else 0
        except:
            total_price = 0
        
        if total_price > 0:
            coffee_items.append({
                'title': order.get('Title', ''),
                'asin': asin,
                'quantity': qty,
                'total_price': total_price,
                'unit_price': total_price / qty if qty > 0 else 0,
                'date': order_date
            })
            
            total_coffee_spending += total_price
            
            # Categorize the coffee item
            if any(k in title for k in ['k-cup', 'k cup', 'kcup', 'keurig', 'pod']):
                category = 'K-Cups/Pods'
            elif any(k in title for k in ['creamer', 'coffee mate', 'coffeemate']):
                category = 'Creamers'
            elif any(k in title for k in ['ground', 'whole bean', 'bag', 'canister']):
                category = 'Ground/Whole Bean Coffee'
            elif any(k in title for k in ['instant', 'stick', 'packet']):
                category = 'Instant Coffee'
            elif any(k in title for k in ['filter', 'paper']):
                category = 'Coffee Filters/Accessories'
            else:
                category = 'Other Coffee Products'
            
            coffee_categories[category]['items'].append(coffee_items[-1])
            coffee_categories[category]['total'] += total_price
            coffee_categories[category]['count'] += 1

# Sort items by total price
coffee_items.sort(key=lambda x: x['total_price'], reverse=True)

# Generate report
print(f"\n☕ COFFEE SPENDING ANALYSIS ☕")
print(f"="*50)
print(f"Total Coffee-Related Spending: ${total_coffee_spending:.2f}")
print(f"Total Coffee Orders: {len(coffee_items)}")
print(f"Average per Order: ${total_coffee_spending/len(coffee_items):.2f}" if coffee_items else "No orders")

print(f"\n📊 SPENDING BY CATEGORY:")
print(f"-"*50)
for category, data in sorted(coffee_categories.items(), key=lambda x: x[1]['total'], reverse=True):
    percentage = (data['total'] / total_coffee_spending * 100) if total_coffee_spending > 0 else 0
    print(f"{category}: ${data['total']:.2f} ({percentage:.1f}%) - {data['count']} orders")

print(f"\n🏆 TOP 10 COFFEE PURCHASES:")
print(f"-"*50)
for i, item in enumerate(coffee_items[:10], 1):
    print(f"{i}. {item['title'][:80]}...")
    print(f"   ${item['total_price']:.2f} (Qty: {item['quantity']}, Unit: ${item['unit_price']:.2f})")

# Analyze specific brands
brand_spending = defaultdict(float)
brand_items = defaultdict(list)

for item in coffee_items:
    title_lower = item['title'].lower()
    if 'starbucks' in title_lower:
        brand_spending['Starbucks'] += item['total_price']
        brand_items['Starbucks'].append(item)
    elif 'keurig' in title_lower and 'keurig®' in title_lower:
        brand_spending['Keurig Brand'] += item['total_price']
        brand_items['Keurig Brand'].append(item)
    elif 'folgers' in title_lower:
        brand_spending['Folgers'] += item['total_price']
        brand_items['Folgers'].append(item)
    elif 'green mountain' in title_lower:
        brand_spending['Green Mountain'] += item['total_price']
        brand_items['Green Mountain'].append(item)
    elif 'dunkin' in title_lower:
        brand_spending['Dunkin'] += item['total_price']
        brand_items['Dunkin'].append(item)
    elif 'coffee mate' in title_lower or 'coffeemate' in title_lower:
        brand_spending['Coffee Mate (Creamer)'] += item['total_price']
        brand_items['Coffee Mate (Creamer)'].append(item)

print(f"\n🏪 SPENDING BY BRAND:")
print(f"-"*50)
for brand, amount in sorted(brand_spending.items(), key=lambda x: x[1], reverse=True):
    count = len(brand_items[brand])
    percentage = (amount / total_coffee_spending * 100) if total_coffee_spending > 0 else 0
    print(f"{brand}: ${amount:.2f} ({percentage:.1f}%) - {count} orders")

# Find most frequently ordered coffee items
from collections import Counter
item_frequency = Counter()
for item in coffee_items:
    # Create a simplified key for grouping similar items
    key = re.sub(r'\b\d+\s*(count|pack|ct|pods)\b', '', item['title'].lower())
    key = re.sub(r'\s+', ' ', key).strip()
    item_frequency[key] += 1

print(f"\n📈 MOST FREQUENTLY ORDERED (by product type):")
print(f"-"*50)
for item, count in item_frequency.most_common(10):
    if count > 1:
        print(f"{item[:60]}... - ordered {count} times")

# Monthly spending analysis
monthly_spending = defaultdict(float)
for item in coffee_items:
    if item['date']:
        try:
            date_obj = datetime.strptime(item['date'].split()[0], '%m/%d/%Y')
            month_key = date_obj.strftime('%Y-%m')
            monthly_spending[month_key] += item['total_price']
        except:
            pass

print(f"\n📅 MONTHLY COFFEE SPENDING TREND:")
print(f"-"*50)
sorted_months = sorted(monthly_spending.items())
for month, amount in sorted_months[-6:]:  # Last 6 months
    print(f"{month}: ${amount:.2f}")

avg_monthly = sum(monthly_spending.values()) / len(monthly_spending) if monthly_spending else 0
print(f"\nAverage Monthly Coffee Spending: ${avg_monthly:.2f}")
print(f"Projected Annual Coffee Spending: ${avg_monthly * 12:.2f}")

# Save detailed CSV
with open('coffee_spending_details.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Title', 'ASIN', 'Quantity', 'Total Price', 'Unit Price', 'Date'])
    for item in coffee_items:
        writer.writerow([
            item['title'][:100],
            item['asin'],
            item['quantity'],
            f"${item['total_price']:.2f}",
            f"${item['unit_price']:.2f}",
            item['date']
        ])

print(f"\n📄 Detailed report saved to: coffee_spending_details.csv")