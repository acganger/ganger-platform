'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useStaffAuth } from '@ganger/auth/staff';
import { withAuthComponent } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  Card, 
  Button, 
  DataTable,
  Select,
  Input,
  LoadingSpinner,
  Modal
} from '@ganger/ui';
import { formatCallDuration } from '../../lib/utils';

// Temporary local implementations until @ganger/utils is available
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString();
const formatDuration = formatCallDuration;
import type { CallRecord, JournalEntry, DashboardFilters, PaginatedResponse } from '../../types';

interface CallHistoryData {
  calls: CallRecord[];
  journals: { [callId: string]: JournalEntry };
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function CallHistoryPage() {
  const { user, profile } = useStaffAuth();
  const [data, setData] = useState<CallHistoryData>({
    calls: [],
    journals: {},
    isLoading: true,
    pagination: {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0
    }
  });
  
  const [filters, setFilters] = useState<DashboardFilters>({
    location: '',
    period: '7d',
    agent: (profile?.role === 'staff') ? user?.email || '' : '',
    dateRange: {
      start: '',
      end: ''
    }
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'call_start_time',
    direction: 'desc'
  });

  useEffect(() => {
    loadCallHistory();
  }, [filters, data.pagination.page, sortConfig, searchQuery]);

  const loadCallHistory = async () => {
    setData(prev => ({ ...prev, isLoading: true }));
    
    try {
      const params = new URLSearchParams({
        page: data.pagination.page.toString(),
        limit: data.pagination.limit.toString(),
        sort: `${sortConfig.key}:${sortConfig.direction}`,
        ...(filters.location && { location: filters.location }),
        ...(filters.agent && { agent: filters.agent }),
        ...(searchQuery && { search: searchQuery }),
        ...(filters.dateRange?.start && { start_date: filters.dateRange.start }),
        ...(filters.dateRange?.end && { end_date: filters.dateRange.end })
      });

      const [callsRes, journalsRes] = await Promise.all([
        fetch(`/api/call-records/simple?${params}`),
        fetch(`/api/call-journals/simple?call_ids=${data.calls.map(c => c.id).join(',')}`)
      ]);

      const callsData: PaginatedResponse<CallRecord> = await callsRes.json();
      const journalsData = await journalsRes.json();

      // Create journal lookup by call_record_id
      const journalLookup: { [callId: string]: JournalEntry } = {};
      if (journalsData.data) {
        journalsData.data.forEach((journal: JournalEntry) => {
          journalLookup[journal.call_record_id] = journal;
        });
      }

      setData({
        calls: callsData.data || [],
        journals: journalLookup,
        isLoading: false,
        pagination: callsData.pagination || data.pagination
      });
    } catch (error) {
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Reset to first page when filters change
    setData(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: 1 }
    }));
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page: number) => {
    setData(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  };

  const viewCallDetails = (call: CallRecord) => {
    setSelectedCall(call);
    setShowCallModal(true);
  };

  const exportCalls = async () => {
    try {
      const exportParams: Record<string, string> = {
        format: 'csv',
        search: searchQuery
      };
      
      if (filters.location) exportParams.location = filters.location;
      if (filters.period) exportParams.period = filters.period;
      if (filters.agent) exportParams.agent = filters.agent;
      
      const params = new URLSearchParams(exportParams);
      
      const response = await fetch(`/api/call-records/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
    }
  };

  const callColumns = [
    {
      key: 'call_start_time',
      header: 'Date/Time',
      sortable: true,
      render: (row: CallRecord) => (
        <div>
          <div className="font-medium">{formatDate(row.call_start_time)}</div>
          <div className="text-sm text-neutral-500">{formatTime(row.call_start_time)}</div>
        </div>
      )
    },
    {
      key: 'caller_name',
      header: 'Caller',
      sortable: true,
      render: (row: CallRecord) => (
        <div>
          <div className="font-medium">{row.caller_name || 'Unknown'}</div>
          <div className="text-sm text-neutral-500">{row.caller_phone}</div>
        </div>
      )
    },
    {
      key: 'call_direction',
      header: 'Direction',
      render: (row: CallRecord) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          row.call_direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.call_direction === 'inbound' ? '📞 Inbound' : '📱 Outbound'}
        </span>
      )
    },
    {
      key: 'call_outcome',
      header: 'Outcome',
      render: (row: CallRecord) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          row.call_outcome === 'appointment_scheduled' ? 'bg-green-100 text-green-800' :
          row.call_outcome === 'information_provided' ? 'bg-blue-100 text-blue-800' :
          row.call_outcome === 'transfer_required' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.call_outcome?.replace('_', ' ') || 'No outcome'}
        </span>
      )
    },
    {
      key: 'talk_duration_seconds',
      header: 'Duration',
      sortable: true,
      render: (row: CallRecord) => formatDuration(row.talk_duration_seconds || 0)
    },
    {
      key: 'quality_score',
      header: 'Quality',
      sortable: true,
      render: (row: CallRecord) => (
        row.quality_score ? (
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              row.quality_score >= 90 ? 'bg-green-500' :
              row.quality_score >= 80 ? 'bg-blue-500' :
              row.quality_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">{row.quality_score}%</span>
          </div>
        ) : (
          <span className="text-neutral-400">Not scored</span>
        )
      )
    },
    {
      key: 'journal_status',
      header: 'Journal',
      render: (row: CallRecord) => {
        const journal = data.journals[row.id];
        if (!journal) {
          return (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.href = `/calls/journal?call_id=${row.id}`}
            >
              Create Journal
            </Button>
          );
        }
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            journal.journal_status === 'approved' ? 'bg-green-100 text-green-800' :
            journal.journal_status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
            journal.journal_status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {journal.journal_status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: CallRecord) => (
        <div className="flex space-x-1">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => viewCallDetails(row)}
          >
            👁️
          </Button>
          {row.recording_available && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(row.recording_url, '_blank')}
            >
              🎵
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Call History" 
        subtitle="View and manage call records and journals"
        actions={
          <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={exportCalls}
          >
            📊 Export
          </Button>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/calls/journal'}
          >
            📝 New Journal
          </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              options={[
                { value: 'all', label: 'All Locations' },
                { value: 'ann_arbor', label: 'Ann Arbor' },
                { value: 'wixom', label: 'Wixom' },
                { value: 'plymouth', label: 'Plymouth' }
              ]}
              placeholder="Location"
            />
            
            {(profile?.role === 'admin' || profile?.role === 'staff') && (
              <Select
                value={filters.agent || ''}
                onChange={(e) => handleFilterChange('agent', e.target.value)}
                options={[
                  { value: 'all', label: 'All Agents' },
                ]}
                placeholder="Agent"
              />
            )}
            
            <Select
              value={filters.period || ''}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              options={[
                { value: 'today', label: 'Today' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' }
              ]}
            />
            
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  location: '',
                  period: '7d',
                  agent: (profile?.role === 'staff') ? user?.email || '' : '',
                  dateRange: { start: '', end: '' }
                });
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Call History Table */}
        <Card className="p-6">
          {data.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <DataTable
              data={data.calls}
              columns={callColumns}
              onSort={handleSort}
              sortBy={sortConfig.key}
              sortDirection={sortConfig.direction}
            />
          )}
        </Card>
      </div>

      {/* Call Details Modal */}
      <Modal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        title="Call Details"
        size="lg"
      >
        {selectedCall && (
          <CallDetailsView 
            call={selectedCall}
            journal={data.journals[selectedCall.id]}
            onClose={() => setShowCallModal(false)}
          />
        )}
      </Modal>
    </AppLayout>
  );
}

// Call Details Component
function CallDetailsView({ 
  call, 
  journal, 
  onClose 
}: { 
  call: CallRecord;
  journal?: JournalEntry;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Call Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-neutral-900 mb-2">Call Information</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Date/Time:</strong> {formatDate(call.call_start_time)} at {formatTime(call.call_start_time)}</div>
            <div><strong>Caller:</strong> {call.caller_name || 'Unknown'} ({call.caller_phone})</div>
            <div><strong>Direction:</strong> {call.call_direction}</div>
            <div><strong>Location:</strong> {call.location}</div>
            <div><strong>Duration:</strong> {formatDuration(call.talk_duration_seconds || 0)}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-neutral-900 mb-2">Call Outcome</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {call.call_status}</div>
            <div><strong>Outcome:</strong> {call.call_outcome || 'No outcome recorded'}</div>
            <div><strong>Quality Score:</strong> {call.quality_score ? `${call.quality_score}%` : 'Not scored'}</div>
            <div><strong>First Call Resolution:</strong> {call.first_call_resolution ? 'Yes' : 'No'}</div>
            <div><strong>Follow-up Required:</strong> {call.follow_up_required ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      {call.patient_mrn && (
        <div>
          <h4 className="font-medium text-neutral-900 mb-2">Patient Information</h4>
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Patient MRN:</strong> {call.patient_mrn}</div>
              <div><strong>Appointment Scheduled:</strong> {call.appointment_scheduled ? 'Yes' : 'No'}</div>
              {call.appointment_date && (
                <div><strong>Appointment Date:</strong> {formatDate(call.appointment_date)}</div>
              )}
              {call.provider_requested && (
                <div><strong>Provider Requested:</strong> {call.provider_requested}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call Journal */}
      {journal ? (
        <div>
          <h4 className="font-medium text-neutral-900 mb-2">Call Journal</h4>
          <div className="bg-neutral-50 p-4 rounded-lg space-y-3">
            <div>
              <strong>Summary:</strong>
              <p className="mt-1 text-sm">{journal.call_summary}</p>
            </div>
            
            {journal.detailed_notes && (
              <div>
                <strong>Detailed Notes:</strong>
                <p className="mt-1 text-sm">{journal.detailed_notes}</p>
              </div>
            )}
            
            {journal.patient_concern && (
              <div>
                <strong>Patient Concern:</strong>
                <p className="mt-1 text-sm">{journal.patient_concern}</p>
              </div>
            )}
            
            {journal.resolution_provided && (
              <div>
                <strong>Resolution Provided:</strong>
                <p className="mt-1 text-sm">{journal.resolution_provided}</p>
              </div>
            )}
            
            {journal.call_tags.length > 0 && (
              <div>
                <strong>Tags:</strong>
                <div className="mt-1 flex flex-wrap gap-1">
                  {journal.call_tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm text-neutral-500 pt-2 border-t">
              <span>Status: {journal.journal_status}</span>
              <span>Submitted: {formatDate(journal.created_at)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-amber-800">No journal entry found for this call.</p>
          <Button 
            size="sm" 
            variant="primary" 
            className="mt-2"
            onClick={() => window.location.href = `/calls/journal?call_id=${call.id}`}
          >
            Create Journal Entry
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {call.recording_available && (
          <Button 
            variant="outline"
            onClick={() => window.open(call.recording_url, '_blank')}
          >
            🎵 Play Recording
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default withAuthComponent(CallHistoryPage, {
  requiredRoles: ['staff', 'manager', 'superadmin']
});