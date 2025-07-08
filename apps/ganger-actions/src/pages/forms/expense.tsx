import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { DollarSign, Plus, X, Upload, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Select } from '@ganger/ui';

const expenseItemSchema = z.object({
  date: z.string(),
  category: z.string(),
  description: z.string(),
  amount: z.number()
});

const expenseSchema = z.object({
  expense_date: z.string().min(1, 'Expense date is required'),
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  category: z.enum(['Travel', 'Supplies', 'Meals', 'Other']),
  description: z.string().min(10, 'Please provide at least 10 characters describing the expense'),
  expense_type: z.string(),
  expense_items: z.array(expenseItemSchema).optional(),
  submitter_name: z.string().min(1, 'Name is required'),
  submitter_email: z.string().email('Valid email is required'),
  receipt_files: z.array(z.instanceof(File)).min(1, 'At least one receipt is required')
});

type ExpenseFormData = z.infer<typeof expenseSchema>;
type ExpenseItem = z.infer<typeof expenseItemSchema>;

const expenseTypeLabels = {
  business_trip: 'Business Trip',
  training: 'Training/Conference',
  supplies: 'Office/Medical Supplies',
  patient_care: 'Patient Care Related',
  other: 'Other'
};

const categoryLabels = {
  travel: 'Travel (Gas, Airfare, etc.)',
  meals: 'Meals & Entertainment',
  supplies: 'Supplies',
  training: 'Training/Education',
  parking: 'Parking/Tolls',
  other: 'Other'
};

export default function ExpenseReimbursementForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { authUser } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Travel',
      submitter_name: authUser?.name || '',
      submitter_email: authUser?.email || ''
    }
  });

  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      date: new Date().toISOString().split('T')[0],
      category: 'other',
      description: '',
      amount: 0
    };
    setExpenseItems([...expenseItems, newItem]);
    setValue('expense_items', [...expenseItems, newItem]);
  };

  const updateExpenseItem = (index: number, field: keyof ExpenseItem, value: any) => {
    const updatedItems = [...expenseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setExpenseItems(updatedItems);
    setValue('expense_items', updatedItems);
  };

  const removeExpenseItem = (index: number) => {
    const updatedItems = expenseItems.filter((_item, i) => i !== index);
    setExpenseItems(updatedItems);
    setValue('expense_items', updatedItems);
  };

  const calculateTotal = () => {
    return expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    setValue('receipt_files', [...uploadedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_file, i) => i !== index);
    setUploadedFiles(newFiles);
    setValue('receipt_files', newFiles);
  };

  const submitRequest = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const formData = {
        title: `Expense Reimbursement - ${expenseTypeLabels[data.expense_type as keyof typeof expenseTypeLabels] || data.expense_type}`,
        description: data.description,
        form_type: 'expense_reimbursement',
        form_data: {
          submitter_name: data.submitter_name,
          submitter_email: data.submitter_email,
          location: authUser?.location || 'Multiple',
          expense_type: data.expense_type,
          expense_date: data.expense_date,
          amount: data.amount,
          category: data.category,
          description: data.description,
          expense_items: data.expense_items,
          total_amount: calculateTotal(),
          receipt_files: uploadedFiles
        }
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
        description: 'Expense reimbursement request submitted successfully!',
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

  const onSubmit = (data: ExpenseFormData) => {
    data.expense_items = expenseItems;
    submitRequest.mutate(data);
  };

  return (
    <DashboardLayout title="Expense Reimbursement">
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Expense Reimbursement</h1>
            </div>
            <p className="text-sm text-gray-600">
              Submit business expenses for reimbursement with receipts.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              {/* Submitter Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Input
                  {...register('submitter_name')}
                  label="Your Name *"
                  placeholder="Enter your full name"
                  error={errors.submitter_name?.message}
                />
                <Input
                  {...register('submitter_email')}
                  type="email"
                  label="Your Email *"
                  placeholder="Enter your email address"
                  error={errors.submitter_email?.message}
                />
              </div>

              {/* Expense Type */}
              <div className="mb-6">
                <Select
                  {...register('expense_type')}
                  label="Expense Type *"
                  options={Object.entries(expenseTypeLabels).map(([value, label]) => ({ value, label }))}
                  error={errors.expense_type?.message}
                />
              </div>

              {/* Payment Method */}
              {/* Payment method removed - not in current schema */}
              <div className="mb-6 hidden">
                <Select
                  {...register('expense_type')}
                  label="Payment Method *"
                  options={[
                    { value: 'personal_card', label: 'Personal Credit/Debit Card' },
                    { value: 'personal_cash', label: 'Personal Cash' },
                    { value: 'company_card', label: 'Company Card' }
                  ]}
                  error={errors.expense_type?.message}
                />
              </div>

              {/* Expense Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Expense Items *
                  </label>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={addExpenseItem}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Item
                  </Button>
                </div>

                {expenseItems.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No expense items added yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Item" to add expense details.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenseItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpenseItem(index)}
                            className="text-red-500 hover:text-red-700 h-auto p-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Date</label>
                            <Input
                              type="date"
                              value={item.date}
                              onChange={(e) => updateExpenseItem(index, 'date', e.target.value)}
                              className="w-full text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Category</label>
                            <Select
                              value={item.category}
                              onChange={(e) => updateExpenseItem(index, 'category', e.target.value)}
                              options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                              className="w-full text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Description</label>
                            <Input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateExpenseItem(index, 'description', e.target.value)}
                              placeholder="Brief description"
                              className="w-full text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Amount ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.amount || ''}
                              onChange={(e) => updateExpenseItem(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="bg-primary-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-primary-900">Total Amount:</span>
                        <span className="text-lg font-bold text-primary-900">${calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                )}
                {errors.expense_items && (
                  <p className="mt-1 text-sm text-red-600">{errors.expense_items.message}</p>
                )}
              </div>

              {/* Business Purpose */}
              <div className="mb-6">
                <label htmlFor="business_purpose" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Purpose *
                </label>
                <textarea
                  id="business_purpose"
                  rows={4}
                  {...register('description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Explain the business purpose of these expenses..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Receipt Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Upload *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload receipts</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Images or PDF files up to 10MB each
                    </p>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Receipts:</h4>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 h-auto p-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="mb-6">
                <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                {/* Additional notes removed - not in current schema */}
                <textarea
                  id="additional_notes"
                  rows={3}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 opacity-50"
                  placeholder="Additional notes feature coming soon..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => router.push('/forms')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}