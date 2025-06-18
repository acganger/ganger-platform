# Manual Ninety.io Data Collection Guide

## 🎯 Objective
Since automated scraping dependencies are not available, this guide provides a systematic approach to manually collect all data from your ninety.io account for analysis and migration.

## 📋 Data Collection Checklist

### 1. Dashboard/Home (https://app.ninety.io/home)
- [ ] Screenshot of main dashboard
- [ ] List all widgets/metrics displayed
- [ ] Note navigation menu structure
- [ ] Document any quick actions available

### 2. Rocks Section
- [ ] Screenshot of rocks overview
- [ ] Export/copy all current rocks data including:
  - Rock titles and descriptions
  - Owners/assignees
  - Due dates
  - Progress percentages
  - Quarterly organization
  - Status indicators
- [ ] Document filtering/sorting options
- [ ] Note any bulk actions available

### 3. Scorecard Section
- [ ] Screenshot of scorecard view
- [ ] Export/copy all metrics including:
  - Metric names and descriptions
  - Current values
  - Target/goal values
  - Historical data (as far back as available)
  - Owners/responsible parties
  - Red/yellow/green thresholds
- [ ] Document data entry workflows
- [ ] Note trending/analysis features

### 4. Issues (IDS) Section
- [ ] Screenshot of issues list
- [ ] Export/copy all issues including:
  - Issue titles and descriptions
  - Types/categories
  - Priority levels
  - Status (identified/discussing/solved)
  - Owners/assignees
  - Creation and resolution dates
  - Discussion notes/comments
- [ ] Document IDS workflow process
- [ ] Note filtering and categorization options

### 5. Todos Section
- [ ] Screenshot of todos interface
- [ ] Export/copy all todos including:
  - Task descriptions
  - Assignees
  - Due dates
  - Completion status
  - Priority levels
  - Creation dates
  - Associated meetings/rocks/issues
- [ ] Document task management workflows
- [ ] Note recurring task features

### 6. Meetings Section
- [ ] Screenshot of meetings calendar/list
- [ ] Export/copy meeting data including:
  - Meeting dates and times
  - Attendee lists
  - Agendas
  - Meeting notes
  - Action items
  - L10 meeting structure
  - Historical meeting records
- [ ] Document meeting workflow process
- [ ] Note integration with other sections

### 7. Headlines Section
- [ ] Screenshot of headlines feed
- [ ] Export/copy all headlines including:
  - Headline text
  - Authors
  - Dates
  - Categories/tags
  - Good news vs. bad news classification
- [ ] Document headline creation workflow
- [ ] Note filtering and search capabilities

### 8. Team Management
- [ ] Screenshot of team member list
- [ ] Export/copy team data including:
  - Member names and emails
  - Roles/positions
  - Access levels
  - Department/location info
  - Active/inactive status
- [ ] Document permission structure
- [ ] Note team management features

### 9. Settings and Configuration
- [ ] Screenshot all settings pages
- [ ] Document configuration options including:
  - Company information
  - Meeting settings
  - Notification preferences
  - Integration settings
  - Custom fields/categories
- [ ] Note any API access or export features

### 10. Navigation and Features
- [ ] Map all menu items and sub-menus
- [ ] Document all available actions/buttons
- [ ] Note keyboard shortcuts
- [ ] Test and document search functionality
- [ ] Identify any bulk operations
- [ ] Note any mobile-specific features

## 📄 Data Export Methods

### Preferred Methods (in order):
1. **Built-in Export Features**: Look for export buttons, CSV downloads, etc.
2. **Copy-Paste to Spreadsheets**: Manually copy data tables to Google Sheets
3. **Screenshot Documentation**: For visual layouts and complex structures
4. **Text Copy**: For descriptions, notes, and settings

### Data Organization:
- Create separate files/sheets for each section
- Use consistent naming: `ninety-[section]-[date].csv`
- Include timestamps for all exported data
- Note any limitations or missing data

## 🎯 Focus Areas

### High Priority Data:
1. **Active Rocks**: Current quarterly goals and progress
2. **Scorecard Metrics**: All metrics with historical data
3. **Open Issues**: Unresolved items in the IDS process
4. **Active Todos**: Pending tasks and assignments
5. **Recent Meetings**: L10 meeting records and patterns

### Complete Historical Data:
- Export as much historical data as available
- Note data retention limits in ninety.io
- Identify any archived/inactive items
- Document data relationship patterns

## ⏰ Estimated Time Investment
- **Dashboard/Navigation**: 15 minutes
- **Rocks Data**: 30 minutes
- **Scorecard Data**: 45 minutes
- **Issues Data**: 30 minutes
- **Todos Data**: 30 minutes
- **Meetings Data**: 45 minutes
- **Headlines Data**: 20 minutes
- **Team/Settings**: 20 minutes
- **Total**: ~4 hours for comprehensive collection

## 📊 Next Steps After Collection
1. Organize all collected data in the `json-data/` folder
2. Use the analysis templates to evaluate feature gaps
3. Update the L10 PRD based on findings
4. Plan migration strategy for historical data
