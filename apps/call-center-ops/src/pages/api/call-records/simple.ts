import type { NextApiRequest, NextApiResponse } from 'next';

// Mock data for development
const mockCallRecords = [
  {
    id: '1',
    call_id: 'call_001',
    caller_phone: '(555) 123-4567',
    caller_name: 'John Doe',
    patient_id: 'PAT001',
    call_direction: 'inbound' as const,
    call_status: 'completed' as const,
    location: 'Ann Arbor' as const,
    call_start_time: new Date(Date.now() - 3600000).toISOString(),
    call_answer_time: new Date(Date.now() - 3595000).toISOString(),
    call_end_time: new Date(Date.now() - 3300000).toISOString(),
    ring_duration_seconds: 5,
    talk_duration_seconds: 295,
    call_outcome: 'appointment_scheduled',
    customer_satisfaction_score: 5,
    quality_score: 95,
    patient_mrn: 'MRN001',
    appointment_scheduled: true,
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointment_type: 'consultation',
    provider_requested: 'Dr. Smith',
    first_call_resolution: true,
    escalation_required: false,
    complaint_call: false,
    follow_up_required: false,
    recording_available: true,
    recording_url: '/recordings/call_001.mp3',
    recording_reviewed: false,
    after_call_work_seconds: 60,
    hold_time_seconds: 0,
    transfer_count: 0,
    call_priority: 'normal' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    call_id: 'call_002',
    caller_phone: '(555) 987-6543',
    caller_name: 'Jane Smith',
    patient_id: 'PAT002',
    call_direction: 'inbound' as const,
    call_status: 'completed' as const,
    location: 'Wixom' as const,
    call_start_time: new Date(Date.now() - 7200000).toISOString(),
    call_answer_time: new Date(Date.now() - 7195000).toISOString(),
    call_end_time: new Date(Date.now() - 7020000).toISOString(),
    ring_duration_seconds: 5,
    talk_duration_seconds: 175,
    call_outcome: 'information_provided',
    customer_satisfaction_score: 4,
    quality_score: 88,
    patient_mrn: 'MRN002',
    appointment_scheduled: false,
    first_call_resolution: true,
    escalation_required: false,
    complaint_call: false,
    follow_up_required: true,
    follow_up_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    recording_available: true,
    recording_url: '/recordings/call_002.mp3',
    recording_reviewed: true,
    after_call_work_seconds: 45,
    hold_time_seconds: 15,
    transfer_count: 0,
    call_priority: 'normal' as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString()
  }
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { 
      page = '1', 
      limit = '25', 
      location, 
      agent, 
      search,
      start_date,
      end_date,
      sort = 'call_start_time:desc'
    } = req.query;

    let filteredRecords = [...mockCallRecords];

    // Apply filters
    if (location && location !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.location === location);
    }

    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredRecords = filteredRecords.filter(record => 
        record.caller_name?.toLowerCase().includes(searchTerm) ||
        record.caller_phone.includes(searchTerm) ||
        record.call_outcome?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: paginatedRecords,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredRecords.length,
        totalPages: Math.ceil(filteredRecords.length / limitNum)
      }
    };

    res.status(200).json(response);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}