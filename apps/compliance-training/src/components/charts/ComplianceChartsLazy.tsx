'use client'

import dynamic from 'next/dynamic';
import { Card } from '../ui/ComponentWrappers';
import type { Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

interface ComplianceChartsProps {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
}

// Lazy load the heavy chart component
const ComplianceChartsContent = dynamic(
  () => import('./ComplianceCharts').then(mod => ({ default: mod.ComplianceCharts })),
  {
    ssr: false,
    loading: () => (
      <Card>
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading charts...</span>
          </div>
        </div>
      </Card>
    )
  }
);

export function ComplianceChartsLazy(props: ComplianceChartsProps) {
  return <ComplianceChartsContent {...props} />;
}