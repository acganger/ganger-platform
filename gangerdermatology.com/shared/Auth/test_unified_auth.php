<?php
/**
 * Test script for Unified Authentication System
 * Run this to verify the unified auth works before migrating apps
 */

// Prevent direct web access
if (php_sapi_name() !== 'cli' && !isset($_GET['test_key']) || $_GET['test_key'] !== 'ganger2025') {
    die('Access denied. This is a test script.');
}

require_once __DIR__ . '/UnifiedAuth.php';
require_once __DIR__ . '/MigrationAdapter.php';

use Ganger\Auth\UnifiedAuth;
use Ganger\Auth\MigrationAdapter;

// Test results array
$results = [];

echo "===========================================\n";
echo "Unified Authentication System Test Suite\n";
echo "===========================================\n\n";

// Test 1: Session Initialization
echo "Test 1: Session Initialization\n";
try {
    UnifiedAuth::initializeSession();
    $sessionName = session_name();
    $results['session_init'] = ($sessionName === 'GANGER_UNIFIED') ? 'PASS' : 'FAIL';
    echo "✓ Session initialized with name: $sessionName\n";
} catch (Exception $e) {
    $results['session_init'] = 'FAIL';
    echo "✗ Failed to initialize session: " . $e->getMessage() . "\n";
}

// Test 2: CSRF Token Generation
echo "\nTest 2: CSRF Token Generation\n";
try {
    $token1 = UnifiedAuth::generateCSRFToken();
    $token2 = UnifiedAuth::generateCSRFToken();
    $results['csrf_generation'] = ($token1 === $token2 && strlen($token1) === 64) ? 'PASS' : 'FAIL';
    echo "✓ CSRF token generated: " . substr($token1, 0, 20) . "...\n";
} catch (Exception $e) {
    $results['csrf_generation'] = 'FAIL';
    echo "✗ Failed to generate CSRF token: " . $e->getMessage() . "\n";
}

// Test 3: CSRF Token Verification
echo "\nTest 3: CSRF Token Verification\n";
try {
    $token = UnifiedAuth::generateCSRFToken();
    $verified = UnifiedAuth::verifyCSRFToken($token);
    $invalidVerified = UnifiedAuth::verifyCSRFToken('invalid_token');
    $results['csrf_verification'] = ($verified === true && $invalidVerified === false) ? 'PASS' : 'FAIL';
    echo "✓ CSRF token verification working correctly\n";
} catch (Exception $e) {
    $results['csrf_verification'] = 'FAIL';
    echo "✗ Failed CSRF verification: " . $e->getMessage() . "\n";
}

// Test 4: Authentication Check (should be false initially)
echo "\nTest 4: Authentication Check\n";
$isAuth = UnifiedAuth::isAuthenticated();
$results['auth_check'] = ($isAuth === false) ? 'PASS' : 'FAIL';
echo $isAuth ? "✗ User incorrectly authenticated\n" : "✓ User correctly not authenticated\n";

// Test 5: Set and Get User
echo "\nTest 5: Set and Get User\n";
try {
    $testUser = [
        'id' => 1,
        'email' => 'test@gangerdermatology.com',
        'name' => 'Test User',
        'role' => 'staff'
    ];
    
    UnifiedAuth::setUser($testUser);
    $retrievedUser = UnifiedAuth::getUser();
    
    $results['user_management'] = ($retrievedUser['email'] === $testUser['email']) ? 'PASS' : 'FAIL';
    echo "✓ User set and retrieved successfully\n";
} catch (Exception $e) {
    $results['user_management'] = 'FAIL';
    echo "✗ Failed user management: " . $e->getMessage() . "\n";
}

// Test 6: Blocked Account Check
echo "\nTest 6: Blocked Account Check\n";
try {
    // Set blocked account
    UnifiedAuth::setUser([
        'email' => 'office@gangerdermatology.com',
        'name' => 'Office Account'
    ]);
    
    $isAuth = UnifiedAuth::isAuthenticated();
    $results['blocked_account'] = ($isAuth === false) ? 'PASS' : 'FAIL';
    echo $isAuth ? "✗ Blocked account incorrectly authenticated\n" : "✓ Blocked account correctly rejected\n";
} catch (Exception $e) {
    $results['blocked_account'] = 'FAIL';
    echo "✗ Failed blocked account check: " . $e->getMessage() . "\n";
}

