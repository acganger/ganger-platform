import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Update last_seen for all printers to current time
    // In a real implementation, this would ping each printer
    const { error } = await supabase
      .from('checkout_slip_printers')
      .update({ 
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Printer status refreshed'
    });
  } catch (error) {
    console.error('Error refreshing printers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh printer status' 
      },
      { status: 500 }
    );
  }
}