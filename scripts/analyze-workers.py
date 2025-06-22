import json
import subprocess

# Get the list of workers
result = subprocess.run([
    'curl', '-s', '-X', 'GET',
    'https://api.cloudflare.com/client/v4/accounts/68d0160c9915efebbbecfddfd48cddab/workers/scripts',
    '-H', 'Authorization: Bearer TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf',
    '-H', 'Content-Type: application/json'
], capture_output=True, text=True)

data = json.loads(result.stdout)
workers = data.get('result', [])

# Workers to delete
workers_to_delete = [
    "ganger-batch-closeout-prod",
    "ganger-batch-closeout-staging",
    "ganger-component-showcase-staging",
    "ganger-eos-l10-staging",
    "ganger-handouts-patient",
    "ganger-handouts-staff",
    "ganger-integration-status",
    "ganger-integration-status-prod",
    "ganger-kiosk-admin",
    "ganger-kiosk-patient",
    "ganger-l10-production",
    "ganger-l10-staff",
    "ganger-l10-staff-staging",
    "ganger-l10-staff-v3",
    "ganger-medication-auth-prod",
    "ganger-meds-patient",
    "ganger-meds-staff",
    "ganger-pharma-scheduling-prod",
    "ganger-platform-production-production",
    "ganger-socials-reviews-production",
    "ganger-staff-portal-production",
    "integration-status",
    "integration-status-production",
    "integration-status-staging",
    "inventory-management-staging",
    "medication-auth",
    "medication-auth-production",
    "medication-auth-staging"
]

# Workers to keep
workers_to_keep = [
    "ganger-medical-production",
    "staff-portal-router-production",
    "ganger-business-production",
    "staff-portal-router"
]

print("🔍 Worker Analysis")
print("=" * 80)

for worker in workers:
    name = worker['id']
    if name in workers_to_delete:
        has_routes = worker.get('routes') is not None and len(worker.get('routes', [])) > 0
        print(f"\n❌ TO DELETE: {name}")
        print(f"   Created: {worker['created_on']}")
        print(f"   Modified: {worker['modified_on']}")
        print(f"   Has Routes: {has_routes}")
        if has_routes:
            for route in worker['routes']:
                print(f"   - Route: {route['pattern']} (ID: {route['id']})")
    elif name in workers_to_keep:
        print(f"\n✅ TO KEEP: {name}")
        print(f"   Created: {worker['created_on']}")
        print(f"   Modified: {worker['modified_on']}")

print("\n" + "=" * 80)
print(f"Total workers found: {len(workers)}")
print(f"Workers to delete: {len([w for w in workers if w['id'] in workers_to_delete])}")
print(f"Workers to keep: {len([w for w in workers if w['id'] in workers_to_keep])}")
