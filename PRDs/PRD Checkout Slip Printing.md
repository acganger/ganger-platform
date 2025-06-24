# 🧾 Product Requirements Document (PRD): Intelligent Thermal Checkout Slips

## 1. 🎯 Objective

Replace batch-printed, quarter-sheet checkout slips with dynamic, real-time thermal printouts using Zebra ZD621 printers and a web-based app. The new system will:
- Pre-populate personalized patient data (e.g., provider, last appointment, balance, etc.)
- Be printed **prior to the visit**, allowing providers or assistants to **mark up the slip during the encounter**
- Ensure checkout staff have **clear, accurate, and actionable instructions** after the visit
- Offer staff the ability to select between slip types (Medical, Cosmetic, Self-Pay)
- Provide real-time print confirmation via a web interface
- Improve layout, branding, data capture, and patient experience

---

## 2. 📄 Current Checkout Slip Summary

### ➤ Cosmetic Slip
Used by aestheticians and injectors. Tracks:
- Return plan (1 week, 1 month, etc.)
- Treatments performed (Botox units, filler types)
- Product purchases
- Areas treated (e.g., glabella, lips, cheeks)

### ➤ Medical Slip
Used for insured dermatology visits. Includes:
- Type of return visit and interval (e.g., 6M FSE)
- Procedures done (e.g., biopsy, Levulan, surgery)
- Follow-up plans
- Cosmetic interest section

### ➤ Self-Pay Addendum
Used when the patient is uninsured. Includes:
- CPT codes, descriptions, and standard pricing
- Clarifying note that these are office prices and subject to change

---

## 3. 🧠 Redesign Phase

### ✳️ Goals

- Transform dense, checkbox-heavy forms into **clean, visually-guided layouts**
- Make key decisions **obvious and hard to forget**
- Support **efficient note-taking or marking during the visit**
- Allow checkout staff to quickly:
  - Collect payment
  - Schedule appropriate follow-up
  - Transfer any special instructions to other systems (e.g., CRM, recall list)

### 🔨 Redesign Deliverables

| Slip Type | Redesign Strategy |
|-----------|-------------------|
| **Cosmetic** | Clearly separate sections for: return plan, products purchased, areas treated, provider initials. Use modern table design with icons or bold text for quick scanning. |
| **Medical** | Improve readability of return interval selections, procedure list, and cosmetic interest. Use section headers and spacing. |
| **Self-Pay Addendum** | Embed this visually into the medical slip when needed (not duplex). Use a scrollable section or smaller font to fit. Clearly label "Uninsured Pricing Reference". |

### 🖋 Key Design Concepts

- Use **bold section titles** (e.g., “Follow-Up Instructions”, “Charges to Collect”)
- Include **pre-populated fields**: Patient Name, DOB, Provider Name, Last Visit Date, Insurance Status, Current Balance
- Add **checkboxes or radio options** to prompt action:
  - Did the patient receive samples?
  - Is a follow-up scheduled?
  - Is a copay or product fee owed?
- Use **visual cues** (shaded boxes, icons) to reduce oversight

---

## 4. 💻 Web App Requirements

### 🧱 Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Node.js (Express API or Next.js)
- **Printer SDK**: Zebra Browser Print SDK + Link-OS REST API
- **ZPL Template Generator**: zpl-builder or custom generator
- **Authentication**: Google Workspace or in-house credential system

---

### 🧪 Workflow

1. **Before Visit**:
   - App generates slip pre-visit based on scheduled patient and provider
   - Printed and sent to treatment room with provider
2. **During Visit**:
   - Provider or assistant marks up slip with:
     - Treatments performed
     - Follow-up interval
     - Charges or instructions
3. **After Visit**:
   - Slip handed to checkout staff
   - Staff uses it to:
     - Collect appropriate fees
     - Schedule future appointments
     - Trigger CRM workflows

---

### 🖥️ App Features

- Patient lookup or barcode scan
- Slip type selector (Medical, Cosmetic, Medical+Self-Pay)
- Slip preview on screen
- Click “Print” → slip sent to local Zebra ZD621
- Visual confirmation:
  - ✅ “Printed successfully”
  - ❌ “Printer error” with retry

---

## 5. 🖨️ Hardware Setup

| Item             | Spec/Model |
|------------------|------------|
| Printer Model    | Zebra ZD621 (Direct Thermal) |
| Media            | 4” × 5.5” fan-fold, perforated |
| Locations        | 3 clinics + 1 spare |
| Print Volume     | 25–100 slips per day per clinic |
| Connectivity     | Networked Ethernet or WiFi |
| Print Language   | ZPL (Zebra Programming Language) |

---

## 6. 🔐 Security & Logging

- Role-based login for staff
- Each print job logged with:
  - Timestamp
  - User
  - Patient ID
  - Slip Type
  - Status (success/fail)

(Optional: logs synced to secure Google Sheet or Slack)

---

## 7. 📈 Proposed Future Enhancements

- **Dynamic pricing engine**: Pull real-time prices or discount eligibility based on patient attributes
- **eSign integration**: Allow signature capture for financial responsibility on cosmetic or self-pay treatments
- **Scan-and-store**: Allow staff to scan and store the marked-up slip digitally for audit/compliance
- **Automated reminders**: Trigger follow-up text/email workflows based on the slip contents
- **Analytics dashboard**: Track most-used treatments, missed follow-ups, cash collected
- **Multilingual support**: Offer translated slip options based on patient preference
- **Mobile print control**: Add QR-based remote print from tablets or iPads in rooms

---

## 8. 📆 Timeline

| Phase                        | Time Estimate |
|-----------------------------|----------------|
| Redesign Mockups            | 1 week         |
| Web App Scaffold             | 1 week         |
| API/Data Integrations       | 1–2 weeks      |
| ZPL Template Coding         | 3–5 days       |
| Print Testing + Feedback    | 1 week         |
| Rollout (Test Clinic)       | 3–5 days       |
| Full Deployment             | After approval |

---

## 9. ✅ Next Actions

- [ ] Approve this PRD
- [ ] Begin slip redesign (digital mockups + ZPL template)
- [ ] Build app scaffold (React, TypeScript, Print SDK)
- [ ] Configure Zebra printers and test on-site printing
- [ ] Pilot rollout at 1 clinic

---
