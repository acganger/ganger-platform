<?php
/**
 * Unified Authentication System for Ganger Platform
 * 
 * This is the new unified authentication system that will eventually
 * replace individual app authentication. It can run in parallel with
 * existing systems without disruption.
 * 
 * @version 1.0.0
 * @since January 2025
 */

declare(strict_types=1);

namespace Ganger\Auth;

class UnifiedAuth 
{
    // Configuration constants
    const SESSION_NAME = 'GANGER_UNIFIED';
    const LEGACY_SESSION_NAMES = [
        'staff' => 'STAFFPORTAL_SESSION',
        'socials' => 'SOCIALS_SESSID',
        'l10' => 'STAFFPORTAL_SESSION', // Uses staff session
        'kiosk' => 'ganger_kiosk_session'
    ];
    
    const SESSION_LIFETIME = 86400; // 24 hours
    const ALLOWED_DOMAIN = '@gangerdermatology.com';
    const BLOCKED_ACCOUNTS = ['office@gangerdermatology.com'];
    
    // Migration mode flags
    private static bool $migrationMode = false;
    private static ?string $currentApp = null;
    
    /**
     * Enable migration mode for gradual transition
     * This allows the system to work with both old and new sessions
     */
    public static function enableMigrationMode(string $appName): void 
    {
        self::$migrationMode = true;
        self::$currentApp = $appName;
    }
    
    /**
     * Initialize unified session with backward compatibility
     */
    public static function initializeSession(): void 
    {
        // If in migration mode, check for existing legacy session first
        if (self::$migrationMode && self::$currentApp) {
            if (self::migrateLegacySession()) {
                return; // Successfully migrated existing session
            }
        }
        
        // Initialize new unified session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            self::configureSession();
            session_name(self::SESSION_NAME);
            session_start();
            self::initializeSessionData();
        }
        
