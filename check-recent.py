#!/usr/bin/env python3
import sys
import json

data = json.load(sys.stdin)
deployments = data.get('deployments', [])

print(f'Recent {len(deployments)} deployments:')
print('=' * 50)

states = {}
for d in deployments:
    state = d.get('state', 'UNKNOWN')
    name = d.get('name', 'Unknown')
    url = d.get('url', 'N/A')
    
    if state not in states:
        states[state] = []
    states[state].append(name)
    
    emoji = {
        'READY': '✅',
        'ERROR': '❌',
        'BUILDING': '🔨',
        'QUEUED': '⏳',
        'CANCELED': '⚠️'
    }.get(state, '❓')
    
    print(f'{emoji} {name}: {state}')
    if state == 'READY':
        print(f'   URL: https://{url}')

print('\nSummary:')
for state, names in states.items():
    print(f'{state}: {len(names)} deployments')