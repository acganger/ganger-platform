<?php
/**
 * Migration Adapter for transitioning apps to unified authentication
 * 
 * This adapter allows apps to gradually migrate from their current
 * authentication to the unified system without disrupting users.
 */

declare(strict_types=1);

namespace Ganger\Auth;

class MigrationAdapter 
{
    private string $appName;
    private bool $enabled = false;
    private array $config = [];
    
    /**
     * App-specific configuration
     */
    private const APP_CONFIGS = [
        'staff' => [
            'legacy_session_name' => 'STAFFPORTAL_SESSION',
            'login_url' => '/staff/',
            'unified_enabled' => false  // Set to true when ready to migrate
        ],
        'l10' => [
            'legacy_session_name' => 'STAFFPORTAL_SESSION',
            'login_url' => '/staff/',
            'unified_enabled' => false
        ],
        'socials' => [
            'legacy_session_name' => 'SOCIALS_SESSID',
            'login_url' => '/socials/',
            'unified_enabled' => false
        ],
        'kiosk' => [
            'legacy_session_name' => 'ganger_kiosk_session',
            'login_url' => '/staff/',
            'unified_enabled' => false
        ]
    ];
    
    public function __construct(string $appName) 
    {
        $this->appName = $appName;
        $this->config = self::APP_CONFIGS[$appName] ?? [];
        $this->enabled = $this->config['unified_enabled'] ?? false;
    }
    
    /**
     * Initialize session based on migration status
     */
    public function initializeSession(): void 
    {
        if ($this->enabled) {
            // Use unified authentication
            UnifiedAuth::enableMigrationMode($this->appName);
            UnifiedAuth::initializeSession();
        } else {
            // Use legacy authentication
            $this->initializeLegacySession();
        }
    }
    
    /**
     * Initialize legacy session (existing behavior)
     */
    private function initializeLegacySession(): void 
    {
        if (session_status() === PHP_SESSION_NONE) {
            $sessionName = $this->config['legacy_session_name'] ?? 'PHPSESSID';
            
            // Configure session for security (matching existing configs)
            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'domain' => '',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            
            session_name($sessionName);
            session_start();
        }
    }
    
    /**
     * Check if user is authenticated (works with both systems)
     */
    public function isAuthenticated(): bool 
    {
        if ($this->enabled) {
            return UnifiedAuth::isAuthenticated();
        }
        
        // Legacy authentication check
        return isset($_SESSION['user']) && 
               isset($_SESSION['user']['email']) &&
               str_ends_with($_SESSION['user']['email'], '@gangerdermatology.com') &&
               $_SESSION['user']['email'] !== 'office@gangerdermatology.com';
    }
    
    /**
     * Require authentication (works with both systems)
     */
    public function requireAuth(): void 
    {
        if ($this->enabled) {
            UnifiedAuth::requireAuth($this->config['login_url'] ?? '/staff/');
        } else {
            // Legacy auth check
            if (!$this->isAuthenticated()) {
                $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'] ?? '/';
                header("Location: " . ($this->config['login_url'] ?? '/staff/'));
                exit;
            }
        }
    }
    
    /**
     * Get current user (works with both systems)
     */
    public function getUser(): ?array 
    {
        if ($this->enabled) {
            return UnifiedAuth::getUser();
        }
        
        return $this->isAuthenticated() ? $_SESSION['user'] : null;
    }
    
    /**
     * Set user (for login)
     */
    public function setUser(array $userData): void 
    {
        if ($this->enabled) {
            UnifiedAuth::setUser($userData);
        } else {
            $_SESSION['user'] = $userData;
            $_SESSION['auth_time'] = time();
            $_SESSION['last_activity'] = time();
        }
    }
    
    /**
     * Destroy session (for logout)
     */
    public function destroySession(): void 
    {
        if ($this->enabled) {
            UnifiedAuth::destroySession();
        } else {
            // Legacy session destruction
            $_SESSION = [];
            
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(), 
                    '', 
                    time() - 42000,
                    $params["path"], 
                    $params["domain"],
                    $params["secure"], 
                    $params["httponly"]
                );
            }
            
            session_destroy();
        }
    }
    
    /**
     * Check if migration is enabled for this app
     */
    public function isMigrationEnabled(): bool 
    {
        return $this->enabled;
    }
    
    /**
     * Enable migration for this app (use carefully!)
     */
    public function enableMigration(): void 
    {
        $this->enabled = true;
        
        // Log migration enablement
        error_log("[MIGRATION] Unified auth enabled for app: {$this->appName}");
    }
    
    /**
     * Get migration status
     */
    public function getMigrationStatus(): array 
    {
        return [
            'app' => $this->appName,
            'unified_enabled' => $this->enabled,
            'legacy_session_name' => $this->config['legacy_session_name'] ?? 'unknown',
            'current_session_name' => session_name(),
            'is_authenticated' => $this->isAuthenticated(),
            'user_email' => $_SESSION['user']['email'] ?? null
        ];
    }
}