#!/usr/bin/env python3
import sys, json

data = json.load(sys.stdin)
projects = data.get('projects', [])
linked = 0
total = len(projects)

print(f'\nTotal projects: {total}')
print('\nGitHub Integration Status:')

for p in sorted(projects, key=lambda x: x['name']):
    link = p.get('link', {})
    is_linked = link.get('type') == 'github'
    status = '✅ Linked' if is_linked else '❌ Not linked'
    repo = link.get('repo', 'N/A') if is_linked else 'N/A'
    print(f'{status} - {p["name"]} (repo: {repo})')
    linked += 1 if is_linked else 0

print(f'\nSummary: {linked}/{total} projects have GitHub integration')