// lib/services/health-check-service.ts
import axios, { AxiosRequestConfig } from 'axios';

export interface Integration {
  id: string;
  name: string;
  base_url: string | null;
  health_check_endpoint: string | null;
  auth_type: string;
  auth_config: any;
  timeout_seconds: number;
  expected_response_codes: number[];
  health_check_method?: string;
  health_check_body?: string | null;
  custom_headers?: any;
}

export interface HealthCheckResult {
  isSuccessful: boolean;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
}

export class HealthCheckService {
  async performHealthCheck(integration: Integration): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Validate required fields
      if (!integration.base_url && !integration.health_check_endpoint) {
        return {
          isSuccessful: false,
          healthStatus: 'critical',
          responseTime: 0,
          statusCode: null,
          responseBody: null,
          error: 'No base URL or health check endpoint configured'
        };
      }

      // Prepare request configuration
      const config = await this.buildRequestConfig(integration);
      
      // Perform the health check with timeout
      const response = await axios({
        ...config,
        timeout: integration.timeout_seconds * 1000,
        validateStatus: (status) => integration.expected_response_codes.includes(status)
      });

      const responseTime = Date.now() - startTime;
      const healthStatus = this.evaluateHealthStatus(response, responseTime, integration);

      return {
        isSuccessful: true,
        healthStatus,
        responseTime,
        statusCode: response.status,
        responseBody: typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data),
        error: null
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const healthStatus = this.evaluateErrorHealthStatus(error, integration);

      return {
        isSuccessful: false,
        healthStatus,
        responseTime,
        statusCode: error.response?.status || null,
        responseBody: null,
        error: this.getErrorMessage(error)
      };
    }
  }

  private async buildRequestConfig(integration: Integration): Promise<AxiosRequestConfig> {
    const config: AxiosRequestConfig = {
      method: (integration.health_check_method || 'GET') as any,
      url: this.buildHealthCheckUrl(integration),
      headers: {
        'User-Agent': 'Ganger-Platform-Monitor/1.0',
        ...this.parseCustomHeaders(integration.custom_headers)
      }
    };

    // Add authentication
    if (integration.auth_type !== 'none') {
      await this.addAuthentication(config, integration);
    }

    // Add request body if specified
    if (integration.health_check_body && config.method !== 'GET') {
      config.data = integration.health_check_body;
      if (!config.headers!['Content-Type']) {
        config.headers!['Content-Type'] = 'application/json';
      }
    }

    return config;
  }

  private buildHealthCheckUrl(integration: Integration): string {
    const baseUrl = integration.base_url?.replace(/\/$/, '') || '';
    const endpoint = integration.health_check_endpoint || '';
    
    // If endpoint is a full URL, use it directly
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // If no base URL but has endpoint, assume endpoint is the full URL
    if (!baseUrl && endpoint) {
      return endpoint.startsWith('/') ? `https://${endpoint.substring(1)}` : endpoint;
    }
    
    // Combine base URL and endpoint
    if (baseUrl && endpoint) {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `${baseUrl}${cleanEndpoint}`;
    }
    
    // Just base URL
    return baseUrl || 'http://localhost';
  }

  private async addAuthentication(config: AxiosRequestConfig, integration: Integration): Promise<void> {
    const authConfig = integration.auth_config;
    
    if (!authConfig) return;

    try {
      switch (integration.auth_type) {
        case 'api_key':
          const apiKey = authConfig.api_key || authConfig.key;
          if (authConfig.api_key_location === 'header' || !authConfig.api_key_location) {
            config.headers![authConfig.api_key_header || 'X-API-Key'] = apiKey;
          } else {
            config.params = { ...config.params, [authConfig.api_key_param || 'api_key']: apiKey };
          }
          break;

        case 'bearer':
          const token = authConfig.token || authConfig.access_token;
          config.headers!['Authorization'] = `Bearer ${token}`;
          break;

        case 'basic':
          const username = authConfig.username;
          const password = authConfig.password;
          if (username && password) {
            config.auth = { username, password };
          }
          break;

        case 'oauth':
          // For OAuth, use the access token if available
          const accessToken = authConfig.access_token || authConfig.token;
          if (accessToken) {
            config.headers!['Authorization'] = `Bearer ${accessToken}`;
          }
          break;

        default:
      }
    } catch (error) {
      // Continue without authentication rather than failing the check
    }
  }

  private evaluateHealthStatus(
    response: any, 
    responseTime: number, 
    integration: Integration
  ): 'healthy' | 'warning' | 'critical' {
    // Check response time - consider >5s as warning, >10s as critical
    if (responseTime > 10000) {
      return 'critical';
    }
    if (responseTime > 5000) {
      return 'warning';
    }

    // Check response content if specified
    if (integration.auth_config?.expected_response_content) {
      const responseText = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
        
      if (!responseText.includes(integration.auth_config.expected_response_content)) {
        return 'warning';
      }
    }

    return 'healthy';
  }

  private evaluateErrorHealthStatus(
    error: any, 
    _integration: Integration
  ): 'healthy' | 'warning' | 'critical' {
    // Network errors are critical
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' ||
        error.message?.includes('timeout')) {
      return 'critical';
    }

    // Server errors (5xx) are critical
    if (error.response?.status >= 500) {
      return 'critical';
    }

    // Authentication errors might be warnings or critical depending on service
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'warning';
    }

    // Client errors (4xx) are generally warnings
    if (error.response?.status >= 400) {
      return 'warning';
    }

    // Unknown errors are critical
    return 'critical';
  }

  private parseCustomHeaders(customHeaders: any): Record<string, string> {
    if (!customHeaders) return {};
    
    try {
      if (typeof customHeaders === 'string') {
        return JSON.parse(customHeaders);
      }
      if (typeof customHeaders === 'object') {
        return customHeaders;
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  private getErrorMessage(error: any): string {
    if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    }
    if (error.request) {
      return `Network error: ${error.message}`;
    }
    return error.message || 'Unknown error occurred';
  }

  // Method to test authentication configuration
  async testAuthentication(integration: Integration): Promise<boolean> {
    try {
      const result = await this.performHealthCheck(integration);
      return result.isSuccessful && result.statusCode !== 401 && result.statusCode !== 403;
    } catch (error) {
      return false;
    }
  }

  // Method to validate integration configuration
  validateIntegrationConfig(integration: Partial<Integration>): string[] {
    const errors: string[] = [];

    if (!integration.name) {
      errors.push('Integration name is required');
    }

    if (!integration.base_url && !integration.health_check_endpoint) {
      errors.push('Either base_url or health_check_endpoint is required');
    }

    if (!integration.auth_type) {
      errors.push('Authentication type is required');
    }

    if (integration.auth_type !== 'none' && !integration.auth_config) {
      errors.push('Authentication configuration is required for non-none auth types');
    }

    if (integration.timeout_seconds && integration.timeout_seconds < 1) {
      errors.push('Timeout must be at least 1 second');
    }

    if (integration.expected_response_codes && integration.expected_response_codes.length === 0) {
      errors.push('At least one expected response code must be specified');
    }

    return errors;
  }
}