        // Validate and maintain session
        self::validateSession();
    }
    
    /**
     * Configure session parameters for security
     */
    private static function configureSession(): void 
    {
        // Set secure cookie parameters
        session_set_cookie_params([
            'lifetime' => 0,           // Session cookie
            'path' => '/',             // Available to all apps
            'domain' => '',            // Current domain
            'secure' => true,          // HTTPS only
            'httponly' => true,        // No JS access
            'samesite' => 'Lax'        // CSRF protection
        ]);
        
        // Additional security settings
        ini_set('session.gc_maxlifetime', (string)self::SESSION_LIFETIME);
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_trans_sid', '0');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', '1');
        ini_set('session.cookie_samesite', 'Lax');
    }
    
    /**
     * Initialize session data structure
     */
    private static function initializeSessionData(): void 
    {
        if (!isset($_SESSION['initialized'])) {
            $_SESSION['initialized'] = true;
            $_SESSION['created_at'] = time();
            $_SESSION['last_activity'] = time();
            $_SESSION['last_regeneration'] = time();
            $_SESSION['ip_address'] = self::getClientIp();
            $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
        }
    }
    
    /**
     * Migrate legacy session to unified session
     * @return bool True if migration successful
     */
    private static function migrateLegacySession(): bool 
    {
        if (!self::$currentApp || !isset(self::LEGACY_SESSION_NAMES[self::$currentApp])) {
            return false;
        }
        
        $legacySessionName = self::LEGACY_SESSION_NAMES[self::$currentApp];
        
        // Check if legacy session exists
        if (session_status() === PHP_SESSION_NONE) {
            session_name($legacySessionName);
            session_start();
        }
        
        // If user is authenticated in legacy session, migrate to unified
        if (isset($_SESSION['user']) && !empty($_SESSION['user']['email'])) {
            $legacyData = $_SESSION;
            
            // Close legacy session
            session_write_close();
            
            // Start unified session
            self::configureSession();
            session_name(self::SESSION_NAME);
            session_start();
            
            // Migrate user data
            $_SESSION = array_merge($_SESSION, $legacyData);
            $_SESSION['migrated_from'] = $legacySessionName;
            $_SESSION['migration_time'] = time();
            self::initializeSessionData();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Validate current session
     */
    private static function validateSession(): void 
    {
        // Check session timeout
        if (isset($_SESSION['last_activity'])) {
            if (time() - $_SESSION['last_activity'] > self::SESSION_LIFETIME) {
                self::destroySession();
                return;
            }
            $_SESSION['last_activity'] = time();
        }
        
        // Regenerate session ID periodically
        if (isset($_SESSION['last_regeneration'])) {
            if (time() - $_SESSION['last_regeneration'] > 3600) {
                session_regenerate_id(true);
                $_SESSION['last_regeneration'] = time();
            }
        }
        
        // Validate IP address consistency (optional, can be disabled)
        if (isset($_SESSION['ip_address']) && $_SESSION['ip_address'] !== self::getClientIp()) {
            // Log potential session hijacking attempt
            error_log("Session IP mismatch detected. Stored: {$_SESSION['ip_address']}, Current: " . self::getClientIp());
            // Optionally destroy session for security
            // self::destroySession();
        }
    }
    
    /**
     * Check if user is authenticated
     */
    public static function isAuthenticated(): bool 
    {
        // Check for valid user session
        if (!isset($_SESSION['user']) || !isset($_SESSION['user']['email'])) {
            return false;
        }
        
        $email = $_SESSION['user']['email'];
        
        // Verify domain restriction OR external authorization
        if (!str_ends_with($email, self::ALLOWED_DOMAIN)) {
            // Check if user is in authorized external groups
            try {
                require_once dirname(__DIR__) . '/../staff/src/Services/GoogleAdminService.php';
                $googleAdmin = \GoogleAdminService::getInstance();
                
                // Check both external groups
                if (!$googleAdmin->isUserInGroup($email, 'ganger.com@gangerdermatology.com') &&
                    !$googleAdmin->isUserInGroup($email, 'vinyaconstruction.com@gangerdermatology.com')) {
                    return false;
                }
            } catch (\Exception $e) {
                error_log("UnifiedAuth: Failed to check external group membership: " . $e->getMessage());
                return false;
            }
        }
        
        // Check blocked accounts
        if (in_array($email, self::BLOCKED_ACCOUNTS)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Require authentication or redirect to login
     */
    public static function requireAuth(string $loginUrl = '/staff/'): void 
    {
        if (!self::isAuthenticated()) {
            // Store intended destination for post-login redirect
            $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'] ?? '/';
            
            // Redirect to login
            header("Location: $loginUrl");
            exit;
        }
    }
    
    /**
     * Set authenticated user
     */
    public static function setUser(array $userData): void 
    {
        $_SESSION['user'] = $userData;
        $_SESSION['auth_time'] = time();
        $_SESSION['last_activity'] = time();
        
        // Log authentication event
        self::logAuthEvent('login', $userData['email'] ?? 'unknown');
    }
    
    /**
     * Get current authenticated user
     */
    public static function getUser(): ?array 
    {
        return self::isAuthenticated() ? $_SESSION['user'] : null;
    }
    
    /**
     * Check if user has specific role
     */
    public static function hasRole(string $role): bool 
    {
        if (!self::isAuthenticated()) {
            return false;
        }
        
        $userRole = $_SESSION['user']['role'] ?? 'staff';
        
        // Role hierarchy
        $roles = [
            'staff' => 1,
            'manager' => 2,
            'admin' => 3,
            'super' => 4
        ];
        
        $userLevel = $roles[$userRole] ?? 1;
        $requiredLevel = $roles[$role] ?? 1;
        
        return $userLevel >= $requiredLevel;
    }
    
    /**
     * Destroy session completely
     */
    public static function destroySession(): void 
    {
        // Log logout event before destroying session
        if (isset($_SESSION['user']['email'])) {
            self::logAuthEvent('logout', $_SESSION['user']['email']);
        }
        
        // Clear session data
        $_SESSION = [];
        
        // Destroy session cookie
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
        
        // Destroy the session
        session_destroy();
    }
    
    /**
     * Get client IP address
     */
    private static function getClientIp(): string 
    {
        $keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, 
                    FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Log authentication events
     */
    private static function logAuthEvent(string $event, string $email): void 
    {
        $logData = [
            'event' => $event,
            'email' => $email,
            'ip' => self::getClientIp(),
            'timestamp' => date('Y-m-d H:i:s'),
            'app' => self::$currentApp ?? 'unknown'
        ];
        
        $logMessage = json_encode($logData);
        error_log("[AUTH] $logMessage");
        
        // Optionally write to dedicated auth log
        $logDir = dirname(__DIR__, 2) . '/logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        
        $logFile = $logDir . '/auth_' . date('Y-m') . '.log';
        @file_put_contents($logFile, $logMessage . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Generate CSRF token
     */
    public static function generateCSRFToken(): string 
    {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Verify CSRF token
     */
    public static function verifyCSRFToken(string $token): bool 
    {
        return isset($_SESSION['csrf_token']) && 
               hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Check if system is in migration mode
     */
    public static function isMigrationMode(): bool 
    {
        return self::$migrationMode;
    }
    
    /**
     * Get session info for debugging
     */
    public static function getSessionInfo(): array 
    {
        return [
            'session_name' => session_name(),
            'session_id' => session_id(),
            'is_authenticated' => self::isAuthenticated(),
            'user_email' => $_SESSION['user']['email'] ?? null,
            'migration_mode' => self::$migrationMode,
            'current_app' => self::$currentApp,
            'created_at' => $_SESSION['created_at'] ?? null,
            'last_activity' => $_SESSION['last_activity'] ?? null,
            'migrated_from' => $_SESSION['migrated_from'] ?? null
        ];
    }
}