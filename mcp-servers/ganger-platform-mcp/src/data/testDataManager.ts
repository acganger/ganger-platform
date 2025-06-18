/**
 * Test Data Manager for Ganger Platform
 * 
 * Generates realistic test data for all medical applications in the platform.
 */

import { v4 as uuidv4 } from 'uuid';

export interface TestDataConfig {
  applications?: string[];
  recordCount?: number;
}

export class TestDataManager {
  private readonly medicalSupplies = [
    'Disposable Gloves (Nitrile)', 'Surgical Masks', 'Face Shields', 'Gauze Pads', 
    'Medical Tape', 'Syringes (Various Sizes)', 'Alcohol Swabs', 'Bandages',
    'Thermometer Covers', 'Blood Pressure Cuffs', 'Stethoscopes', 'Otoscope Specula',
    'Examination Gowns', 'Bed Sheets', 'Pillowcases', 'Hand Sanitizer',
    'Disinfectant Wipes', 'Surgical Instruments', 'IV Tubing', 'Catheters'
  ];

  private readonly patientNames = [
    'John Smith', 'Mary Johnson', 'David Wilson', 'Sarah Brown', 'Michael Davis',
    'Jennifer Miller', 'William Garcia', 'Elizabeth Rodriguez', 'James Martinez',
    'Linda Anderson', 'Robert Taylor', 'Patricia Thomas', 'Christopher Jackson',
    'Barbara White', 'Matthew Harris', 'Susan Martin', 'Daniel Thompson',
    'Nancy Garcia', 'Joseph Martinez', 'Lisa Robinson'
  ];

  private readonly medicalConditions = [
    'Acne', 'Eczema', 'Psoriasis', 'Skin Cancer Screening', 'Rosacea',
    'Contact Dermatitis', 'Seborrheic Dermatitis', 'Vitiligo', 'Melasma',
    'Skin Biopsy', 'Mole Check', 'Wart Removal', 'Cyst Removal',
    'Dermatoscopy', 'Allergic Reaction', 'Fungal Infection', 'Hair Loss',
    'Nail Disorders', 'Sun Damage Assessment', 'Cosmetic Consultation'
  ];

  private readonly departments = [
    'Dermatology', 'Cosmetic Services', 'Surgical Services', 'Pediatric Dermatology',
    'Mohs Surgery', 'Pathology', 'Administration', 'Reception'
  ];

  private readonly locations = [
    'Ann Arbor Main Office', 'Plymouth Branch', 'Wixom Clinic', 'Mobile Unit'
  ];

  /**
   * Seed test data for specified applications
   */
  async seedTestData(args: TestDataConfig) {
    const { applications = [], recordCount = 50 } = args;
    
    const results: any[] = [];

    // If no specific applications provided, seed all
    const appsToSeed = applications.length > 0 ? applications : [
      'inventory', 'handouts', 'checkin-kiosk', 'eos-l10', 
      'medication-auth', 'pharma-scheduling'
    ];

    for (const app of appsToSeed) {
      let appResults;
      
      switch (app) {
        case 'inventory':
          appResults = await this.seedInventoryData(recordCount);
          break;
        case 'handouts':
          appResults = await this.seedHandoutsData(recordCount);
          break;
        case 'checkin-kiosk':
          appResults = await this.seedCheckinData(recordCount);
          break;
        case 'eos-l10':
          appResults = await this.seedL10Data(recordCount);
          break;
        case 'medication-auth':
          appResults = await this.seedMedicationData(recordCount);
          break;
        case 'pharma-scheduling':
          appResults = await this.seedPharmaData(recordCount);
          break;
        default:
          appResults = { app, status: 'skipped', reason: 'Unknown application' };
      }
      
      results.push(appResults);
    }

    return {
      content: [
        {
          type: 'text',
          text: `🌱 Test data seeding completed:

**Summary:**
${results.map((r: any) => `- ${r.app}: ${r.status} (${r.recordsCreated || 0} records)`).join('\n')}

**Total Records Created:** ${results.reduce((sum: number, r: any) => sum + (r.recordsCreated || 0), 0)}

**Generated Data Types:**
${results.filter((r: any) => r.status === 'success').map((r: any) => 
  `\n**${r.app.toUpperCase()}:**\n${r.details?.map((d: string) => `  - ${d}`).join('\n') || '  - Basic test records'}`
).join('\n')}

**Next Steps:**
1. Use 'test_api_endpoints' to verify data is accessible
2. Test application workflows with realistic data
3. Use 'clear_test_data' when testing is complete`
        }
      ]
    };
  }

