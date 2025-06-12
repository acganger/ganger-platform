/**
 * Comprehensive testing framework for Compliance Training Frontend
 * 
 * This module provides enterprise-grade testing utilities, mock factories,
 * and test helpers for comprehensive test coverage.
 */

import type { 
  Employee, 
  TrainingModule, 
  TrainingCompletion, 
  ComplianceSummary,
  FilterOptions 
} from '../types/compliance';
import type { ComplianceStatus } from '../types/compliance-status';

// Test data factories
export class TestDataFactory {
  private static employeeIdCounter = 1;
  private static trainingIdCounter = 1;
  private static completionIdCounter = 1;

  /**
   * Create a mock employee with realistic data
   */
  static createEmployee(overrides: Partial<Employee> = {}): Employee {
    const id = `emp_${this.employeeIdCounter++}`;
    const firstName = this.getRandomFromArray(['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily']);
    const lastName = this.getRandomFromArray(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']);
    const name = `${firstName} ${lastName}`;
    
    return {
      id,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gangerdermatology.com`,
      department: this.getRandomFromArray(['Clinical', 'Administrative', 'IT', 'HR', 'Finance']),
      location: this.getRandomFromArray(['Ann Arbor', 'Wixom', 'Plymouth']),
      role: this.getRandomFromArray(['Nurse', 'Doctor', 'Receptionist', 'Administrator', 'Technician']),
      active: true,
      hireDate: this.getRandomDate(new Date('2020-01-01'), new Date()),
      ...overrides
    };
  }

  /**
   * Create a mock training module
   */
  static createTrainingModule(overrides: Partial<TrainingModule> = {}): TrainingModule {
    const id = `training_${this.trainingIdCounter++}`;
    const categories = ['HIPAA', 'Safety', 'Clinical', 'Administrative'] as const;
    const names = [
      'HIPAA Privacy Training',
      'Workplace Safety Fundamentals',
      'Patient Care Standards',
      'Emergency Procedures',
      'Data Security Awareness',
      'Infection Control Protocol'
    ];

    return {
      id,
      name: this.getRandomFromArray(names),
      description: 'Comprehensive training module covering essential workplace requirements and best practices.',
      category: this.getRandomFromArray(categories),
      durationMinutes: this.getRandomBetween(30, 180),
      validityPeriodDays: this.getRandomBetween(365, 1095), // 1-3 years
      isRequired: Math.random() > 0.3, // 70% chance of being required
      active: true,
      createdAt: this.getRandomDate(new Date('2023-01-01'), new Date()),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock training completion
   */
  static createTrainingCompletion(
    employeeId: string,
    trainingId: string,
    overrides: Partial<TrainingCompletion> = {}
  ): TrainingCompletion {
    const id = `completion_${this.completionIdCounter++}`;
    const completedAt = this.getRandomDate(new Date('2023-01-01'), new Date());
    const expiresAt = new Date(completedAt);
    expiresAt.setDate(expiresAt.getDate() + 365); // 1 year validity

    const statuses: ComplianceStatus[] = ['completed', 'overdue', 'due_soon', 'not_started'];
    const status = this.getRandomFromArray(statuses);

    // Adjust dates based on status
    if (status === 'overdue') {
      expiresAt.setDate(expiresAt.getDate() - 30); // Expired 30 days ago
    } else if (status === 'due_soon') {
      expiresAt.setDate(new Date().getDate() + 15); // Expires in 15 days
    }

    return {
      id,
      employeeId,
      trainingId,
      status,
      completedAt,
      expiresAt,
      score: status === 'completed' ? this.getRandomBetween(70, 100) : undefined,
      certificateUrl: status === 'completed' ? `https://certificates.example.com/${id}.pdf` : undefined,
      createdAt: completedAt,
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create a complete test dataset
   */
  static createTestDataset(options: {
    employeeCount?: number;
    trainingCount?: number;
    completionRatio?: number; // 0-1, percentage of employees who have completed trainings
  } = {}): {
    employees: Employee[];
    trainings: TrainingModule[];
    completions: TrainingCompletion[];
  } {
    const {
      employeeCount = 50,
      trainingCount = 10,
      completionRatio = 0.7
    } = options;

    const employees = Array.from({ length: employeeCount }, () => this.createEmployee());
    const trainings = Array.from({ length: trainingCount }, () => this.createTrainingModule());
    const completions: TrainingCompletion[] = [];

    // Create completions based on completion ratio
    employees.forEach(employee => {
      trainings.forEach(training => {
        if (Math.random() < completionRatio) {
          completions.push(this.createTrainingCompletion(employee.id, training.id));
        }
      });
    });

    return { employees, trainings, completions };
  }

  private static getRandomFromArray<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static getRandomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static getRandomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
}

// Mock API responses
export class MockApiService {
  private static employees: Employee[] = [];
  private static trainings: TrainingModule[] = [];
  private static completions: TrainingCompletion[] = [];

  static initialize(testData?: ReturnType<typeof TestDataFactory.createTestDataset>) {
    if (testData) {
      this.employees = testData.employees;
      this.trainings = testData.trainings;
      this.completions = testData.completions;
    } else {
      const data = TestDataFactory.createTestDataset();
      this.employees = data.employees;
      this.trainings = data.trainings;
      this.completions = data.completions;
    }
  }

  static async getEmployees(filters?: FilterOptions): Promise<Employee[]> {
    await this.simulateNetworkDelay();
    
    let result = [...this.employees];

    if (filters?.department && filters.department !== 'all') {
      result = result.filter(emp => emp.department === filters.department);
    }

    if (filters?.location && filters.location !== 'all') {
      result = result.filter(emp => emp.location === filters.location);
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term)
      );
    }

    return result;
  }

  static async getTrainings(): Promise<TrainingModule[]> {
    await this.simulateNetworkDelay();
    return [...this.trainings];
  }

  static async getCompletions(employeeId?: string): Promise<TrainingCompletion[]> {
    await this.simulateNetworkDelay();
    
    if (employeeId) {
      return this.completions.filter(c => c.employeeId === employeeId);
    }
    
    return [...this.completions];
  }

  static async updateCompletion(
    completionId: string, 
    updates: Partial<TrainingCompletion>
  ): Promise<TrainingCompletion> {
    await this.simulateNetworkDelay();
    
    const index = this.completions.findIndex(c => c.id === completionId);
    if (index === -1) {
      throw new Error(`Completion with ID ${completionId} not found`);
    }

    this.completions[index] = {
      ...this.completions[index],
      ...updates,
      updatedAt: new Date()
    };

    return this.completions[index];
  }

  static async createCompletion(completion: Omit<TrainingCompletion, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingCompletion> {
    await this.simulateNetworkDelay();
    
    const newCompletion: TrainingCompletion = {
      ...completion,
      id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.completions.push(newCompletion);
    return newCompletion;
  }

  static async deleteCompletion(completionId: string): Promise<void> {
    await this.simulateNetworkDelay();
    
    const index = this.completions.findIndex(c => c.id === completionId);
    if (index === -1) {
      throw new Error(`Completion with ID ${completionId} not found`);
    }

    this.completions.splice(index, 1);
  }

  private static async simulateNetworkDelay(minMs = 100, maxMs = 500): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Simulate network errors for testing error handling
  static simulateError(errorType: 'network' | 'server' | 'timeout' = 'network'): never {
    switch (errorType) {
      case 'network':
        throw new Error('Network error: Unable to connect to server');
      case 'server':
        throw new Error('Server error: Internal server error (500)');
      case 'timeout':
        throw new Error('Request timeout: Server did not respond in time');
      default:
        throw new Error('Unknown error occurred');
    }
  }
}

// Test utilities
export class TestUtils {
  /**
   * Wait for a condition to be true with timeout
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeoutMs = 5000,
    intervalMs = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }

  /**
   * Debounce utility for testing user input
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          resolve(func(...args));
        }, waitMs);
      });
    };
  }

  /**
   * Generate random test data for specific scenarios
   */
  static generateStressTestData(count: number): ReturnType<typeof TestDataFactory.createTestDataset> {
    return TestDataFactory.createTestDataset({
      employeeCount: count,
      trainingCount: Math.ceil(count / 5),
      completionRatio: 0.8
    });
  }

  /**
   * Validate compliance data integrity
   */
  static validateDataIntegrity(
    employees: Employee[],
    trainings: TrainingModule[],
    completions: TrainingCompletion[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate IDs
    const employeeIds = new Set();
    employees.forEach(emp => {
      if (employeeIds.has(emp.id)) {
        errors.push(`Duplicate employee ID: ${emp.id}`);
      }
      employeeIds.add(emp.id);
    });

    const trainingIds = new Set();
    trainings.forEach(training => {
      if (trainingIds.has(training.id)) {
        errors.push(`Duplicate training ID: ${training.id}`);
      }
      trainingIds.add(training.id);
    });

    // Check for orphaned completions
    completions.forEach(completion => {
      if (!employeeIds.has(completion.employeeId)) {
        errors.push(`Orphaned completion: employee ${completion.employeeId} not found`);
      }
      if (!trainingIds.has(completion.trainingId)) {
        errors.push(`Orphaned completion: training ${completion.trainingId} not found`);
      }
    });

    // Check for invalid dates
    completions.forEach(completion => {
      if (completion.completedAt > completion.expiresAt) {
        errors.push(`Invalid completion dates for ${completion.id}: completed after expiry`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Performance testing helper
   */
  static async measurePerformance<T>(
    name: string,
    operation: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;


    return { result, duration };
  }

  /**
   * Memory usage helper for testing memory leaks
   */
  static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  /**
   * Create a test environment snapshot
   */
  static createSnapshot(): {
    timestamp: number;
    memoryUsage: number;
    dataIntegrity: ReturnType<typeof TestUtils.validateDataIntegrity>;
  } {
    const testData = TestDataFactory.createTestDataset();
    
    return {
      timestamp: Date.now(),
      memoryUsage: this.getMemoryUsage(),
      dataIntegrity: this.validateDataIntegrity(
        testData.employees,
        testData.trainings,
        testData.completions
      )
    };
  }
}

// Test scenarios for specific compliance training use cases
export class ComplianceTestScenarios {
  /**
   * Test scenario: Employee with overdue trainings
   */
  static createOverdueScenario(): ReturnType<typeof TestDataFactory.createTestDataset> {
    const employee = TestDataFactory.createEmployee({
      name: 'John Overdue',
      email: 'john.overdue@gangerdermatology.com'
    });

    const training = TestDataFactory.createTrainingModule({
      name: 'Critical HIPAA Training',
      isRequired: true
    });

    const overdueCompletion = TestDataFactory.createTrainingCompletion(
      employee.id,
      training.id,
      {
        status: 'overdue',
        completedAt: new Date('2023-01-01'),
        expiresAt: new Date('2023-12-31') // Expired
      }
    );

    return {
      employees: [employee],
      trainings: [training],
      completions: [overdueCompletion]
    };
  }

  /**
   * Test scenario: New employee with no completed trainings
   */
  static createNewEmployeeScenario(): ReturnType<typeof TestDataFactory.createTestDataset> {
    const newEmployee = TestDataFactory.createEmployee({
      name: 'Jane Newbie',
      email: 'jane.newbie@gangerdermatology.com',
      hireDate: new Date() // Hired today
    });

    const requiredTrainings = [
      TestDataFactory.createTrainingModule({ name: 'HIPAA Training', isRequired: true }),
      TestDataFactory.createTrainingModule({ name: 'Safety Training', isRequired: true }),
      TestDataFactory.createTrainingModule({ name: 'Clinical Procedures', isRequired: true })
    ];

    return {
      employees: [newEmployee],
      trainings: requiredTrainings,
      completions: [] // No completions yet
    };
  }

  /**
   * Test scenario: Department with mixed compliance status
   */
  static createMixedComplianceScenario(): ReturnType<typeof TestDataFactory.createTestDataset> {
    const employees = [
      TestDataFactory.createEmployee({ department: 'Clinical', name: 'Dr. Compliant' }),
      TestDataFactory.createEmployee({ department: 'Clinical', name: 'Nurse Overdue' }),
      TestDataFactory.createEmployee({ department: 'Clinical', name: 'Tech DueSoon' })
    ];

    const training = TestDataFactory.createTrainingModule({
      name: 'Clinical Standards',
      isRequired: true
    });

    const completions = [
      TestDataFactory.createTrainingCompletion(employees[0].id, training.id, { status: 'completed' }),
      TestDataFactory.createTrainingCompletion(employees[1].id, training.id, { status: 'overdue' }),
      TestDataFactory.createTrainingCompletion(employees[2].id, training.id, { status: 'due_soon' })
    ];

    return {
      employees,
      trainings: [training],
      completions
    };
  }
}

// Initialize mock service with default data
MockApiService.initialize();

export { MockApiService as mockApi };