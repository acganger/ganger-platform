import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { DollarSign, Plus, X, Upload, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const expenseItemSchema = z.object({
  date: z.string(),
  category: z.enum(['travel', 'meals', 'supplies', 'training', 'parking', 'other']),
  description: z.string(),
  amount: z.number().positive()
});

const expenseSchema = z.object({
  expense_type: z.enum(['business_trip', 'training', 'supplies', 'patient_care', 'other']),
  payment_method: z.enum(['personal_card', 'personal_cash', 'company_card']),
  expense_items: z.array(expenseItemSchema).min(1, 'Please add at least one expense item'),
  business_purpose: z.string().min(10, 'Please provide at least 10 characters explaining the business purpose'),
  receipts: z.array(z.instanceof(File)).optional(),
  additional_notes: z.string().optional()
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
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_type: 'business_trip',
      payment_method: 'personal_card',
      expense_items: []
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
    const updatedItems = expenseItems.filter((_, i) => i !== index);
    setExpenseItems(updatedItems);
    setValue('expense_items', updatedItems);
  };

  const calculateTotal = () => {
    return expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitRequest = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const formData = {
        title: `Expense Reimbursement - ${expenseTypeLabels[data.expense_type]}`,
        description: data.business_purpose,
        form_type: 'expense_reimbursement',
        form_data: {
          expense_type: data.expense_type,
          payment_method: data.payment_method,
          expense_items: data.expense_items,
          total_amount: calculateTotal(),
          business_purpose: data.business_purpose,
          additional_notes: data.additional_notes || null
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
              {/* Expense Type */}
              <div className="mb-6">
                <label htmlFor="expense_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Type *
                </label>
                <select
                  id="expense_type"
                  {...register('expense_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(expenseTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.expense_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.expense_type.message}</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  id="payment_method"
                  {...register('payment_method')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="personal_card">Personal Credit/Debit Card</option>
                  <option value="personal_cash">Personal Cash</option>
                  <option value="company_card">Company Card</option>
                </select>
                {errors.payment_method && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
                )}
              </div>

              {/* Expense Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Expense Items *
                  </label>
                  <button
                    type="button"
                    onClick={addExpenseItem}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
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
                          <button
                            type="button"
                            onClick={() => removeExpenseItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Date</label>
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => updateExpenseItem(index, 'date', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Category</label>
                            <select
                              value={item.category}
                              onChange={(e) => updateExpenseItem(index, 'category', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              {Object.entries(categoryLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateExpenseItem(index, 'description', e.target.value)}
                              placeholder="Brief description"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Amount ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount || ''}
                              onChange={(e) => updateExpenseItem(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  {...register('business_purpose')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Explain the business purpose of these expenses..."
                />
                {errors.business_purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.business_purpose.message}</p>
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
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
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
                <textarea
                  id="additional_notes"
                  rows={3}
                  {...register('additional_notes')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any additional information..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/forms')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}