export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Filter, Target, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Select } from '@ganger/ui';

const impactFilterSchema = z.object({
  submitter_name: z.string().min(1, 'Name is required'),
  submitter_email: z.string().email('Valid email is required'),
  goal: z.string().min(20, 'Please provide at least 20 characters describing the goal'),
  context: z.string().min(20, 'Please provide at least 20 characters of context'),
  success_definition: z.string().min(10, 'Please define what success looks like'),
  tradeoffs: z.string().min(10, 'Please describe potential tradeoffs'),
  participants: z.string().min(1, 'Please specify who should be involved'),
  timeframe: z.enum(['immediate', 'this_week', 'this_month', 'this_quarter', 'this_year', 'future'])
});

type ImpactFilterFormData = z.infer<typeof impactFilterSchema>;

const timeframeLabels = {
  immediate: 'Immediate (Today/Tomorrow)',
  this_week: 'This Week',
  this_month: 'This Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
  future: 'Future Planning'
};

export default function ImpactFilterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { authUser } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<ImpactFilterFormData>({
    resolver: zodResolver(impactFilterSchema),
    defaultValues: {
      submitter_name: authUser?.name || '',
      submitter_email: authUser?.email || '',
      timeframe: 'this_month'
    }
  });

  const submitRequest = useMutation({
    mutationFn: async (data: ImpactFilterFormData) => {
      const formData = {
        title: `Impact Filter - ${data.goal.substring(0, 50)}...`,
        description: data.goal,
        form_type: 'impact_filter',
        form_data: {
          ...data,
          location: authUser?.location || 'Multiple'
        },
        priority: 'high' // Impact filters are strategic decisions
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Impact filter submitted successfully!',
        variant: 'success'
      });
      router.push('/tickets');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'error'
      });
    }
  });

  const onSubmit = (data: ImpactFilterFormData) => {
    submitRequest.mutate(data);
  };

  return (
    <DashboardLayout title="Impact Filter">
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Filter className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Impact Filter</h1>
            </div>
            <p className="text-sm text-gray-600">
              Use this tool to evaluate major decisions and their potential impacts.
            </p>
          </div>

          {/* Impact Filter Explanation */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Target className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">What is an Impact Filter?</p>
                <p className="mb-2">An impact filter helps evaluate important decisions by:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Clarifying the goal and desired outcome</li>
                  <li>Understanding the context and constraints</li>
                  <li>Defining what success looks like</li>
                  <li>Identifying potential tradeoffs</li>
                  <li>Determining who needs to be involved</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Hidden fields for submitter info */}
              <input type="hidden" {...register('submitter_name')} />
              <input type="hidden" {...register('submitter_email')} />

              {/* Goal */}
              <div className="mb-6">
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                  What is the goal or decision to be made? *
                </label>
                <textarea
                  id="goal"
                  rows={3}
                  {...register('goal')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Clearly describe the goal or decision that needs to be made..."
                />
                {errors.goal && (
                  <p className="mt-1 text-sm text-red-600">{errors.goal.message}</p>
                )}
              </div>

              {/* Context */}
              <div className="mb-6">
                <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
                  What is the context? *
                </label>
                <textarea
                  id="context"
                  rows={4}
                  {...register('context')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Provide background information, current situation, and why this is important now..."
                />
                {errors.context && (
                  <p className="mt-1 text-sm text-red-600">{errors.context.message}</p>
                )}
              </div>

              {/* Success Definition */}
              <div className="mb-6">
                <label htmlFor="success_definition" className="block text-sm font-medium text-gray-700 mb-2">
                  What does success look like? *
                </label>
                <textarea
                  id="success_definition"
                  rows={3}
                  {...register('success_definition')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Define measurable outcomes that would indicate success..."
                />
                {errors.success_definition && (
                  <p className="mt-1 text-sm text-red-600">{errors.success_definition.message}</p>
                )}
              </div>

              {/* Tradeoffs */}
              <div className="mb-6">
                <label htmlFor="tradeoffs" className="block text-sm font-medium text-gray-700 mb-2">
                  What are the potential tradeoffs? *
                </label>
                <div className="flex items-start mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                  <p className="text-xs text-gray-600">Consider what might be sacrificed or what risks exist</p>
                </div>
                <textarea
                  id="tradeoffs"
                  rows={3}
                  {...register('tradeoffs')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List potential downsides, risks, or things that might be compromised..."
                />
                {errors.tradeoffs && (
                  <p className="mt-1 text-sm text-red-600">{errors.tradeoffs.message}</p>
                )}
              </div>

              {/* Participants */}
              <div className="mb-6">
                <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-2">
                  Who should be involved? *
                </label>
                <textarea
                  id="participants"
                  rows={2}
                  {...register('participants')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List key stakeholders, decision makers, or people who need to be consulted..."
                />
                {errors.participants && (
                  <p className="mt-1 text-sm text-red-600">{errors.participants.message}</p>
                )}
              </div>

              {/* Timeframe */}
              <div className="mb-6">
                <Select
                  {...register('timeframe')}
                  label="Timeframe *"
                  options={Object.entries(timeframeLabels).map(([value, label]) => ({ value, label }))}
                  error={errors.timeframe?.message}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/forms')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Impact Filter'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}