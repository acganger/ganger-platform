/**
 * Mock Health Check Utilities
 * Provides the same interface as @ganger/utils/health-check for development
 */

import { NextApiRequest, NextApiResponse } from 'next';

interface ServiceEndpoints {
  [serviceName: string]: string;
}

export function createHealthCheckEndpoint(serviceName: string, endpoints: ServiceEndpoints) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const healthChecks = await Promise.allSettled(
      Object.entries(endpoints).map(async ([name, url]) => {
        try {
          // Mock health check - simulate checking each endpoint
          const isHealthy = Math.random() > 0.1; // 90% success rate
          const responseTime = Math.floor(Math.random() * 500) + 50; // 50-550ms
          
          return {
            name,
            url,
            status: isHealthy ? 'healthy' : 'unhealthy',
            responseTime,
            lastChecked: new Date().toISOString(),
            error: isHealthy ? null : 'Mock connection timeout'
          };
        } catch (error) {
          return {
            name,
            url,
            status: 'unhealthy',
            responseTime: null,
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const results = healthChecks.map((result) => 
      result.status === 'fulfilled' ? result.value : {
        name: 'unknown',
        status: 'error',
        error: 'Failed to check'
      }
    );

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded';

    return res.status(200).json({
      service: serviceName,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
      metadata: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      }
    });
  };
}

export function createDatabaseStatsEndpoint() {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Mock database statistics
    const stats = {
      connections: {
        active: Math.floor(Math.random() * 10) + 5,
        idle: Math.floor(Math.random() * 20) + 10,
        total: Math.floor(Math.random() * 30) + 15
      },
      performance: {
        averageQueryTime: Math.floor(Math.random() * 100) + 50,
        slowQueries: Math.floor(Math.random() * 5),
        cacheHitRatio: (Math.random() * 0.2 + 0.8).toFixed(3) // 80-100%
      },
      storage: {
        totalSize: '2.4 GB',
        dataSize: '1.8 GB',
        indexSize: '0.6 GB',
        availableSpace: '15.2 GB'
      },
      tables: {
        authorization_requests: {
          rowCount: Math.floor(Math.random() * 10000) + 5000,
          sizeOnDisk: '125 MB',
          lastAnalyzed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        patients: {
          rowCount: Math.floor(Math.random() * 5000) + 2000,
          sizeOnDisk: '89 MB',
          lastAnalyzed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        medications: {
          rowCount: Math.floor(Math.random() * 20000) + 15000,
          sizeOnDisk: '245 MB',
          lastAnalyzed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      replication: {
        status: 'active',
        lag: Math.floor(Math.random() * 100) + 'ms',
        lastSync: new Date(Date.now() - Math.random() * 60 * 1000).toISOString()
      }
    };

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      database: 'medication-auth-db',
      ...stats
    });
  };
}

// Mock rate limiting utilities
export const RateLimits = {
  MONITORING: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  API: {
    windowMs: 15 * 60 * 1000,
    max: 1000
  },
  AUTH: {
    windowMs: 15 * 60 * 1000,
    max: 5 // stricter limit for auth endpoints
  },
  STANDARD: {
    windowMs: 15 * 60 * 1000,
    max: 500
  },
  AI_PROCESSING: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50 // stricter limit for AI endpoints
  }
};

export function withRateLimit(handler: Function, limits: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Mock rate limiting - always allow for development
    console.log('Mock rate limiting applied:', limits);
    return handler(req, res);
  };
}