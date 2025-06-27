'use client'

import { useState, useEffect } from 'react';
import { 
  Badge, 
  Button, 
  LoadingSpinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@ganger/ui';
import { Clock, User, Printer, FileText, RotateCcw } from 'lucide-react';
import { PrintJob } from '../types';

export default function RecentPrintJobs() {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrintJobs();
  }, []);

  const loadPrintJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/print/jobs?limit=10');
      
      if (!response.ok) {
        throw new Error('Failed to load print jobs');
      }
      
      const data = await response.json();
      setPrintJobs(data.data || []);
    } catch (err) {
      console.error('Error loading print jobs:', err);
      setError('Failed to load recent print jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = async (jobId: string) => {
    try {
      const response = await fetch(`/api/print/jobs/${jobId}/reprint`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Reprint failed');
      }
      
      // Refresh the jobs list
      loadPrintJobs();
    } catch (err) {
      console.error('Reprint error:', err);
      setError('Failed to reprint job');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'printing':
        return <Badge variant="outline"><Printer className="h-3 w-3 mr-1" />Printing</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSlipTypeIcon = (slipType: string) => {
    switch (slipType) {
      case 'medical':
        return '🏥';
      case 'cosmetic':
        return '💉';
      case 'self_pay':
        return '💳';
      default:
        return '📄';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadPrintJobs} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (printJobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No print jobs found</p>
        <Button onClick={loadPrintJobs} variant="outline" size="sm" className="mt-2">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium">Recent Print Jobs</h4>
          <Badge variant="outline">{printJobs.length} jobs</Badge>
        </div>
        <Button onClick={loadPrintJobs} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Printer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date/Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {printJobs.map((job) => {
              const { date, time } = formatDateTime(job.createdAt);
              return (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{job.patientName}</div>
                        <div className="text-sm text-gray-500">{job.providerName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSlipTypeIcon(job.slipType)}</span>
                      <span className="capitalize">{job.slipType.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Printer className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm">{job.printerName}</div>
                        <div className="text-xs text-gray-500">{job.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{date}</div>
                      <div className="text-gray-500">{time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReprint(job.id)}
                      disabled={job.status === 'printing'}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reprint
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p><strong>Note:</strong> Print jobs are retained for 30 days. Failed jobs can be reprinted with the same settings.</p>
      </div>
    </div>
  );
}