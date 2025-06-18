import Link from 'next/link';
// import { format, formatDistanceToNow } from 'date-fns';
import { 
  ClockIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon
} from '@/components/icons';
import type { Authorization, AuthorizationStatus, AuthorizationPriority } from '@/types';

interface AuthorizationCardProps {
  authorization: Authorization;
}

export function AuthorizationCard({ authorization }: AuthorizationCardProps) {
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
      low: { className: 'priority-low', label: 'Low Priority' },
      medium: { className: 'priority-medium', label: 'Medium Priority' },
      high: { className: 'priority-high', label: 'High Priority' },
      urgent: { className: 'priority-urgent', label: 'Urgent Priority' },
    };

    const config = priorityConfig[priority];
    return (
      <div className="flex items-center space-x-2">
        <div className={config.className} title={config.label}></div>
        <span className="text-xs text-gray-500 capitalize">{priority}</span>
      </div>
    );
  };

  const getCardClassName = () => {
    if (authorization.priority === 'urgent') {
      return 'auth-card-urgent';
    }
    if (authorization.status === 'processing') {
      return 'auth-card-processing';
    }
    return 'auth-card';
  };

  const getEstimatedCompletion = () => {
    if (authorization.estimated_processing_time && authorization.processing_started_at) {
      const startTime = new Date(authorization.processing_started_at);
      const estimatedEndTime = new Date(startTime.getTime() + authorization.estimated_processing_time * 60 * 60 * 1000);
      // return formatDistanceToNow(estimatedEndTime, { addSuffix: true });
      return `${Math.round((estimatedEndTime.getTime() - Date.now()) / 60000)} min remaining`;
    }
    return null;
  };

  return (
    <div className={getCardClassName()}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getStatusBadge(authorization.status)}
            {authorization.ai_confidence_score && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                AI: {Math.round(authorization.ai_confidence_score * 100)}%
              </span>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Authorization #{authorization.id.slice(-8)}
          </h3>
          <p className="text-sm text-gray-500">
            Created {new Date(authorization.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex-shrink-0">
          {getPriorityIndicator(authorization.priority)}
        </div>
      </div>

      {/* Patient Info */}
      <div className="flex items-center space-x-2 mb-3">
        <UserIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">
          Patient ID: {authorization.patient_id}
        </span>
      </div>

      {/* Medication Info */}
      <div className="flex items-center space-x-2 mb-3">
        <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">
          Medication ID: {authorization.medication_id}
        </span>
      </div>

      {/* Processing Time */}
      {authorization.status === 'processing' && (
        <div className="flex items-center space-x-2 mb-4">
          <ClockIcon className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-700">
            {getEstimatedCompletion() || 'Processing...'}
          </span>
        </div>
      )}

      {/* Real-time indicator for processing status */}
      {authorization.status === 'processing' && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="realtime-indicator">
            <div className="realtime-dot"></div>
            <span className="ml-2 text-xs text-green-600">Live updates</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Link
            href={`/track/${authorization.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <EyeIcon className="w-3 h-3 mr-1" />
            View
          </Link>
          
          {(authorization.status === 'draft' || authorization.status === 'pending_info') && (
            <Link
              href={`/create/${authorization.id}`}
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="w-3 h-3 mr-1" />
              Edit
            </Link>
          )}
        </div>

        {/* Last updated */}
        <span className="text-xs text-gray-400">
          Updated {new Date(authorization.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}