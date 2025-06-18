import Link from 'next/link';
// import { format, formatDistanceToNow } from 'date-fns';
import { EyeIcon, PencilIcon } from '@/components/icons';
import type { Authorization, AuthorizationStatus, AuthorizationPriority } from '@/types';

interface AuthorizationListViewProps {
  authorizations: Authorization[];
}

export function AuthorizationListView({ authorizations }: AuthorizationListViewProps) {
  const getStatusBadge = (status: AuthorizationStatus) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'status-badge-draft' },
      submitted: { label: 'Submitted', className: 'status-badge-submitted' },
      processing: { label: 'Processing', className: 'status-badge-processing' },
      pending_info: { label: 'Pending Info', className: 'status-badge-pending' },
      approved: { label: 'Approved', className: 'status-badge-approved' },
      denied: { label: 'Denied', className: 'status-badge-denied' },
      expired: { label: 'Expired', className: 'status-badge-expired' },
      cancelled: { label: 'Cancelled', className: 'status-badge-cancelled' },
    };

    const config = statusConfig[status];
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityIndicator = (priority: AuthorizationPriority) => {
    const priorityConfig = {
      low: { className: 'priority-low' },
      medium: { className: 'priority-medium' },
      high: { className: 'priority-high' },
      urgent: { className: 'priority-urgent' },
    };

    return <div className={priorityConfig[priority].className}></div>;
  };

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Authorization
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Medication
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              AI Score
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {authorizations.map((authorization) => (
            <tr 
              key={authorization.id} 
              className={`hover:bg-gray-50 ${
                authorization.priority === 'urgent' ? 'bg-red-50' : ''
              }`}
            >
              {/* Authorization ID */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {authorization.status === 'processing' && (
                    <div className="realtime-dot mr-2"></div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{authorization.id.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(authorization.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </td>

              {/* Patient */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {authorization.patient_id}
                </div>
              </td>

              {/* Medication */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {authorization.medication_id}
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(authorization.status)}
              </td>

              {/* Priority */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {getPriorityIndicator(authorization.priority)}
                  <span className="text-sm text-gray-700 capitalize">
                    {authorization.priority}
                  </span>
                </div>
              </td>

              {/* Created Date */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(authorization.created_at).toLocaleDateString()}
              </td>

              {/* AI Confidence Score */}
              <td className="px-6 py-4 whitespace-nowrap">
                {authorization.ai_confidence_score ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    authorization.ai_confidence_score > 0.8
                      ? 'ai-confidence-high'
                      : authorization.ai_confidence_score > 0.6
                      ? 'ai-confidence-medium'
                      : 'ai-confidence-low'
                  }`}>
                    {Math.round(authorization.ai_confidence_score * 100)}%
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">N/A</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Link
                    href={`/track/${authorization.id}`}
                    className="inline-flex items-center p-1 border border-transparent rounded text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="View Details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  
                  {(authorization.status === 'draft' || authorization.status === 'pending_info') && (
                    <Link
                      href={`/create/${authorization.id}`}
                      className="inline-flex items-center p-1 border border-transparent rounded text-blue-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Edit Authorization"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}