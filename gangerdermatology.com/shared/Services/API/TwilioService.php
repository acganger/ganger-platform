<?php
/**
 * Twilio API Service
 * Shared service for SMS and voice communications
 * 
 * @package Ganger\Shared\Services\API
 * @since January 2025
 */

namespace Ganger\Shared\Services\API;

class TwilioService
{
    private static ?self $instance = null;
    private string $accountSid;
    private string $authToken;
    private string $fromNumber;
    private bool $testMode = false;
    
    /**
     * Private constructor for singleton pattern
     */
    private function __construct()
    {
        // Use environment variables or fallback to working credentials
        $this->accountSid = $_ENV['TWILIO_ACCOUNT_SID'] ?? 'AC9931ff9e0373b113ff74896254b46ee4';
        $this->authToken = $_ENV['TWILIO_AUTH_TOKEN'] ?? '1842839203b725e0233d9a3f6179273e';
        $this->fromNumber = $_ENV['TWILIO_PHONE_NUMBER'] ?? '+17348225566';
        
        // Check if we're in test mode
        $this->testMode = ($_ENV['TWILIO_TEST_MODE'] ?? false) === 'true';
        
        if ($this->testMode) {
            // Use test credentials in test mode
            $this->accountSid = 'ACecc4235fe743c3d946267416b18eac01';
            $this->authToken = 'e6e82d87941ced2a61edb5781a7d5a23';
        }
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
     * Send SMS message
     * 
     * @param string $to Phone number to send to (E.164 format)
     * @param string $message Message body (max 1600 chars)
     * @return array Result with success status and details
     */
    public function sendSMS(string $to, string $message): array
    {
        try {
            // Validate phone number format
            if (!preg_match('/^\+?[1-9]\d{1,14}$/', $to)) {
                throw new \Exception('Invalid phone number format');
            }
            
            // Ensure message isn't too long
            if (strlen($message) > 1600) {
                $message = substr($message, 0, 1597) . '...';
            }
            
            // In test mode, don't actually send
            if ($this->testMode) {
                return [
                    'success' => true,
                    'message' => 'Test mode - SMS not sent',
                    'data' => [
                        'to' => $to,
                        'from' => $this->fromNumber,
                        'body' => $message,
                        'test_mode' => true
                    ]
                ];
            }
            
            // Twilio API endpoint
            $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $this->accountSid . '/Messages.json';
            
            // Message data
            $data = [
                'To' => $to,
                'From' => $this->fromNumber,
                'Body' => $message
            ];
            
            // Send request
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            curl_setopt($ch, CURLOPT_USERPWD, $this->accountSid . ':' . $this->authToken);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            // Disable SSL verification on Windows dev
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 201) {
                $responseData = json_decode($response, true);
                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'data' => [
                        'sid' => $responseData['sid'] ?? null,
                        'to' => $responseData['to'] ?? $to,
                        'from' => $responseData['from'] ?? $this->fromNumber,
                        'status' => $responseData['status'] ?? 'sent',
                        'price' => $responseData['price'] ?? null
                    ]
                ];
            } else {
                $errorData = json_decode($response, true);
                return [
                    'success' => false,
                    'message' => 'Failed to send SMS',
                    'error' => $errorData['message'] ?? 'Unknown error',
                    'http_code' => $httpCode
                ];
            }
            
        } catch (\Exception $e) {
            error_log("TwilioService::sendSMS error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'SMS sending failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Send SMS to multiple recipients
     * 
     * @param array $recipients Array of phone numbers
     * @param string $message Message to send
     * @return array Results for each recipient
     */
    public function sendBulkSMS(array $recipients, string $message): array
    {
        $results = [];
        
        foreach ($recipients as $recipient) {
            $results[$recipient] = $this->sendSMS($recipient, $message);
            
            // Add small delay to avoid rate limiting
            if (!$this->testMode && count($recipients) > 1) {
                usleep(100000); // 100ms delay
            }
        }
        
        return [
            'success' => true,
            'results' => $results,
            'summary' => [
                'total' => count($recipients),
                'sent' => count(array_filter($results, fn($r) => $r['success'] ?? false)),
                'failed' => count(array_filter($results, fn($r) => !($r['success'] ?? false)))
            ]
        ];
    }
    
    /**
     * Get account information
     * 
     * @return array Account details
     */
    public function getAccountInfo(): array
    {
        try {
            $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $this->accountSid . '.json';
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_USERPWD, $this->accountSid . ':' . $this->authToken);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                $data = json_decode($response, true);
                return [
                    'success' => true,
                    'account' => [
                        'sid' => $data['sid'] ?? null,
                        'friendly_name' => $data['friendly_name'] ?? 'Unknown',
                        'status' => $data['status'] ?? 'unknown',
                        'balance' => $data['balance'] ?? '0',
                        'type' => $data['type'] ?? 'Full',
                        'created' => $data['date_created'] ?? null
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to get account info',
                    'http_code' => $httpCode
                ];
            }
            
        } catch (\Exception $e) {
            error_log("TwilioService::getAccountInfo error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get account info',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Validate phone number format
     * 
     * @param string $phone Phone number to validate
     * @return bool True if valid
     */
    public static function validatePhoneNumber(string $phone): bool
    {
        // Remove common formatting characters
        $phone = preg_replace('/[\s\-\(\)\.]+/', '', $phone);
        
        // Check if it's a valid E.164 format
        return preg_match('/^\+?[1-9]\d{1,14}$/', $phone);
    }
    
    /**
     * Format phone number to E.164
     * 
     * @param string $phone Phone number to format
     * @param string $defaultCountry Default country code (default: US)
     * @return string Formatted phone number
     */
    public static function formatPhoneNumber(string $phone, string $defaultCountry = '1'): string
    {
        // Remove all non-numeric except leading +
        $phone = preg_replace('/[^\d\+]/', '', $phone);
        
        // If no country code, add default (US)
        if (!str_starts_with($phone, '+')) {
            if (strlen($phone) === 10) {
                // US number without country code
                $phone = '+' . $defaultCountry . $phone;
            } elseif (strlen($phone) === 11 && str_starts_with($phone, '1')) {
                // US number with country code but no +
                $phone = '+' . $phone;
            } elseif (!str_starts_with($phone, $defaultCountry)) {
                // Add default country code
                $phone = '+' . $defaultCountry . $phone;
            }
        }
        
        return $phone;
    }
}
?>