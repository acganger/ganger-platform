# ⚡ Clean Architecture Quick Reference

**Production Status**: ✅ Fully Deployed  
**Last Verified**: January 19, 2025  

---

## 🎯 5 Workers Overview

| Worker | Routes | Purpose | Status |
|--------|--------|---------|--------|
| **medical** | `/inventory/*`, `/handouts/*`, `/meds/*`, `/kiosk/*` | Medical apps | ✅ Live |
| **business** | `/l10/*`, `/compliance/*`, `/staffing/*`, `/socials/*` | Business ops | ✅ Live |
| **core** | `/`, `/dashboard/*`, `/config/*`, `/status/*`, etc. | Platform core | ✅ Live |
| **portal** | `*.gangerdermatology.com` (patient domains) | External access | ✅ Live |
| **api** | `api.gangerdermatology.com/*`, `/api/*` | API gateway | ✅ Live |

---

## 🚀 Quick Deploy

```bash
cd /mnt/q/Projects/ganger-platform/clean-architecture
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"

# Deploy specific worker
cd [worker-name] && npx wrangler deploy --env production

# Deploy all
./deploy-all.sh

# Verify
./verify-deployment.sh
```

---

## 📍 Key URLs

### Staff Portal (Internal)
- Dashboard: https://staff.gangerdermatology.com/
- Inventory: https://staff.gangerdermatology.com/inventory
- L10: https://staff.gangerdermatology.com/l10/compass
- Compliance: https://staff.gangerdermatology.com/compliance
- Config: https://staff.gangerdermatology.com/config

### Patient Portals (External)
- Handouts: https://handouts.gangerdermatology.com
- Check-in: https://kiosk.gangerdermatology.com
- Medications: https://meds.gangerdermatology.com
- Rep Scheduling: https://reps.gangerdermatology.com

### API Endpoints
- Main API: https://api.gangerdermatology.com
- Health Check: https://api.gangerdermatology.com/health

---

## 🔧 Worker Configuration

Each worker uses `wrangler.jsonc`:
```jsonc
{
  "name": "ganger-[name]",
  "main": "index.js",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "env": {
    "production": {
      "name": "ganger-[name]-production",
      "routes": [
        // Auto-assigned routes
      ]
    }
  }
}
```

---

## ✅ Verification Checklist

- [ ] All routes return 200/302 status
- [ ] Dynamic timestamps visible
- [ ] Subroutes working
- [ ] SSL certificates active
- [ ] No static content

---

## 🚨 Common Commands

```bash
# Check worker status
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/68d0160c9915efebbbecfddfd48cddab/workers/scripts"

# Test specific route
curl -I https://staff.gangerdermatology.com/inventory

# View worker logs
# Use Cloudflare dashboard → Workers & Pages → [Worker Name] → Logs
```

---

## 📊 Performance Targets

- Cold Start: <200ms
- Warm Request: <50ms  
- Memory: <50MB per worker
- CPU Time: <10ms average
- Error Rate: <0.1%

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Route conflict | Delete old worker first |
| SSL error | Enable proxy in DNS |
| Static content | Check timestamp generation |
| 404 error | Verify route in wrangler.jsonc |

---

**Quick Reference v1.0** - Keep this handy for daily operations!