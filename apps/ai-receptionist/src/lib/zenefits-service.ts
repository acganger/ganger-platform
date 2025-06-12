// Zenefits API Integration for Employee Lookup
// Identifies employees by phone number for personalized greetings

import { ZenefitsEmployee } from '@/types';

interface ZenefitsConfig {
  apiKey: string;
  companyId: string;
  baseUrl?: string;
}

export class ZenefitsEmployeeService {
  private config: ZenefitsConfig;
  private baseUrl: string;

  constructor(config: ZenefitsConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.zenefits.com/core';
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If it's 10 digits, assume US number and add country code
    if (digits.length === 10) {
      return `1${digits}`;
    }
    
    // If it's 11 digits starting with 1, it's already normalized
    if (digits.length === 11 && digits.startsWith('1')) {
      return digits;
    }
    
    return digits;
  }

  /**
   * Look up employee by phone number
   */
  async lookupEmployeeByPhone(callerPhone: string): Promise<ZenefitsEmployee | null> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(callerPhone);
      
      // Try real API first if credentials are available
      if (this.config.apiKey && this.config.apiKey !== 'demo_key') {
        try {
          const realEmployees = await this.fetchEmployeesFromAPI();
          const employee = realEmployees.find(emp => {
            const empPhone = this.normalizePhoneNumber(emp.phone);
            const empMobile = emp.mobile_phone ? this.normalizePhoneNumber(emp.mobile_phone) : null;
            const empWork = emp.work_phone ? this.normalizePhoneNumber(emp.work_phone) : null;
            
            return empPhone === normalizedPhone || 
                   empMobile === normalizedPhone || 
                   empWork === normalizedPhone;
          });

          if (employee && employee.employment_status === 'active') {
            console.log('🏢 Employee identified via Zenefits API:', employee.first_name, employee.last_name, employee.title);
            return employee;
          }
        } catch (apiError) {
          console.warn('Zenefits API lookup failed, falling back to demo data:', apiError instanceof Error ? apiError.message : 'Unknown error');
        }
      }
      
      // Fallback to demo data for development/testing
      const mockEmployees = this.getMockEmployeeData();
      
      // Check against all phone number fields
      const employee = mockEmployees.find(emp => {
        const empPhone = this.normalizePhoneNumber(emp.phone);
        const empMobile = emp.mobile_phone ? this.normalizePhoneNumber(emp.mobile_phone) : null;
        const empWork = emp.work_phone ? this.normalizePhoneNumber(emp.work_phone) : null;
        
        return empPhone === normalizedPhone || 
               empMobile === normalizedPhone || 
               empWork === normalizedPhone;
      });

      if (employee && employee.employment_status === 'active') {
        console.log('🏢 Employee identified:', employee.first_name, employee.last_name, employee.title);
        return employee;
      }

