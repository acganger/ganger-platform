<?php
/**
 * Shared ModMed API Service
 * 
 * Provides unified access to ModMed FHIR API v2 across all Ganger platform applications.
 * This service handles OAuth2 authentication and provides methods for accessing
 * patient data, appointments, practitioners, and other FHIR resources.
 * 
 * @package Ganger\Shared\Services\API
 * @version 1.0.0
 * @since January 2025
 */

namespace Ganger\Shared\Services\API;

class ModMedAPI {
    /**
     * API Configuration
     * These are the production credentials verified as working
     */
    private static $config = [
        'api_key' => 'd6544613-bac8-497e-97f9-8825012ad5bf',
        'username' => 'fhir_cParg',
        'password' => 'DdoHuMihUN',
        'firm_id' => 'gangerderm',
        'base_url' => 'https://mmapi.ema-api.com/ema-prod/firm/gangerderm/ema',
        'oauth_endpoint' => '/ws/oauth2/grant',
        'fhir_endpoint' => '/fhir/v2'
    ];
    
    /**
     * Cached access token
     */
    private static $accessToken = null;
    private static $tokenExpiry = null;
    
    /**
     * Singleton instance
     */
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Private constructor for singleton
     */
    private function __construct() {
        // Override with environment variables if available
        if (getenv('MODMED_API_KEY')) {
            self::$config['api_key'] = getenv('MODMED_API_KEY');
        }
        if (getenv('MODMED_OAUTH2_USER')) {
            self::$config['username'] = getenv('MODMED_OAUTH2_USER');
        }
        if (getenv('MODMED_OAUTH2_PASS')) {
            self::$config['password'] = getenv('MODMED_OAUTH2_PASS');
        }
        if (getenv('MODMED_FIRM_ID')) {
            self::$config['firm_id'] = getenv('MODMED_FIRM_ID');
        }
    }
    
    /**
     * Get or refresh OAuth2 access token
     * 
     * @return string Access token
     * @throws \Exception if authentication fails
     */
    private function getAccessToken() {
        // Check if we have a valid cached token
        if (self::$accessToken && self::$tokenExpiry && time() < self::$tokenExpiry) {
            return self::$accessToken;
        }
        
        // Request new token
        $url = self::$config['base_url'] . self::$config['oauth_endpoint'];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'password',
            'username' => self::$config['username'],
            'password' => self::$config['password']
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'x-api-key: ' . self::$config['api_key']
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new \Exception("ModMed OAuth request failed: " . $error);
        }
        
        if ($httpCode !== 200) {
            throw new \Exception("ModMed OAuth failed with HTTP $httpCode: " . $response);
        }
        
        $data = json_decode($response, true);
        if (!isset($data['access_token'])) {
            throw new \Exception("No access token in ModMed OAuth response");
        }
        
        // Cache the token
        self::$accessToken = $data['access_token'];
        // Set expiry 5 minutes before actual expiry for safety
        $expiresIn = isset($data['expires_in']) ? $data['expires_in'] : 3600;
        self::$tokenExpiry = time() + $expiresIn - 300;
        
