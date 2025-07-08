# Mock Data Demo - Policy Management

## 📋 Sample Policies Overview

### Kebijakan (3 policies)
1. **KB-001/2023** - Kebijakan Keamanan Informasi (2023-01-15)
   - Files: kebijakan-keamanan.pdf (1MB)
   - Status: Current

2. **KB-002/2022** - Kebijakan Penggunaan Sistem (2022-03-15) 
   - Files: kebijakan-sistem.pdf (1.5MB)
   - Status: Current

3. **KB-003/2020** - Kebijakan Manajemen Risiko (2020-05-12) ⚠️
   - Files: kebijakan-risiko.pdf (1.3MB)
   - Status: **OLD - Needs Review**

### SOP (3 policies)
1. **SOP-001/2022** - SOP Pengelolaan Data (2022-06-10)
   - Files: sop-data.docx (512KB)
   - Status: Current

2. **SOP-002/2021** - SOP Manajemen Insiden (2021-08-20) ⚠️
   - Files: sop-insiden.docx (768KB)
   - Status: **OLD - Needs Review**

3. **SOP-003/2024** - SOP Pengelolaan Aset IT (2024-01-08)
   - Files: sop-aset-it.docx (896KB)
   - Status: Current

### Pedoman (2 policies)
1. **PD-001/2024** - Pedoman Implementasi IT Governance (2024-03-20)
   - Files: None
   - Status: Current

2. **PD-002/2023** - Pedoman Audit Internal (2023-11-10)
   - Files: pedoman-audit.pdf (2.3MB)
   - Status: Current

### Petunjuk Teknis (2 policies)
1. **PT-001/2021** - Petunjuk Teknis Backup Data (2021-12-05) ⚠️
   - Files: petunjuk-backup.pdf (2MB)
   - Status: **OLD - Needs Review**

2. **PT-002/2020** - Petunjuk Teknis Monitoring Jaringan (2020-09-15) ⚠️
   - Files: petunjuk-monitoring.pdf (1.8MB)
   - Status: **OLD - Needs Review**

## 🎯 Testing Scenarios

### Scenario 1: View Old Documents
- Expand any category
- Look for red warning icons (⚠️) next to dates
- Click on old documents to see review warnings

### Scenario 2: Add New Policy
- Click "Add Policy" button
- Fill in form with test data:
  - No Dokumen: TEST-001/2025
  - Nama Dokumen: Test Policy Document
  - Tanggal: Today's date
  - Kategori: Choose any category
- Upload test files (optional)
- Save and verify it appears in the correct category

### Scenario 3: Edit Existing Policy
- Click edit button on any policy
- Modify the document name
- Add or remove files
- Save and verify changes

### Scenario 4: View Policy Details
- Click on any policy row
- Review all information displayed
- Check file attachments
- Notice old document warnings if applicable

### Scenario 5: Delete Policy
- Click delete button on any policy
- Confirm deletion
- Verify policy is removed from list

## 📊 Expected Behavior

### Category Counters
- Kebijakan: 3 total, 1 old
- SOP: 3 total, 1 old  
- Pedoman: 2 total, 0 old
- Petunjuk Teknis: 2 total, 2 old

### Visual Indicators
- 🔵 Blue counter: Total documents in category
- 🔴 Red counter: Old documents needing review
- ⚠️ Warning icon: Documents older than 1 year
- 📄 File icon: Attached documents

### Interactive Elements
- Accordion headers: Click to expand/collapse
- Policy rows: Click to view details
- Action buttons: Edit (blue) and Delete (red)
- File attachments: Download buttons (placeholder)

This mock data provides a comprehensive testing environment for all policy management features!
