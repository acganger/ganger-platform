import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get all configured printers
    const { data: printers, error } = await supabase
      .from('checkout_slip_printers')
      .select('*')
      .order('location', { ascending: true });

    if (error) {
      throw error;
    }

    // Check printer status by pinging each one
    const printersWithStatus = await Promise.all(
      (printers || []).map(async (printer) => {
        try {
          // In a real implementation, you would ping the printer
          // For now, we'll simulate status based on last_seen
          const lastSeen = new Date(printer.last_seen);
          const now = new Date();
          const minutesSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
          
          let status = 'online';
          if (minutesSinceLastSeen > 10) {
            status = 'offline';
          }
          
          return {
            id: printer.id,
            name: printer.name,
            model: printer.model,
            ip: printer.ip_address,
            location: printer.location,
            status,
            lastSeen: printer.last_seen
          };
        } catch (err) {
          return {
            id: printer.id,
            name: printer.name,
            model: printer.model,
            ip: printer.ip_address,
            location: printer.location,
            status: 'error',
            lastSeen: printer.last_seen
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: printersWithStatus
    });
  } catch (error) {
    console.error('Error fetching printers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch printers' 
      },
      { status: 500 }
    );
  }
}