        return self::$accessToken;
    }
    
    /**
     * Make a FHIR API request
     * 
     * @param string $resource FHIR resource type (e.g., 'Patient', 'Appointment')
     * @param array $params Query parameters
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param array $body Request body for POST/PUT
     * @return array Parsed JSON response
     * @throws \Exception on API errors
     */
    public function request($resource, $params = [], $method = 'GET', $body = null) {
        $token = $this->getAccessToken();
        
        // Build URL
        $url = self::$config['base_url'] . self::$config['fhir_endpoint'] . '/' . $resource;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        $headers = [
            'Authorization: Bearer ' . $token,
            'x-api-key: ' . self::$config['api_key'],
            'Accept: application/fhir+json'
        ];
        
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            $headers[] = 'Content-Type: application/fhir+json';
        }
        
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new \Exception("ModMed FHIR request failed: " . $error);
        }
        
        if ($httpCode >= 400) {
            $errorData = json_decode($response, true);
            $errorMsg = isset($errorData['issue'][0]['diagnostics']) 
                ? $errorData['issue'][0]['diagnostics'] 
                : "HTTP $httpCode: " . substr($response, 0, 200);
            throw new \Exception("ModMed FHIR error: " . $errorMsg);
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Search for patients
     * 
     * @param array $criteria Search criteria (name, birthdate, identifier, etc.)
     * @param int $count Maximum number of results
     * @return array FHIR Bundle response
     */
    public function searchPatients($criteria = [], $count = 10) {
        $params = array_merge($criteria, ['_count' => min($count, 50)]);
        return $this->request('Patient', $params);
    }
    
    /**
     * Get a specific patient by ID
     * 
     * @param string $patientId ModMed patient ID
     * @return array FHIR Patient resource
     */
    public function getPatient($patientId) {
        return $this->request('Patient/' . $patientId);
    }
    
    /**
     * Search for appointments
     * 
     * @param array $criteria Search criteria (date, patient, practitioner, status)
     * @param int $count Maximum number of results (max 50 for ModMed)
     * @return array FHIR Bundle response
     */
    public function searchAppointments($criteria = [], $count = 50) {
        // Ensure _count is properly set and not duplicated
        // ModMed has a maximum _count of 50
        $params = $criteria;
        if (!isset($params['_count'])) {
            $params['_count'] = min($count, 50);
        } else {
            $params['_count'] = min($params['_count'], 50);
        }
        return $this->request('Appointment', $params);
    }
    
    /**
     * Get today's appointments
     * 
     * @param string $practitionerId Optional practitioner ID filter
     * @return array FHIR Bundle response
     */
    public function getTodaysAppointments($practitionerId = null) {
        $today = date('Y-m-d');
        $criteria = [
            'date' => 'ge' . $today . 'T00:00:00Z',
            '_count' => 50
        ];
        
        if ($practitionerId) {
            $criteria['practitioner'] = $practitionerId;
        }
        
        return $this->searchAppointments($criteria);
    }
    
    /**
     * Search for practitioners (doctors/providers)
     * 
     * @param array $criteria Search criteria
     * @param int $count Maximum number of results
     * @return array FHIR Bundle response
     */
    public function searchPractitioners($criteria = [], $count = 50) {
        $params = array_merge($criteria, ['_count' => min($count, 50)]);
        return $this->request('Practitioner', $params);
    }
    
    /**
     * Get document references for a patient
     * 
     * @param string $patientId Patient ID
     * @param string $category Optional category filter
     * @return array FHIR Bundle response
     */
    public function getPatientDocuments($patientId, $category = null) {
        $params = ['patient' => $patientId];
        if ($category) {
            $params['category'] = $category;
        }
        return $this->request('DocumentReference', $params);
    }
    
    /**
     * Get patient allergies
     * 
     * @param string $patientId Patient ID
     * @return array FHIR Bundle response
     */
    public function getPatientAllergies($patientId) {
        return $this->request('AllergyIntolerance', ['patient' => $patientId]);
    }
    
    /**
     * Get patient conditions/diagnoses
     * 
     * @param string $patientId Patient ID
     * @return array FHIR Bundle response
     */
    public function getPatientConditions($patientId) {
        return $this->request('Condition', ['patient' => $patientId]);
    }
    
    /**
     * Get patient medications
     * 
     * @param string $patientId Patient ID
     * @return array FHIR Bundle response
     */
    public function getPatientMedications($patientId) {
        return $this->request('MedicationStatement', ['patient' => $patientId]);
    }
    
    /**
     * Get available appointment slots
     * 
     * @param string $practitionerId Practitioner ID
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param string $endDate End date (YYYY-MM-DD)
     * @return array FHIR Bundle response
     */
    public function getAvailableSlots($practitionerId, $startDate, $endDate) {
        return $this->request('Slot', [
            'schedule.actor' => $practitionerId,
            'start' => 'ge' . $startDate . 'T00:00:00Z',
            'start' => 'le' . $endDate . 'T23:59:59Z',
            'status' => 'free'
        ]);
    }
    
    /**
     * Test API connectivity
     * 
     * @return array Test results
     */
    public function testConnection() {
        try {
            // Test OAuth
            $token = $this->getAccessToken();
            
            // Test FHIR access
            $practitioners = $this->searchPractitioners([], 1);
            
            return [
                'success' => true,
                'oauth_working' => true,
                'fhir_working' => true,
                'total_practitioners' => $practitioners['total'] ?? 0,
                'firm_id' => self::$config['firm_id']
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'firm_id' => self::$config['firm_id']
            ];
        }
    }
    
    /**
     * Get API configuration (for debugging)
     * 
     * @param bool $includeSensitive Include sensitive data
     * @return array Configuration
     */
    public function getConfig($includeSensitive = false) {
        $config = [
            'firm_id' => self::$config['firm_id'],
            'base_url' => self::$config['base_url']
        ];
        
        if ($includeSensitive) {
            $config['api_key'] = substr(self::$config['api_key'], 0, 8) . '...';
            $config['username'] = self::$config['username'];
        }
        
        return $config;
    }
}
?>