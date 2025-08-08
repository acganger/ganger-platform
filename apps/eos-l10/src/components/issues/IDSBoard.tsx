import React from 'react';
import { Issue } from '@/types/eos';
import IssueCard from './IssueCard';
import { Button } from '@ganger/ui';
import { 
  Eye, 
  MessageCircle, 
  CheckCircle, 
  X,
  Plus,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';

interface IDSBoardProps {
  issuesByStatus: {
    identified: Issue[];
    discussing: Issue[];
    solved: Issue[];
    dropped: Issue[];
  };
  onUpdateIssue: (issueId: string, updates: Partial<Issue>) => void;
  onSelectIssue: (issue: Issue) => void;
}

const statusConfig = {
  identified: {
    title: 'Identify',
    description: 'New issues identified',
    icon: Eye,
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700'
  },
  discussing: {
    title: 'Discuss',
    description: 'Issues being discussed',
    icon: MessageCircle,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  solved: {
    title: 'Solve',
    description: 'Issues resolved',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  },
  dropped: {
    title: 'Dropped',
    description: 'Issues no longer relevant',
    icon: X,
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-500'
  }
};

export default function IDSBoard({ issuesByStatus, onUpdateIssue, onSelectIssue }: IDSBoardProps) {
  const handleMoveIssue = (issueId: string, newStatus: Issue['status'], currentStatus: Issue['status']) => {
    const updates: Partial<Issue> = { status: newStatus };

    // Add solved timestamp if moving to solved
    if (newStatus === 'solved' && currentStatus !== 'solved') {
      updates.solved_at = new Date().toISOString();
    }

    onUpdateIssue(issueId, updates);
  };

  const renderColumn = (status: keyof typeof issuesByStatus) => {
    const config = statusConfig[status];
    const issues = issuesByStatus[status];
    const Icon = config.icon;

    return (
      <div key={status} className="flex-1 min-w-0">
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg h-full flex flex-col`}>
          {/* Column Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon className={`h-4 w-4 ${config.textColor}`} />
                <h3 className={`font-medium ${config.textColor}`}>
                  {config.title}
                </h3>
                <span className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-600">
                  {issues.length}
                </span>
              </div>
              <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded">
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">{config.description}</p>
          </div>

          {/* Issues List */}
          <div className="flex-1 p-3 space-y-3 min-h-32">
            {issues.map((issue) => (
              <div key={issue.id} className="relative group">
                <IssueCard
                  issue={issue}
                  onUpdate={onUpdateIssue}
                  onClick={() => onSelectIssue(issue)}
                  compact
                />
                
                {/* Status Change Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    {status !== 'discussing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveIssue(issue.id, 'discussing', status)}
                        title="Move to Discuss"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                    {status !== 'solved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveIssue(issue.id, 'solved', status)}
                        title="Mark as Solved"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    {status !== 'dropped' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveIssue(issue.id, 'dropped', status)}
                        title="Drop Issue"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

                {/* Empty State */}
                {issues.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Icon className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      {status === 'identified' && 'No new issues'}
                      {status === 'discussing' && 'No active discussions'}
                      {status === 'solved' && 'No solved issues'}
                      {status === 'dropped' && 'No dropped issues'}
                    </p>
                    {status === 'identified' && (
                      <button className="mt-2 text-xs text-eos-600 hover:text-eos-700 flex items-center">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Issue
                      </button>
                    )}
                  </div>
                )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-x-auto">
        <div className="flex space-x-4 p-4 min-w-max h-full">
          {Object.keys(statusConfig).map(status => 
            renderColumn(status as keyof typeof issuesByStatus)
          )}
        </div>
      </div>
    </div>
  );
}