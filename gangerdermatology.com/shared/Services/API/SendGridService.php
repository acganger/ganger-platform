<?php
/**
 * SendGrid Email Service
 * Shared service for transactional and notification emails
 * 
 * @package Ganger\Shared\Services\API
 * @since January 2025
 */

namespace Ganger\Shared\Services\API;

class SendGridService
{
    private static ?self $instance = null;
    private string $apiKey;
    private string $fromEmail;
    private string $fromName;
    private bool $sandboxMode = false;
    
    /**
     * Private constructor for singleton pattern
     */
    private function __construct()
    {
        // Use environment variables or fallback to working credentials
        $this->apiKey = $_ENV['SENDGRID_API_KEY'] ?? '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';
        $this->fromEmail = $_ENV['SENDGRID_FROM_EMAIL'] ?? 'noreply@gangerdermatology.com';
        $this->fromName = $_ENV['SENDGRID_FROM_NAME'] ?? 'Ganger Dermatology';
        
        // Sandbox mode for testing (doesn't actually send emails)
        $this->sandboxMode = ($_ENV['SENDGRID_SANDBOX_MODE'] ?? false) === 'true';
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
     * Send email via SendGrid API
     * 
     * @param array $params Email parameters
     * @return array Result with success status and details
     */
    public function sendEmail(array $params): array
    {
        try {
            // Validate required parameters
            if (empty($params['to'])) {
                throw new \Exception('Recipient email is required');
            }
            
            if (empty($params['subject'])) {
                throw new \Exception('Email subject is required');
            }
            
            if (empty($params['content']) && empty($params['html'])) {
                throw new \Exception('Email content is required');
            }
            
            // Build email data
            $emailData = [
                'personalizations' => [
                    [
                        'to' => [
                            [
                                'email' => $params['to'],
                                'name' => $params['to_name'] ?? null
                            ]
                        ],
                        'subject' => $params['subject']
                    ]
                ],
                'from' => [
                    'email' => $params['from_email'] ?? $this->fromEmail,
                    'name' => $params['from_name'] ?? $this->fromName
                ],
                'content' => []
            ];
            
            // Add content (plain text and/or HTML)
            if (!empty($params['content'])) {
                $emailData['content'][] = [
                    'type' => 'text/plain',
                    'value' => $params['content']
                ];
            }
            
            if (!empty($params['html'])) {
                $emailData['content'][] = [
                    'type' => 'text/html',
                    'value' => $params['html']
                ];
            }
            
            // Add CC recipients if provided
            if (!empty($params['cc'])) {
                $emailData['personalizations'][0]['cc'] = is_array($params['cc'])
                    ? array_map(fn($email) => ['email' => $email], $params['cc'])
                    : [['email' => $params['cc']]];
            }
            
            // Add BCC recipients if provided
            if (!empty($params['bcc'])) {
                $emailData['personalizations'][0]['bcc'] = is_array($params['bcc'])
                    ? array_map(fn($email) => ['email' => $email], $params['bcc'])
                    : [['email' => $params['bcc']]];
            }
            
            // Add reply-to if provided
            if (!empty($params['reply_to'])) {
                $emailData['reply_to'] = [
                    'email' => $params['reply_to'],
                    'name' => $params['reply_to_name'] ?? null
                ];
            }
            
            // Add categories for tracking
            if (!empty($params['categories'])) {
                $emailData['categories'] = is_array($params['categories']) 
                    ? $params['categories'] 
                    : [$params['categories']];
            }
            
            // Enable sandbox mode if configured
            if ($this->sandboxMode) {
                $emailData['mail_settings'] = [
                    'sandbox_mode' => ['enable' => true]
                ];
            }
            
            // Send via SendGrid API
            $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            // Disable SSL verification on Windows dev
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 202) {
                return [
                    'success' => true,
                    'message' => $this->sandboxMode ? 'Email queued (sandbox mode)' : 'Email sent successfully',
                    'data' => [
                        'to' => $params['to'],
                        'subject' => $params['subject'],
                        'sandbox_mode' => $this->sandboxMode
                    ]
                ];
            } else {
                $errorData = json_decode($response, true);
                return [
                    'success' => false,
                    'message' => 'Failed to send email',
                    'error' => $errorData['errors'][0]['message'] ?? 'Unknown error',
                    'http_code' => $httpCode
                ];
            }
            
        } catch (\Exception $e) {
            error_log("SendGridService::sendEmail error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Email sending failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Send email to multiple recipients
     * 
     * @param array $recipients Array of email addresses
     * @param string $subject Email subject
     * @param string $content Email content (plain text)
     * @param string $html Email content (HTML)
     * @return array Result with success status
     */
    public function sendBulkEmail(array $recipients, string $subject, string $content = '', string $html = ''): array
    {
        try {
            if (empty($recipients)) {
                throw new \Exception('No recipients provided');
            }
            
            // SendGrid allows up to 1000 recipients per request
            $chunks = array_chunk($recipients, 1000);
            $results = [];
            
            foreach ($chunks as $chunk) {
                // Build personalizations for each recipient
                $personalizations = array_map(function($email) use ($subject) {
                    return [
                        'to' => [['email' => $email]],
                        'subject' => $subject
                    ];
                }, $chunk);
                
                $emailData = [
                    'personalizations' => $personalizations,
                    'from' => [
                        'email' => $this->fromEmail,
                        'name' => $this->fromName
                    ],
                    'content' => []
                ];
                
                if (!empty($content)) {
                    $emailData['content'][] = [
                        'type' => 'text/plain',
                        'value' => $content
                    ];
                }
                
                if (!empty($html)) {
                    $emailData['content'][] = [
                        'type' => 'text/html',
                        'value' => $html
                    ];
                }
                
                // Send batch
                $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $this->apiKey,
                    'Content-Type: application/json'
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 60);
                
                $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                $results[] = [
                    'chunk_size' => count($chunk),
                    'success' => $httpCode === 202,
                    'http_code' => $httpCode
                ];
            }
            
            $totalSent = array_sum(array_column(array_filter($results, fn($r) => $r['success']), 'chunk_size'));
            
            return [
                'success' => $totalSent > 0,
                'message' => "Sent to $totalSent of " . count($recipients) . " recipients",
                'results' => $results
            ];
            
        } catch (\Exception $e) {
            error_log("SendGridService::sendBulkEmail error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Bulk email sending failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Send email using a template
     * 
     * @param string $to Recipient email
     * @param string $templateId SendGrid template ID
     * @param array $templateData Dynamic template data
     * @return array Result with success status
     */
    public function sendTemplate(string $to, string $templateId, array $templateData = []): array
    {
        try {
            $emailData = [
                'personalizations' => [
                    [
                        'to' => [['email' => $to]],
                        'dynamic_template_data' => $templateData
                    ]
                ],
                'from' => [
                    'email' => $this->fromEmail,
                    'name' => $this->fromName
                ],
                'template_id' => $templateId
            ];
            
            $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 202) {
                return [
                    'success' => true,
                    'message' => 'Template email sent successfully',
                    'data' => [
                        'to' => $to,
                        'template_id' => $templateId
                    ]
                ];
            } else {
                $errorData = json_decode($response, true);
                return [
                    'success' => false,
                    'message' => 'Failed to send template email',
                    'error' => $errorData['errors'][0]['message'] ?? 'Unknown error',
                    'http_code' => $httpCode
                ];
            }
            
        } catch (\Exception $e) {
            error_log("SendGridService::sendTemplate error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Template email sending failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Validate email address format
     * 
     * @param string $email Email to validate
     * @return bool True if valid
     */
    public static function validateEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}
?>