// Test 7: Domain Validation
echo "\nTest 7: Domain Validation\n";
try {
    // Set invalid domain
    UnifiedAuth::setUser([
        'email' => 'test@gmail.com',
        'name' => 'External User'
    ]);
    
    $isAuth = UnifiedAuth::isAuthenticated();
    $results['domain_validation'] = ($isAuth === false) ? 'PASS' : 'FAIL';
    echo $isAuth ? "✗ Invalid domain incorrectly authenticated\n" : "✓ Invalid domain correctly rejected\n";
} catch (Exception $e) {
    $results['domain_validation'] = 'FAIL';
    echo "✗ Failed domain validation: " . $e->getMessage() . "\n";
}

// Test 8: Migration Adapter
echo "\nTest 8: Migration Adapter\n";
try {
    $adapter = new MigrationAdapter('staff');
    $status = $adapter->getMigrationStatus();
    
    $results['migration_adapter'] = ($status['app'] === 'staff') ? 'PASS' : 'FAIL';
    echo "✓ Migration adapter initialized for app: " . $status['app'] . "\n";
    echo "  Unified enabled: " . ($status['unified_enabled'] ? 'Yes' : 'No') . "\n";
    echo "  Legacy session: " . $status['legacy_session_name'] . "\n";
} catch (Exception $e) {
    $results['migration_adapter'] = 'FAIL';
    echo "✗ Failed migration adapter: " . $e->getMessage() . "\n";
}

// Test 9: Role Checking
echo "\nTest 9: Role Checking\n";
try {
    // Set user with manager role
    UnifiedAuth::setUser([
        'email' => 'manager@gangerdermatology.com',
        'name' => 'Manager User',
        'role' => 'manager'
    ]);
    
    $hasStaff = UnifiedAuth::hasRole('staff');
    $hasManager = UnifiedAuth::hasRole('manager');
    $hasAdmin = UnifiedAuth::hasRole('admin');
    
    $results['role_checking'] = ($hasStaff && $hasManager && !$hasAdmin) ? 'PASS' : 'FAIL';
    echo "✓ Role hierarchy working correctly\n";
    echo "  Has staff role: " . ($hasStaff ? 'Yes' : 'No') . "\n";
    echo "  Has manager role: " . ($hasManager ? 'Yes' : 'No') . "\n";
    echo "  Has admin role: " . ($hasAdmin ? 'Yes' : 'No') . "\n";
} catch (Exception $e) {
    $results['role_checking'] = 'FAIL';
    echo "✗ Failed role checking: " . $e->getMessage() . "\n";
}

// Test 10: Session Info
echo "\nTest 10: Session Info\n";
try {
    $info = UnifiedAuth::getSessionInfo();
    $results['session_info'] = !empty($info['session_id']) ? 'PASS' : 'FAIL';
    
    echo "✓ Session info retrieved:\n";
    foreach ($info as $key => $value) {
        if ($value !== null) {
            $displayValue = is_bool($value) ? ($value ? 'true' : 'false') : $value;
            echo "  $key: $displayValue\n";
        }
    }
} catch (Exception $e) {
    $results['session_info'] = 'FAIL';
    echo "✗ Failed to get session info: " . $e->getMessage() . "\n";
}

// Summary
echo "\n===========================================\n";
echo "Test Results Summary\n";
echo "===========================================\n";

$passCount = 0;
$failCount = 0;

foreach ($results as $test => $result) {
    $icon = $result === 'PASS' ? '✓' : '✗';
    $color = $result === 'PASS' ? "\033[32m" : "\033[31m"; // Green or Red
    $reset = "\033[0m";
    
    if (php_sapi_name() === 'cli') {
        echo "$color$icon $test: $result$reset\n";
    } else {
        echo "$icon $test: $result\n";
    }
    
    if ($result === 'PASS') {
        $passCount++;
    } else {
        $failCount++;
    }
}

echo "\nTotal: $passCount passed, $failCount failed\n";

// Clean up
UnifiedAuth::destroySession();

if ($failCount === 0) {
    echo "\n✅ All tests passed! Unified auth system is ready.\n";
} else {
    echo "\n⚠️ Some tests failed. Please review before migration.\n";
}

// For web access, output as JSON too
if (php_sapi_name() !== 'cli') {
    echo "\n<pre>";
    echo json_encode([
        'results' => $results,
        'summary' => [
            'passed' => $passCount,
            'failed' => $failCount,
            'ready' => $failCount === 0
        ]
    ], JSON_PRETTY_PRINT);
    echo "</pre>";
}