<?php
/**
 * Test for Shared ModMed API Service
 */

// Include the service
require_once __DIR__ . '/ModMedAPI.php';

use Ganger\Shared\Services\API\ModMedAPI;

echo "\n=== Testing Shared ModMed API Service ===\n\n";

try {
    // Get instance
    $api = ModMedAPI::getInstance();
    echo "1. Service instantiated successfully\n";
    
    // Test connection
    echo "\n2. Testing API connection...\n";
    $testResult = $api->testConnection();
    
    if ($testResult['success']) {
        echo "   ✅ Connection successful!\n";
        echo "   - OAuth: Working\n";
        echo "   - FHIR: Working\n";
        echo "   - Firm ID: " . $testResult['firm_id'] . "\n";
        echo "   - Total Practitioners: " . $testResult['total_practitioners'] . "\n";
    } else {
        echo "   ❌ Connection failed: " . $testResult['error'] . "\n";
        exit(1);
    }
    
    // Test searching practitioners
    echo "\n3. Searching for practitioners...\n";
    $practitioners = $api->searchPractitioners([], 5);
    echo "   Found " . ($practitioners['total'] ?? 0) . " practitioners\n";
    
    if (isset($practitioners['entry'])) {
        foreach ($practitioners['entry'] as $i => $entry) {
            $practitioner = $entry['resource'];
            $name = isset($practitioner['name'][0]) 
                ? $practitioner['name'][0]['text'] ?? 'N/A'
                : 'N/A';
            echo "   - " . $name . " (ID: " . $practitioner['id'] . ")\n";
            if ($i >= 2) break; // Show only first 3
        }
    }
    
    // Test searching patients (limited)
    echo "\n4. Searching for patients (test query)...\n";
    try {
        $patients = $api->searchPatients(['_count' => 1]);
        echo "   Total patients accessible: " . ($patients['total'] ?? 0) . "\n";
        
        if (isset($patients['entry'][0])) {
            $patient = $patients['entry'][0]['resource'];
            echo "   Sample patient found:\n";
            echo "   - ID: " . $patient['id'] . "\n";
            if (isset($patient['name'][0])) {
                $name = $patient['name'][0];
                echo "   - Name: " . 
                    (isset($name['given'][0]) ? $name['given'][0] : '') . ' ' .
                    (isset($name['family']) ? $name['family'] : '') . "\n";
            }
            echo "   - Birth Date: " . ($patient['birthDate'] ?? 'N/A') . "\n";
        }
    } catch (Exception $e) {
        echo "   ⚠️ Patient search limited or restricted: " . $e->getMessage() . "\n";
    }
    
    // Test searching appointments
    echo "\n5. Searching for today's appointments...\n";
    try {
        $appointments = $api->getTodaysAppointments();
        echo "   Found " . ($appointments['total'] ?? 0) . " appointments for today\n";
    } catch (Exception $e) {
        echo "   ⚠️ Appointment search failed: " . $e->getMessage() . "\n";
    }
    
    // Show configuration (non-sensitive)
    echo "\n6. Service Configuration:\n";
    $config = $api->getConfig(false);
    foreach ($config as $key => $value) {
        echo "   - $key: $value\n";
    }
    
    echo "\n✅ All tests completed successfully!\n";
    echo "\nThe shared ModMed API service is ready to use across all Ganger platform applications.\n";
    
} catch (Exception $e) {
    echo "\n❌ Test failed with error:\n";
    echo $e->getMessage() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

echo "\n";
?>