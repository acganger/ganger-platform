<?php
/**
 * Slack API Service
 * Shared service for Slack notifications and integrations
 * 
 * @package Ganger\Shared\Services\API
 * @since January 2025
 */

namespace Ganger\Shared\Services\API;

class SlackService
{
    private static ?self $instance = null;
    private ?string $webhookUrl = null;
    private string $appToken;
    private string $botToken;
    private string $defaultChannel;
    private string $defaultUsername;
    private string $defaultIconEmoji;
    
    /**
     * Private constructor for singleton pattern
     */
    private function __construct()
    {
        // Webhook URL for simple notifications
        $this->webhookUrl = $_ENV['SLACK_WEBHOOK_URL'] ?? null;
        
        // OAuth tokens for advanced API features
        $this->appToken = $_ENV['SLACK_APP_TOKEN'] ?? '';
        $this->botToken = $_ENV['SLACK_BOT_TOKEN'] ?? '';
        
        // Default notification settings
        $this->defaultChannel = $_ENV['SLACK_DEFAULT_CHANNEL'] ?? '#general';
        $this->defaultUsername = $_ENV['SLACK_DEFAULT_USERNAME'] ?? 'Ganger Platform';
        $this->defaultIconEmoji = $_ENV['SLACK_DEFAULT_ICON'] ?? ':hospital:';
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
     * Send a simple webhook notification
     * 
     * @param string $message Message text
     * @param array $params Optional parameters (channel, username, icon_emoji, attachments)
     * @return array Result with success status
     */
    public function sendWebhook(string $message, array $params = []): array
    {
        try {
            if (!$this->webhookUrl) {
                return [
                    'success' => false,
                    'message' => 'Slack webhook URL not configured',
                    'error' => 'Missing webhook URL'
                ];
            }
            
            // Build payload
            $payload = [
                'text' => $message,
                'username' => $params['username'] ?? $this->defaultUsername,
                'icon_emoji' => $params['icon_emoji'] ?? $this->defaultIconEmoji
            ];
            
            // Add channel if specified
            if (!empty($params['channel'])) {
                $payload['channel'] = $params['channel'];
            }
            
            // Add attachments if provided
            if (!empty($params['attachments'])) {
                $payload['attachments'] = $params['attachments'];
            }
            
            // Add blocks for rich formatting
            if (!empty($params['blocks'])) {
                $payload['blocks'] = $params['blocks'];
            }
            
            // Send to webhook
            $ch = curl_init($this->webhookUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            // Disable SSL verification on Windows dev
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, !$isWindows);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200 && $response === 'ok') {
                return [
                    'success' => true,
                    'message' => 'Slack notification sent successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to send Slack notification',
                    'error' => $response,
                    'http_code' => $httpCode
                ];
            }
            
        } catch (\Exception $e) {
            error_log("SlackService::sendWebhook error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Slack notification failed',
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Send a rich notification with formatting
     * 
     * @param string $title Notification title
     * @param string $message Main message
     * @param string $level Notification level (info, success, warning, error)
     * @param array $fields Additional fields to display
     * @param array $actions Action buttons
     * @return array Result with success status
     */
    public function sendRichNotification(
        string $title,
        string $message,
        string $level = 'info',
        array $fields = [],
        array $actions = []
    ): array {
        // Determine color based on level
        $colors = [
            'info' => '#2196F3',
            'success' => '#4CAF50',
            'warning' => '#FF9800',
            'error' => '#F44336'
        ];
        $color = $colors[$level] ?? $colors['info'];
        
        // Build attachment
        $attachment = [
            'color' => $color,
            'title' => $title,
            'text' => $message,
            'ts' => time()
        ];
        
        // Add fields if provided
        if (!empty($fields)) {
            $attachment['fields'] = array_map(function($key, $value) {
                return [
                    'title' => $key,
                    'value' => $value,
                    'short' => strlen($value) < 30
                ];
            }, array_keys($fields), array_values($fields));
        }
        
        // Add actions if provided
        if (!empty($actions)) {
            $attachment['actions'] = $actions;
        }
        
        return $this->sendWebhook('', ['attachments' => [$attachment]]);
    }
    
    /**
     * Send an error notification
     * 
     * @param string $error Error message
     * @param string $context Where the error occurred
     * @param array $details Additional error details
     * @return array Result with success status
     */
    public function sendError(string $error, string $context = '', array $details = []): array
    {
        $title = $context ? "Error in $context" : "Error";
        
        // Add timestamp to details
        $details['Time'] = date('Y-m-d H:i:s');
        $details['Server'] = $_SERVER['SERVER_NAME'] ?? 'Unknown';
        
        return $this->sendRichNotification($title, $error, 'error', $details);
    }
    
    /**
     * Send a success notification
     * 
     * @param string $message Success message
     * @param string $context What succeeded
     * @param array $details Additional details
     * @return array Result with success status
     */
    public function sendSuccess(string $message, string $context = '', array $details = []): array
    {
        $title = $context ? "Success: $context" : "Success";
        return $this->sendRichNotification($title, $message, 'success', $details);
    }
    
    /**
     * Send a warning notification
     * 
     * @param string $message Warning message
     * @param string $context What triggered the warning
     * @param array $details Additional details
     * @return array Result with success status
     */
    public function sendWarning(string $message, string $context = '', array $details = []): array
    {
        $title = $context ? "Warning: $context" : "Warning";
        return $this->sendRichNotification($title, $message, 'warning', $details);
    }
    
    /**
     * Send deployment notification
     * 
     * @param string $environment Deployment environment
     * @param string $version Version being deployed
     * @param string $user User who triggered deployment
     * @param array $changes List of changes
     * @return array Result with success status
     */
    public function sendDeploymentNotification(
        string $environment,
        string $version,
        string $user,
        array $changes = []
    ): array {
        $title = "Deployment to $environment";
        $message = "Version $version deployed by $user";
        
        $fields = [
            'Environment' => $environment,
            'Version' => $version,
            'Deployed By' => $user,
            'Time' => date('Y-m-d H:i:s')
        ];
        
        if (!empty($changes)) {
            $fields['Changes'] = implode("\n", array_slice($changes, 0, 5));
            if (count($changes) > 5) {
                $fields['Changes'] .= "\n... and " . (count($changes) - 5) . " more";
            }
        }
        
        return $this->sendRichNotification($title, $message, 'success', $fields);
    }
    
    /**
     * Send user activity notification
     * 
     * @param string $user User email
     * @param string $action Action performed
     * @param array $details Additional details
     * @return array Result with success status
     */
    public function sendUserActivity(string $user, string $action, array $details = []): array
    {
        $title = "User Activity";
        $message = "$user: $action";
        
        $fields = array_merge([
            'User' => $user,
            'Action' => $action,
            'Time' => date('Y-m-d H:i:s'),
            'IP' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
        ], $details);
        
        return $this->sendRichNotification($title, $message, 'info', $fields);
    }
    
    /**
     * Send system alert
     * 
     * @param string $alert Alert message
     * @param string $severity Alert severity (low, medium, high, critical)
     * @param array $metrics System metrics
     * @return array Result with success status
     */
    public function sendSystemAlert(string $alert, string $severity = 'medium', array $metrics = []): array
    {
        $levelMap = [
            'low' => 'info',
            'medium' => 'warning',
            'high' => 'error',
            'critical' => 'error'
        ];
        
        $level = $levelMap[$severity] ?? 'warning';
        $title = strtoupper($severity) . " System Alert";
        
        // Add severity emoji
        $emojis = [
            'low' => ':information_source:',
            'medium' => ':warning:',
            'high' => ':rotating_light:',
            'critical' => ':fire:'
        ];
        $emoji = $emojis[$severity] ?? ':warning:';
        
        $message = "$emoji $alert";
        
        return $this->sendRichNotification($title, $message, $level, $metrics);
    }
    
    /**
     * Send a message with blocks (advanced formatting)
     * 
     * @param array $blocks Slack block kit blocks
     * @param string $fallbackText Fallback text for notifications
     * @return array Result with success status
     */
    public function sendBlocks(array $blocks, string $fallbackText = 'Notification'): array
    {
        return $this->sendWebhook($fallbackText, ['blocks' => $blocks]);
    }
    
    /**
     * Format a user mention
     * 
     * @param string $userId Slack user ID
     * @return string Formatted mention
     */
    public static function mentionUser(string $userId): string
    {
        return "<@$userId>";
    }
    
    /**
     * Format a channel mention
     * 
     * @param string $channelId Slack channel ID
     * @return string Formatted mention
     */
    public static function mentionChannel(string $channelId): string
    {
        return "<#$channelId>";
    }
    
    /**
     * Format text as code
     * 
     * @param string $text Text to format
     * @param bool $block Use block formatting
     * @return string Formatted text
     */
    public static function formatCode(string $text, bool $block = false): string
    {
        return $block ? "```\n$text\n```" : "`$text`";
    }
    
    /**
     * Format text as bold
     * 
     * @param string $text Text to format
     * @return string Formatted text
     */
    public static function formatBold(string $text): string
    {
        return "*$text*";
    }
    
    /**
     * Format text as italic
     * 
     * @param string $text Text to format
     * @return string Formatted text
     */
    public static function formatItalic(string $text): string
    {
        return "_${text}_";
    }
    
    /**
     * Create a link
     * 
     * @param string $url URL
     * @param string $text Link text (optional)
     * @return string Formatted link
     */
    public static function formatLink(string $url, string $text = ''): string
    {
        return $text ? "<$url|$text>" : "<$url>";
    }
}
?>