      return null;
    } catch (error) {
      console.error('Error looking up employee in Zenefits:', error);
      return null;
    }
  }

  /**
   * Get employee's preferred name or first name
   */
  getDisplayName(employee: ZenefitsEmployee): string {
    return employee.preferred_name || employee.first_name;
  }

  /**
   * Generate personalized greeting for employee
   */
  generateEmployeeGreeting(employee: ZenefitsEmployee): string {
    const name = this.getDisplayName(employee);
    const title = employee.title;
    
    const greetings = [
      `Hi ${name}! This is our AI assistant. How can I help you today?`,
      `Hello ${name}! I see this is coming from your number. What can I assist you with?`,
      `Good morning ${name}! I recognize your number. How may I help you today?`
    ];

    // Add title-specific greetings for managers/executives
    if (title.toLowerCase().includes('manager') || 
        title.toLowerCase().includes('director') || 
        title.toLowerCase().includes('executive')) {
      greetings.push(
        `Hello ${name}! I know you're busy with your ${title.toLowerCase()} responsibilities. How can I quickly assist you?`
      );
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Mock employee data for demo (replace with real API calls in production)
   */
  private getMockEmployeeData(): ZenefitsEmployee[] {
    return [
      {
        id: 'emp_001',
        first_name: 'Anand',
        last_name: 'Ganger',
        preferred_name: 'Anand',
        email: 'anand@gangerdermatology.com',
        phone: '+1 (734) 555-0101',
        mobile_phone: '+1 (734) 555-0101',
        work_phone: '+1 (734) 555-3000',
        title: 'Practice Owner & Dermatologist',
        department: 'Medical',
        employment_status: 'active',
        start_date: '2015-01-15',
        location: 'Ann Arbor'
      },
      {
        id: 'emp_002',
        first_name: 'Sarah',
        last_name: 'Williams',
        preferred_name: 'Sarah',
        email: 'sarah.williams@gangerdermatology.com',
        phone: '+1 (734) 555-0102',
        mobile_phone: '+1 (734) 555-0102',
        title: 'Physician Assistant',
        department: 'Medical',
        manager: {
          first_name: 'Anand',
          last_name: 'Ganger'
        },
        employment_status: 'active',
        start_date: '2020-03-10',
        location: 'Ann Arbor'
      },
      {
        id: 'emp_003',
        first_name: 'Jessica',
        last_name: 'Martinez',
        preferred_name: 'Jess',
        email: 'jessica.martinez@gangerdermatology.com',
        phone: '+1 (248) 555-0103',
        mobile_phone: '+1 (248) 555-0103',
        title: 'Practice Manager',
        department: 'Administration',
        employment_status: 'active',
        start_date: '2018-06-01',
        location: 'Wixom'
      },
      {
        id: 'emp_004',
        first_name: 'Michael',
        last_name: 'Johnson',
        preferred_name: 'Mike',
        email: 'michael.johnson@gangerdermatology.com',
        phone: '+1 (734) 555-0104',
        mobile_phone: '+1 (734) 555-0104',
        title: 'Medical Assistant',
        department: 'Medical',
        manager: {
          first_name: 'Sarah',
          last_name: 'Williams'
        },
        employment_status: 'active',
        start_date: '2021-09-15',
        location: 'Plymouth'
      },
      {
        id: 'emp_005',
        first_name: 'Amanda',
        last_name: 'Chen',
        preferred_name: 'Amanda',
        email: 'amanda.chen@gangerdermatology.com',
        phone: '+1 (248) 555-0105',
        mobile_phone: '+1 (248) 555-0105',
        title: 'Front Desk Coordinator',
        department: 'Administration',
        manager: {
          first_name: 'Jessica',
          last_name: 'Martinez'
        },
        employment_status: 'active',
        start_date: '2022-01-20',
        location: 'Wixom'
      },
      {
        id: 'emp_006',
        first_name: 'David',
        last_name: 'Thompson',
        preferred_name: 'Dave',
        email: 'david.thompson@gangerdermatology.com',
        phone: '+1 (734) 555-0106',
        mobile_phone: '+1 (734) 555-0106',
        title: 'IT Administrator',
        department: 'Technology',
        employment_status: 'active',
        start_date: '2019-11-05',
        location: 'Ann Arbor'
      }
    ];
  }

  /**
   * Production method to fetch employees from Zenefits API
   */
  private async fetchEmployeesFromAPI(): Promise<ZenefitsEmployee[]> {
    try {
      const response = await fetch(`${this.baseUrl}/core/people`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Zenefits API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle Zenefits API response structure: data.data.data
      const employees = data?.data?.data || data?.data || [];
      
      // Map Zenefits response to our interface
      return employees.map((emp: any) => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        preferred_name: emp.preferred_name,
        email: emp.work_email || emp.personal_email,
        phone: emp.work_phone || emp.personal_phone,
        mobile_phone: emp.personal_phone,
        work_phone: emp.work_phone,
        title: emp.title || 'Employee',
        department: emp.department?.name || 'Unknown',
        employment_status: emp.status === 'active' ? 'active' : 'inactive',
        start_date: emp.created_at || new Date().toISOString(),
        location: emp.location?.name
      }));
    } catch (error) {
      console.error('Failed to fetch employees from Zenefits:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const zenefitsService = new ZenefitsEmployeeService({
  apiKey: process.env.ZENEFITS_API_KEY || 'demo_key',
  companyId: process.env.ZENEFITS_COMPANY_ID || 'ganger_dermatology',
  baseUrl: process.env.ZENEFITS_API_URL || 'https://api.zenefits.com'
});