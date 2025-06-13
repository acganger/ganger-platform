# Manual Screenshot Capture Guide

## 🎯 Required Screenshots for Deployment 2025-06-13-deployment-001

Follow these steps to capture the required deployment verification screenshots:

### Prerequisites
- Chrome or Firefox browser
- Admin access to capture full-page screenshots

## 📸 Screenshot Instructions

### 1. Desktop Homepage Screenshot
```bash
# Target specs:
URL: https://staff.gangerdermatology.com/
Viewport: 1920x1080 (Desktop)
File: 2025-06-13-deployment-001-homepage-desktop.png
```

**Steps:**
1. Open Chrome and navigate to `https://staff.gangerdermatology.com/`
2. Press `F12` to open Developer Tools
3. Click the device toolbar icon (📱) or press `Ctrl+Shift+M`
4. Set to "Responsive" and enter dimensions: 1920 x 1080
5. Wait for page to fully load (3 seconds)
6. Right-click and select "Capture screenshot" or use browser screenshot
7. Save as `2025-06-13-deployment-001-homepage-desktop.png`

### 2. Mobile Homepage Screenshot
```bash
# Target specs:
URL: https://staff.gangerdermatology.com/
Viewport: 375x667 (iPhone SE)
File: 2025-06-13-deployment-001-homepage-mobile.png
```

**Steps:**
1. Keep the same page open with Developer Tools
2. In device toolbar, select "iPhone SE" or set to 375 x 667
3. Wait for responsive design to adjust
4. Capture full-page screenshot
5. Save as `2025-06-13-deployment-001-homepage-mobile.png`

### 3. Status Dashboard Screenshot
```bash
# Target specs:
URL: https://staff.gangerdermatology.com/status
Viewport: 1920x1080 (Desktop)
File: 2025-06-13-deployment-001-status-desktop.png
```

**Steps:**
1. Navigate to `https://staff.gangerdermatology.com/status`
2. Set viewport back to 1920 x 1080
3. Wait for dashboard to fully load and display all status indicators
4. Capture full-page screenshot
5. Save as `2025-06-13-deployment-001-status-desktop.png`

### 4. Medication Authorization Screenshot
```bash
# Target specs:
URL: https://staff.gangerdermatology.com/meds
Viewport: 1920x1080 (Desktop)
File: 2025-06-13-deployment-001-meds-desktop.png
```

**Steps:**
1. Navigate to `https://staff.gangerdermatology.com/meds`
2. Ensure viewport is 1920 x 1080
3. Wait for application to fully load
4. Capture full-page screenshot
5. Save as `2025-06-13-deployment-001-meds-desktop.png`

### 5. Inventory Coming Soon Screenshot
```bash
# Target specs:
URL: https://staff.gangerdermatology.com/inventory
Viewport: 1920x1080 (Desktop)
File: 2025-06-13-deployment-001-inventory-comingsoon.png
```

**Steps:**
1. Navigate to `https://staff.gangerdermatology.com/inventory`
2. Ensure viewport is 1920 x 1080
3. Wait for "Coming Soon" page to display
4. Capture full-page screenshot
5. Save as `2025-06-13-deployment-001-inventory-comingsoon.png`

## 📁 File Organization

Save all screenshots to:
```
/mnt/q/Projects/ganger-platform/deployments/
```

Final file structure should be:
```
deployments/
├── 2025-06-13-deployment-001-homepage-desktop.png
├── 2025-06-13-deployment-001-homepage-mobile.png
├── 2025-06-13-deployment-001-status-desktop.png
├── 2025-06-13-deployment-001-meds-desktop.png
└── 2025-06-13-deployment-001-inventory-comingsoon.png
```

## 🔧 Alternative Methods

### Using Chrome's Built-in Screenshot
1. Press `Ctrl+Shift+P` to open Command Palette
2. Type "screenshot" and select "Capture full size screenshot"
3. Chrome will automatically download the image

### Using Browser Extensions
- **Recommended**: "Full Page Screen Capture" Chrome extension
- **Alternative**: "Fireshot" for Firefox/Chrome

### Using Online Tools
- **web.dev Measure**: Enter URL for automated capture
- **Screenshot API services**: For batch processing

## ✅ Verification Checklist

After capturing all screenshots, verify:
- [ ] All 5 screenshots are captured
- [ ] Files are properly named with the exact convention
- [ ] Screenshots show full page content
- [ ] No browser UI elements are visible
- [ ] Images are high quality (PNG format)
- [ ] Files are saved in the correct directory

## 🚀 Post-Capture Actions

1. Review each screenshot for completeness
2. Add screenshots to the deployment documentation
3. Update the deployment report with actual file paths
4. Commit screenshots to the repository if needed

---
*Generated: June 13, 2025*  
*Deployment: 2025-06-13-deployment-001*