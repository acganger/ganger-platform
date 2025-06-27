import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'healthy',
    app: 'deployment-helper',
    purpose: 'Build and cache all packages',
    timestamp: new Date().toISOString(),
    packages: [
      '@ganger/auth',
      '@ganger/cache',
      '@ganger/config',
      '@ganger/db',
      '@ganger/docs',
      '@ganger/integrations',
      '@ganger/monitoring',
      '@ganger/types',
      '@ganger/ui',
      '@ganger/utils'
    ]
  });
}