import type { NextApiRequest, NextApiResponse } from 'next';


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'healthy',
    app: 'checkin-kiosk',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      kiosk: 'operational',
      payment_processing: 'ready',
      touch_interface: 'active'
    }
  });
}