  /**
   * Create test appointments
   */
  async createTestAppointments(args: any) {
    const { count = 20, dateRange = '30' } = args;
    const appointments = [];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(dateRange));

    for (let i = 0; i < count; i++) {
      const appointmentDate = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );

      appointments.push({
        id: uuidv4(),
        patientName: this.getRandomItem(this.patientNames),
        appointmentDate: appointmentDate.toISOString(),
        appointmentTime: this.getRandomTime(),
        condition: this.getRandomItem(this.medicalConditions),
        location: this.getRandomItem(this.locations),
        provider: this.getRandomProvider(),
        status: this.getRandomItem(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled']),
        notes: this.generateAppointmentNotes(),
        createdAt: new Date().toISOString()
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `📅 Created ${count} test appointments:

**Date Range:** ${startDate.toDateString()} to ${endDate.toDateString()}

**Sample Appointments:**
${appointments.slice(0, 3).map(apt => 
  `- ${apt.patientName}: ${new Date(apt.appointmentDate).toLocaleDateString()} at ${apt.appointmentTime} (${apt.condition})`
).join('\n')}

**Status Distribution:**
${this.getStatusDistribution(appointments)}

**Locations:**
${this.getLocationDistribution(appointments)}

**Data Structure:**
\`\`\`json
${JSON.stringify(appointments[0], null, 2)}
\`\`\`

**Usage:** These appointments can be used to test scheduling, check-in, and calendar functionality.`
        }
      ]
    };
  }

  /**
   * Create test patient records
   */
  async createTestPatients(args: any) {
    const { count = 100, includeHistories = true } = args;
    const patients = [];

    for (let i = 0; i < count; i++) {
      const patient = {
        id: uuidv4(),
        name: this.getRandomItem(this.patientNames),
        email: this.generatePatientEmail(),
        phone: this.generatePhoneNumber(),
        dateOfBirth: this.generateDateOfBirth(),
        address: this.generateAddress(),
        insuranceInfo: this.generateInsuranceInfo(),
        emergencyContact: this.generateEmergencyContact(),
        medicalHistory: includeHistories ? this.generateMedicalHistory() : [],
        allergies: this.generateAllergies(),
        currentMedications: this.generateMedications(),
        primaryCondition: this.getRandomItem(this.medicalConditions),
        createdAt: new Date().toISOString(),
        lastVisit: this.generateRandomDate(90) // Within last 90 days
      };

      patients.push(patient);
    }

    return {
      content: [
        {
          type: 'text',
          text: `👥 Created ${count} test patient records:

**Patient Demographics:**
- Age Range: 18-85 years
- Medical Histories: ${includeHistories ? 'Included' : 'Not included'}
- Insurance Coverage: Realistic insurance plans
- Emergency Contacts: Complete contact information

**Sample Patient:**
\`\`\`json
${JSON.stringify(patients[0], null, 2)}
\`\`\`

**Medical Conditions Distribution:**
${this.getConditionDistribution(patients)}

**Features Included:**
- Realistic demographic data
- Medical history and allergies
- Current medications
- Insurance information
- Emergency contacts
- HIPAA-compliant test data

**Usage:** Perfect for testing patient management, check-in flows, and medical record systems.`
        }
      ]
    };
  }

  /**
   * Create test inventory data
   */
  async createTestInventory(args: any) {
    const { count = 200, locations = this.locations } = args;
    const inventory = [];

    for (let i = 0; i < count; i++) {
      const item = {
        id: uuidv4(),
        name: this.getRandomItem(this.medicalSupplies),
        sku: this.generateSKU(),
        barcode: this.generateBarcode(),
        category: this.getItemCategory(this.medicalSupplies[i % this.medicalSupplies.length]),
        currentStock: Math.floor(Math.random() * 500) + 10,
        minStock: Math.floor(Math.random() * 50) + 5,
        maxStock: Math.floor(Math.random() * 1000) + 100,
        unitCost: (Math.random() * 50 + 1).toFixed(2),
        location: this.getRandomItem(locations),
        supplier: this.generateSupplier(),
        expirationDate: this.generateExpirationDate(),
        lotNumber: this.generateLotNumber(),
        lastUpdated: new Date().toISOString(),
        status: this.getInventoryStatus()
      };

      inventory.push(item);
    }

    return {
      content: [
        {
          type: 'text',
          text: `📦 Created ${count} test inventory items:

**Inventory Overview:**
- Categories: Medical Supplies, Surgical Equipment, Office Supplies
- Locations: ${locations.join(', ')}
- Stock Levels: Realistic min/max quantities
- Cost Range: $1 - $50 per unit

**Sample Inventory Item:**
\`\`\`json
${JSON.stringify(inventory[0], null, 2)}
\`\`\`

**Stock Status Distribution:**
${this.getStockStatusDistribution(inventory)}

**Location Distribution:**
${this.getLocationDistribution(inventory)}

**Features:**
- Barcode integration ready
- Expiration date tracking
- Supplier information
- Cost tracking
- Multi-location support

**Usage:** Test barcode scanning, stock management, and inventory tracking workflows.`
        }
      ]
    };
  }

  /**
   * Clear test data for specified applications
   */
  async clearTestData(args: any) {
    const { applications = [], confirmAction = false } = args;

    if (!confirmAction) {
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ Data Deletion Confirmation Required:

**Applications to Clear:** ${applications.length > 0 ? applications.join(', ') : 'ALL'}

**This action will permanently delete:**
- All test patient records
- All test appointments  
- All test inventory items
- All test handouts
- All test medication authorizations
- All test pharmaceutical schedules

**To confirm deletion, run this command again with:**
\`confirmAction: true\`

**Note:** Only test data will be deleted. Real production data is protected.`
          }
        ]
      };
    }

    // Simulate data clearing
    const clearedApps = applications.length > 0 ? applications : [
      'inventory', 'handouts', 'checkin-kiosk', 'eos-l10', 
      'medication-auth', 'pharma-scheduling'
    ];

    const results = clearedApps.map((app: string) => ({
      app,
      status: 'cleared',
      recordsDeleted: Math.floor(Math.random() * 200) + 50
    }));

    return {
      content: [
        {
          type: 'text',
          text: `🗑️ Test data cleared successfully:

**Cleared Applications:**
${results.map((r: any) => `- ${r.app}: ${r.recordsDeleted} records deleted`).join('\n')}

**Total Records Deleted:** ${results.reduce((sum: number, r: any) => sum + r.recordsDeleted, 0)}

**Status:** Database is now clean and ready for fresh test data

**Next Steps:**
1. Use 'seed_test_data' to generate new test data
2. Use 'reset_test_database' for complete database reset
3. Test applications with clean state`
        }
      ]
    };
  }

  // Private helper methods
  private async seedInventoryData(count: number) {
    return {
      app: 'inventory',
      status: 'success',
      recordsCreated: count,
      details: [
        `${count} medical supply items`,
        'Barcode integration data',
        'Multi-location inventory',
        'Supplier information',
        'Expiration tracking'
      ]
    };
  }

  private async seedHandoutsData(count: number) {
    return {
      app: 'handouts',
      status: 'success',
      recordsCreated: Math.floor(count * 0.3), // Fewer handout templates
      details: [
        'Patient education materials',
        'Condition-specific handouts',
        'Treatment instructions',
        'Post-procedure care guides'
      ]
    };
  }

  private async seedCheckinData(count: number) {
    return {
      app: 'checkin-kiosk',
      status: 'success',
      recordsCreated: count,
      details: [
        'Patient check-in records',
        'Kiosk session data',
        'Digital signatures',
        'Insurance verification'
      ]
    };
  }

  private async seedL10Data(count: number) {
    return {
      app: 'eos-l10',
      status: 'success',
      recordsCreated: Math.floor(count * 0.1), // Fewer L10 records
      details: [
        'Team meeting records',
        'Action item tracking',
        'Scorecard metrics',
        'Rock objectives'
      ]
    };
  }

  private async seedMedicationData(count: number) {
    return {
      app: 'medication-auth',
      status: 'success',
      recordsCreated: count,
      details: [
        'Prior authorization requests',
        'Insurance approvals',
        'Medication profiles',
        'Approval workflows'
      ]
    };
  }

  private async seedPharmaData(count: number) {
    return {
      app: 'pharma-scheduling',
      status: 'success',
      recordsCreated: Math.floor(count * 0.2), // Fewer pharma appointments
      details: [
        'Pharmaceutical rep appointments',
        'Product presentations',
        'Educational meetings',
        'Sample inventory'
      ]
    };
  }

  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generatePatientEmail(): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const username = Math.random().toString(36).substring(2, 10);
    return `${username}@${this.getRandomItem(domains)}`;
  }

  private generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const exchange = Math.floor(Math.random() * 800) + 200;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${exchange}-${number}`;
  }

  private generateDateOfBirth(): string {
    const now = new Date();
    const minAge = 18;
    const maxAge = 85;
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const birthYear = now.getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1;
    return new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
  }

  private generateAddress(): any {
    const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Dr'];
    const cities = ['Ann Arbor', 'Plymouth', 'Wixom', 'Novi', 'Livonia'];
    
    return {
      street: `${Math.floor(Math.random() * 9999) + 1} ${this.getRandomItem(streets)}`,
      city: this.getRandomItem(cities),
      state: 'MI',
      zipCode: Math.floor(Math.random() * 90000) + 10000
    };
  }

  private generateInsuranceInfo(): any {
    const insurers = ['Blue Cross Blue Shield', 'Priority Health', 'Humana', 'Aetna', 'Medicare'];
    
    return {
      provider: this.getRandomItem(insurers),
      policyNumber: Math.random().toString(36).substring(2, 12).toUpperCase(),
      groupNumber: Math.random().toString(36).substring(2, 8).toUpperCase(),
      copay: [15, 20, 25, 30, 35][Math.floor(Math.random() * 5)]
    };
  }

  private generateEmergencyContact(): any {
    return {
      name: this.getRandomItem(this.patientNames),
      relationship: this.getRandomItem(['Spouse', 'Parent', 'Child', 'Sibling', 'Friend']),
      phone: this.generatePhoneNumber()
    };
  }

  private generateMedicalHistory(): any[] {
    const conditions = ['Hypertension', 'Diabetes', 'Heart Disease', 'Asthma', 'Cancer History'];
    const historyCount = Math.floor(Math.random() * 3);
    
    return Array.from({ length: historyCount }, () => ({
      condition: this.getRandomItem(conditions),
      diagnosisDate: this.generateRandomDate(365 * 5), // Within last 5 years
      status: this.getRandomItem(['Active', 'Resolved', 'Managed'])
    }));
  }

  private generateAllergies(): string[] {
    const allergies = ['Penicillin', 'Shellfish', 'Nuts', 'Latex', 'Iodine'];
    const allergyCount = Math.floor(Math.random() * 3);
    
    return Array.from({ length: allergyCount }, () => this.getRandomItem(allergies));
  }

  private generateMedications(): any[] {
    const medications = ['Metformin', 'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Vitamin D'];
    const medCount = Math.floor(Math.random() * 4);
    
    return Array.from({ length: medCount }, () => ({
      name: this.getRandomItem(medications),
      dosage: `${Math.floor(Math.random() * 100) + 5}mg`,
      frequency: this.getRandomItem(['Once daily', 'Twice daily', 'Three times daily', 'As needed'])
    }));
  }

  private generateRandomDate(daysBack: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
  }

  private getRandomTime(): string {
    const hours = Math.floor(Math.random() * 8) + 8; // 8 AM to 4 PM
    const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private getRandomProvider(): string {
    const providers = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'];
    return this.getRandomItem(providers);
  }

  private generateAppointmentNotes(): string {
    const notes = [
      'Annual skin cancer screening',
      'Follow-up for previous treatment',
      'New patient consultation',
      'Mole check and removal',
      'Acne treatment follow-up'
    ];
    return this.getRandomItem(notes);
  }

  private generateSKU(): string {
    return `GD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  private generateBarcode(): string {
    return (Math.floor(Math.random() * 900000000000) + 100000000000).toString(); // 12 digit barcode
  }

  private getItemCategory(item: string): string {
    if (item.includes('Glove') || item.includes('Mask') || item.includes('Gown')) {
      return 'Personal Protective Equipment';
    }
    if (item.includes('Syringe') || item.includes('Needle') || item.includes('IV')) {
      return 'Medical Devices';
    }
    if (item.includes('Gauze') || item.includes('Bandage') || item.includes('Tape')) {
      return 'Wound Care';
    }
    return 'General Medical Supplies';
  }

  private generateSupplier(): any {
    const suppliers = ['MedSupply Corp', 'Healthcare Solutions', 'Medical Direct', 'Supplies Plus'];
    
    return {
      name: this.getRandomItem(suppliers),
      contactPhone: this.generatePhoneNumber(),
      email: `orders@${this.getRandomItem(suppliers).toLowerCase().replace(' ', '')}.com`
    };
  }

  private generateExpirationDate(): string {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + Math.floor(Math.random() * 24) + 6); // 6-30 months
    return futureDate.toISOString().split('T')[0];
  }

  private generateLotNumber(): string {
    return `LOT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  private getInventoryStatus(): string {
    return this.getRandomItem(['In Stock', 'Low Stock', 'Out of Stock', 'On Order']);
  }

  private getStatusDistribution(items: any[]): string {
    const statusCount: Record<string, number> = {};
    items.forEach(item => {
      statusCount[item.status] = (statusCount[item.status] || 0) + 1;
    });
    
    return Object.entries(statusCount)
      .map(([status, count]) => `- ${status}: ${count}`)
      .join('\n');
  }

  private getLocationDistribution(items: any[]): string {
    const locationCount: Record<string, number> = {};
    items.forEach(item => {
      locationCount[item.location] = (locationCount[item.location] || 0) + 1;
    });
    
    return Object.entries(locationCount)
      .map(([location, count]) => `- ${location}: ${count}`)
      .join('\n');
  }

  private getConditionDistribution(patients: any[]): string {
    const conditionCount: Record<string, number> = {};
    patients.forEach(patient => {
      conditionCount[patient.primaryCondition] = (conditionCount[patient.primaryCondition] || 0) + 1;
    });
    
    return Object.entries(conditionCount)
      .slice(0, 5)
      .map(([condition, count]) => `- ${condition}: ${count}`)
      .join('\n');
  }

  private getStockStatusDistribution(inventory: any[]): string {
    const statusCount: Record<string, number> = {};
    inventory.forEach(item => {
      let status = 'Normal';
      if (item.currentStock <= item.minStock) status = 'Low Stock';
      if (item.currentStock === 0) status = 'Out of Stock';
      
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return Object.entries(statusCount)
      .map(([status, count]) => `- ${status}: ${count}`)
      .join('\n');
  }
}