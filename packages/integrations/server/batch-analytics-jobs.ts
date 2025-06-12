// Simplified batch analytics service for monorepo stability
import { supabaseAdmin } from '@ganger/db';

interface BatchRecord {
  id: string;
  has_discrepancies: boolean;
  extracted_total: number;
  verified_total: number;
  pdf_parsing_status: string;
  location: string;
  batch_date: Date;
  created_at: Date;
}

interface DailyAnalytics {
  date: Date;
  location: string;
  total_reports: number;
  total_discrepancies: number;
  discrepancy_rate: number;
  average_amount: number;
  successful_parsing_rate: number;
}

export class BatchAnalyticsJobs {
  async calculateDailyAnalytics(date: Date, location: string): Promise<DailyAnalytics> {
    // Simplified implementation - can be enhanced later
    const { data: reports } = await supabaseAdmin
      .from('batch_reports')
      .select('*')
      .eq('location', location)
      .gte('created_at', date.toISOString())
      .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const totalReports = reports?.length || 0;
    const discrepancies = reports?.filter(r => r.has_discrepancies).length || 0;

    return {
      date,
      location,
      total_reports: totalReports,
      total_discrepancies: discrepancies,
      discrepancy_rate: totalReports > 0 ? discrepancies / totalReports : 0,
      average_amount: 0, // TODO: Calculate from reports
      successful_parsing_rate: 1.0 // TODO: Calculate from parsing status
    };
  }

  async generateReport(analytics: DailyAnalytics): Promise<void> {
    // Store analytics in database
    const { error } = await supabaseAdmin
      .from('batch_analytics')
      .insert({
        date: analytics.date.toISOString(),
        location: analytics.location,
        total_reports: analytics.total_reports,
        total_discrepancies: analytics.total_discrepancies,
        discrepancy_rate: analytics.discrepancy_rate,
        average_amount: analytics.average_amount,
        successful_parsing_rate: analytics.successful_parsing_rate
      });

    if (error) {
      console.error('Failed to store analytics:', error);
      throw error;
    }
  }
}