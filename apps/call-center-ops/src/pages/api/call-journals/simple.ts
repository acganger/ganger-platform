import type { NextApiRequest, NextApiResponse } from 'next';

// Mock journal entries data
const mockJournalEntries = [
  {
    id: '1',
    call_record_id: '1',
    call_id: 'call_001',
    agent_email: 'sarah.johnson@gangerdermatology.com',
    agent_name: 'Sarah Johnson',
    journal_status: 'approved',
    call_summary: 'Patient called requesting appointment for annual skin check. Scheduled with Dr. Ganger for next Tuesday.',
    detailed_notes: 'Patient mentioned family history of skin cancer and wanted to establish regular screening schedule. Discussed importance of annual checks and provided educational materials.',
    patient_concern: 'Annual skin check, family history concerns',
    resolution_provided: 'Scheduled appointment for comprehensive skin examination. Provided educational materials about skin cancer prevention.',
    action_items: ['Send pre-appointment instructions', 'Include dermoscopy in exam', 'Schedule follow-up reminder'],
    follow_up_required: true,
    follow_up_date: '2025-01-14',
    follow_up_notes: 'Call patient day before appointment to confirm',
    escalation_reason: null,
    call_tags: ['appointment', 'skin_check', 'prevention', 'family_history'],
    quality_notes: 'Excellent patient interaction, thorough information gathering',
    compliance_notes: 'HIPAA compliant, proper verification completed',
    reviewed_by: 'supervisor@gangerdermatology.com',
    reviewed_at: '2025-01-07T15:30:00Z',
    approved_by: 'manager@gangerdermatology.com',
    approved_at: '2025-01-07T16:00:00Z',
    created_at: '2025-01-07T14:35:00Z',
    updated_at: '2025-01-07T16:00:00Z'
  },
  {
    id: '2',
    call_record_id: '2', 
    call_id: 'call_002',
    agent_email: 'mike.chen@gangerdermatology.com',
    agent_name: 'Mike Chen',
    journal_status: 'reviewed',
    call_summary: 'Patient inquiry about prescription refill for topical medication.',
    detailed_notes: 'Patient ran out of tretinoin cream prescribed 3 months ago. Confirmed patient identity and reviewed medication history.',
    patient_concern: 'Prescription refill needed',
    resolution_provided: 'Verified prescription history and submitted refill request to provider. Patient informed of 24-48 hour processing time.',
    action_items: ['Provider review required', 'Pharmacy notification'],
    follow_up_required: true,
    follow_up_date: '2025-01-09',
    follow_up_notes: 'Confirm prescription was filled successfully',
    escalation_reason: null,
    call_tags: ['prescription', 'refill', 'dermatology'],
    quality_notes: 'Good protocol adherence, proper verification steps followed',
    compliance_notes: 'Patient identity verified per protocol',
    reviewed_by: 'supervisor@gangerdermatology.com',
    reviewed_at: '2025-01-07T17:15:00Z',
    approved_by: null,
    approved_at: null,
    created_at: '2025-01-07T16:20:00Z',
    updated_at: '2025-01-07T17:15:00Z'
  },
  {
    id: '3',
    call_record_id: '3',
    call_id: 'call_003',
    agent_email: 'lisa.williams@gangerdermatology.com',
    agent_name: 'Lisa Williams',
    journal_status: 'submitted',
    call_summary: 'Patient called with concern about new mole, requesting urgent consultation.',
    detailed_notes: 'Patient described new dark mole on back that has changed size and color over past month. Expressed anxiety about potential malignancy.',
    patient_concern: 'New suspicious mole, urgent evaluation needed',
    resolution_provided: 'Scheduled urgent appointment for this week. Provided reassurance and instructions for monitoring.',
    action_items: ['Priority appointment scheduling', 'Dermoscopy preparation', 'Patient education materials'],
    follow_up_required: true,
    follow_up_date: '2025-01-10',
    follow_up_notes: 'Call to confirm appointment and address any concerns',
    escalation_reason: 'Urgent medical concern requiring prompt evaluation',
    call_tags: ['urgent', 'mole', 'suspicious_lesion', 'priority'],
    quality_notes: 'Appropriate urgency assessment, good patient communication',
    compliance_notes: 'Urgent care protocol followed correctly',
    reviewed_by: null,
    reviewed_at: null,
    approved_by: null,
    approved_at: null,
    created_at: '2025-01-07T13:50:00Z',
    updated_at: '2025-01-07T13:50:00Z'
  }
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { 
      call_ids, 
      agent, 
      status, 
      page = '1', 
      limit = '25',
      start_date,
      end_date
    } = req.query;

    let filteredEntries = [...mockJournalEntries];

    // Filter by specific call IDs
    if (call_ids && typeof call_ids === 'string') {
      const callIdList = call_ids.split(',').filter(id => id.trim());
      if (callIdList.length > 0) {
        filteredEntries = filteredEntries.filter(entry => 
          callIdList.includes(entry.call_record_id)
        );
      }
    }

    // Filter by agent
    if (agent && agent !== 'all') {
      filteredEntries = filteredEntries.filter(entry => 
        entry.agent_email === agent
      );
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredEntries = filteredEntries.filter(entry => 
        entry.journal_status === status
      );
    }

    // Filter by date range
    if (start_date) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.created_at >= start_date + 'T00:00:00Z'
      );
    }

    if (end_date) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.created_at <= end_date + 'T23:59:59Z'
      );
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: paginatedEntries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredEntries.length,
        totalPages: Math.ceil(filteredEntries.length / limitNum)
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  } 
  else if (req.method === 'POST') {
    try {
      const journalData = req.body;
      
      // Basic validation
      if (!journalData.call_record_id || !journalData.call_summary) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Call record ID and summary are required'
          }
        });
      }

      // Check if journal already exists for this call
      const existingJournal = mockJournalEntries.find(entry => 
        entry.call_record_id === journalData.call_record_id
      );

      if (existingJournal) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_JOURNAL',
            message: 'Journal entry already exists for this call'
          }
        });
      }

      // Create new journal entry
      const newJournal = {
        id: (mockJournalEntries.length + 1).toString(),
        ...journalData,
        journal_status: 'submitted',
        reviewed_by: null,
        reviewed_at: null,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockJournalEntries.push(newJournal);

      res.status(201).json({
        success: true,
        data: newJournal,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message: 'Failed to create journal entry'
        }
      });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}