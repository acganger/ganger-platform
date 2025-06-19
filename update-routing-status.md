# Routing Status Update - January 19, 2025

## Current Routing Architecture

### Apps with Dedicated Workers (Handle Own Subroutes)
1. **L10** - `ganger-eos-l10-v2` - ✅ Subroutes working
2. **Staffing** - `ganger-staffing-staff-production` - ⚠️ Main works, subroutes static
3. **Compliance** - `ganger-compliance-staff-production` - ❌ Subroutes return 404
4. **Socials** - `ganger-socials-staff-production` - ⚠️ Main works, subroutes static

### Apps Handled by Staff Portal Router
1. **Inventory** - Uses R2 bucket via router - ✅ Subroutes work (dynamic fallback)
2. **Handouts** - `getDynamicPatientHandouts()` - ✅ Subroutes work via router
3. **Dashboard** - Inline dynamic HTML - ✅ Dynamic content
4. **Kiosk** - `getDynamicCheckinKiosk()` - ❌ No subroute handling
5. **Meds** - `getDynamicMedicationAuth()` - ❌ No subroute handling
6. **Batch** - `getDynamicBatchCloseout()` - ❌ Returns 500 error
7. **Config** - `getDynamicConfigDashboard()` - ❌ No subroute handling
8. **AI Receptionist** - `getAIReceptionistApp()` - ❌ No subroute handling
9. **Call Center** - `getCallCenterApp()` - ❌ No subroute handling
10. **Reps** - `getPharmaSchedulingApp()` - ❌ No subroute handling
11. **Status** - `getDynamicIntegrationStatus()` - ❌ No subroute handling
12. **Showcase** - Function not shown - ❌ No subroute handling

## Action Items

### High Priority (Apps with Dedicated Workers)
1. **Fix Compliance Worker** - Currently returns 404 on subroutes
2. **Fix Staffing Worker** - Add dynamic content to subroutes
3. **Fix Socials Worker** - Add dynamic content to subroutes

### Medium Priority (Router-Based Apps Needing Subroutes)
1. Update staff-router.js to handle subroutes for:
   - Kiosk (`/kiosk/*`)
   - Config (`/config/*`)
   - AI Receptionist (`/ai-receptionist/*`)
   - Call Center (`/call-center/*` or `/phones/*`)
   - Reps (`/reps/*`)
   - Showcase (`/showcase/*`)

### Low Priority
1. Fix Batch Closeout 500 error
2. Add more dynamic indicators to apps with few/none
3. Fix external domain connection issues (handouts.gangerdermatology.com, meds.gangerdermatology.com)
