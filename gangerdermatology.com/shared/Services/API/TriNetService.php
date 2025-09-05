<?php
/**
 * TriNet HR API Service
 * Shared service for HR management and employee data
 * 
 * @package Ganger\Shared\Services\API
 * @since January 2025
 */

namespace Ganger\Shared\Services\API;

class TriNetService
{
    private static ?self $instance = null;
    private string $apiKey;
    private string $companyId;
    private string $baseUrl = 'https://api.zenefits.com';
    private bool $sandboxMode = false;
    
    /**
     * Private constructor for singleton pattern
     */
    private function __construct()
    {
        // Use environment variables or fallback to working credentials
        $this->apiKey = $_ENV['TRINET_API_KEY'] ?? 'wn1Y6KKFRB2j+GCH47K0';
        $this->companyId = $_ENV['TRINET_COMPANY_ID'] ?? '923571';
        
        // Check if we're in sandbox mode
        $this->sandboxMode = ($_ENV['TRINET_SANDBOX_MODE'] ?? false) === 'true';
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Make API request to TriNet
     * 
     * @param string $endpoint API endpoint
     * @param string $method HTTP method
     * @param array $data Request data
     * @return array Response data
     */
    private function makeRequest(string $endpoint, string $method = 'GET', array $data = []): array
    {
        try {
            $url = $this->baseUrl . $endpoint;
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->apiKey,
                'Accept: application/json',
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            if ($method !== 'GET' && !empty($data)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
            
            // Disable SSL verification on Windows dev
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                throw new \Exception("cURL Error: $error");
            }
            
            $responseData = json_decode($response, true);
            
            if ($httpCode >= 200 && $httpCode < 300) {
                return [
                    'success' => true,
                    'data' => $responseData,
                    'http_code' => $httpCode
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'API request failed',
                    'error' => $responseData['error'] ?? $responseData['message'] ?? 'Unknown error',
                    'http_code' => $httpCode
                ];
            }
            
        } catch (\Exception $e) {
            error_log("TriNetService::makeRequest error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'API request failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get company information
     * 
     * @return array Company details
     */
    public function getCompany(): array
    {
        return $this->makeRequest('/core/companies/' . $this->companyId);
    }
    
    /**
     * Get company locations
     * 
     * @return array List of locations
     */
    public function getLocations(): array
    {
        return $this->makeRequest('/core/companies/' . $this->companyId . '/locations');
    }
    
    /**
     * Get company departments
     * 
     * @return array List of departments
     */
    public function getDepartments(): array
    {
        return $this->makeRequest('/core/companies/' . $this->companyId . '/departments');
    }
    
    /**
     * Get all employees
     * 
     * @param array $filters Optional filters (status, department_id, location_id)
     * @return array List of employees
     */
    public function getEmployees(array $filters = []): array
    {
        $endpoint = '/core/companies/' . $this->companyId . '/people';
        
        if (!empty($filters)) {
            $endpoint .= '?' . http_build_query($filters);
        }
        
        return $this->makeRequest($endpoint);
    }
    
    /**
     * Get employee by ID
     * 
     * @param string $employeeId Employee ID
     * @return array Employee details
     */
    public function getEmployee(string $employeeId): array
    {
        return $this->makeRequest('/core/people/' . $employeeId);
    }
    
    /**
     * Get employee by email
     * 
     * @param string $email Employee email
     * @return array Employee details or empty if not found
     */
    public function getEmployeeByEmail(string $email): array
    {
        $result = $this->getEmployees(['work_email' => $email]);
        
        if ($result['success'] && !empty($result['data']['data']['data'])) {
            $employees = $result['data']['data']['data'];
            foreach ($employees as $employee) {
                if (strcasecmp($employee['work_email'], $email) === 0) {
                    return [
                        'success' => true,
                        'data' => $employee
                    ];
                }
            }
        }
        
        return [
            'success' => false,
            'message' => 'Employee not found',
            'email' => $email
        ];
    }
    
    /**
     * Get employee's employment information
     * 
     * @param string $employeeId Employee ID
     * @return array Employment details
     */
    public function getEmployment(string $employeeId): array
    {
        return $this->makeRequest('/core/people/' . $employeeId . '/employments');
    }
    
    /**
     * Get vacation requests
     * 
     * @param array $filters Optional filters (status, employee_id, start_date, end_date)
     * @return array List of vacation requests
     */
    public function getVacationRequests(array $filters = []): array
    {
        $endpoint = '/core/companies/' . $this->companyId . '/vacation_requests';
        
        if (!empty($filters)) {
            $endpoint .= '?' . http_build_query($filters);
        }
        
        return $this->makeRequest($endpoint);
    }
    
    /**
     * Get vacation types
     * 
     * @return array List of vacation types
     */
    public function getVacationTypes(): array
    {
        return $this->makeRequest('/core/companies/' . $this->companyId . '/vacation_types');
    }
    
    /**
     * Get time durations (work hours)
     * 
     * @param array $filters Optional filters (employee_id, start_date, end_date)
     * @return array List of time entries
     */
    public function getTimeDurations(array $filters = []): array
    {
        $endpoint = '/core/companies/' . $this->companyId . '/time_durations';
        
        if (!empty($filters)) {
            $endpoint .= '?' . http_build_query($filters);
        }
        
        return $this->makeRequest($endpoint);
    }
    
    /**
     * Get custom fields
     * 
     * @return array List of custom fields
     */
    public function getCustomFields(): array
    {
        return $this->makeRequest('/core/companies/' . $this->companyId . '/custom_fields');
    }
    
    /**
     * Get custom field values for an employee
     * 
     * @param string $employeeId Employee ID
     * @return array Custom field values
     */
    public function getCustomFieldValues(string $employeeId): array
    {
        return $this->makeRequest('/core/people/' . $employeeId . '/custom_field_values');
    }
    
    /**
     * Get active employees
     * 
     * @return array List of active employees
     */
    public function getActiveEmployees(): array
    {
        return $this->getEmployees(['status' => 'active']);
    }
    
    /**
     * Get terminated employees
     * 
     * @return array List of terminated employees
     */
    public function getTerminatedEmployees(): array
    {
        return $this->getEmployees(['status' => 'terminated']);
    }
    
    /**
     * Get employees by department
     * 
     * @param string $departmentId Department ID
     * @return array List of employees in department
     */
    public function getEmployeesByDepartment(string $departmentId): array
    {
        return $this->getEmployees(['department_id' => $departmentId]);
    }
    
    /**
     * Get employees by location
     * 
     * @param string $locationId Location ID
     * @return array List of employees at location
     */
    public function getEmployeesByLocation(string $locationId): array
    {
        return $this->getEmployees(['location_id' => $locationId]);
    }
    
    /**
     * Get employee's manager
     * 
     * @param string $employeeId Employee ID
     * @return array Manager details
     */
    public function getEmployeeManager(string $employeeId): array
    {
        $result = $this->getEmployee($employeeId);
        
        if ($result['success'] && !empty($result['data']['manager'])) {
            $managerId = $result['data']['manager'];
            return $this->getEmployee($managerId);
        }
        
        return [
            'success' => false,
            'message' => 'Manager not found'
        ];
    }
    
    /**
     * Get employee's direct reports
     * 
     * @param string $managerId Manager's employee ID
     * @return array List of direct reports
     */
    public function getDirectReports(string $managerId): array
    {
        $result = $this->getEmployees();
        
        if ($result['success'] && !empty($result['data']['data']['data'])) {
            $directReports = [];
            foreach ($result['data']['data']['data'] as $employee) {
                if (isset($employee['manager']) && $employee['manager'] === $managerId) {
                    $directReports[] = $employee;
                }
            }
            
            return [
                'success' => true,
                'data' => $directReports,
                'count' => count($directReports)
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Unable to retrieve direct reports'
        ];
    }
    
    /**
     * Check if employee exists
     * 
     * @param string $email Employee email
     * @return bool True if exists
     */
    public function employeeExists(string $email): bool
    {
        $result = $this->getEmployeeByEmail($email);
        return $result['success'] ?? false;
    }
    
    /**
     * Get vacation balance for employee
     * 
     * @param string $employeeId Employee ID
     * @return array Vacation balance details
     */
    public function getVacationBalance(string $employeeId): array
    {
        // This would typically require a more complex API call
        // Simplified version for now
        $requests = $this->getVacationRequests(['employee_id' => $employeeId]);
        
        if ($requests['success']) {
            // Calculate used vacation days
            $usedDays = 0;
            if (!empty($requests['data']['data']['data'])) {
                foreach ($requests['data']['data']['data'] as $request) {
                    if ($request['status'] === 'approved') {
                        // Calculate days between start and end
                        $start = new \DateTime($request['start_date']);
                        $end = new \DateTime($request['end_date']);
                        $diff = $end->diff($start);
                        $usedDays += $diff->days + 1;
                    }
                }
            }
            
            return [
                'success' => true,
                'data' => [
                    'used_days' => $usedDays,
                    'message' => 'Balance calculation requires vacation policy details'
                ]
            ];
        }
        
        return $requests;
    }
    
    /**
     * Format employee data for display
     * 
     * @param array $employee Raw employee data
     * @return array Formatted employee data
     */
    public static function formatEmployee(array $employee): array
    {
        return [
            'id' => $employee['id'] ?? '',
            'name' => trim(($employee['first_name'] ?? '') . ' ' . ($employee['last_name'] ?? '')),
            'email' => $employee['work_email'] ?? '',
            'personal_email' => $employee['personal_email'] ?? '',
            'phone' => $employee['work_phone'] ?? '',
            'personal_phone' => $employee['personal_phone'] ?? '',
            'department' => $employee['department']['name'] ?? 'Not assigned',
            'location' => $employee['location']['name'] ?? 'Not assigned',
            'manager' => $employee['manager'] ?? null,
            'status' => $employee['status'] ?? 'unknown',
            'hire_date' => $employee['hire_date'] ?? null,
            'termination_date' => $employee['termination_date'] ?? null,
            'photo_url' => $employee['photo_url'] ?? null
        ];
    }
}
?>