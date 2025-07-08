import { z } from 'zod'
import { NextResponse } from 'next/server'

// Common schemas
export const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val)),
  limit: z.string().optional().default('20').transform(val => Math.min(parseInt(val), 100))
})

export const idSchema = z.string().uuid('Invalid ID format')

// Purchase request schemas
export const createPurchaseRequestSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  urgency: z.enum(['routine', 'urgent', 'emergency']).default('routine'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive('Quantity must be positive')
  })).min(1, 'At least one item is required')
})

export const updatePurchaseRequestSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'ordered']).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive()
  })).optional()
})

// Product schemas
export const searchProductsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  vendorId: z.string().uuid().optional(),
  inStock: z.enum(['true', 'false']).optional().transform(val => val ? val === 'true' : undefined)
})

// Vendor schemas
export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contact_email: z.string().email('Invalid email format'),
  contact_phone: z.string().optional(),
  website: z.string().url().optional(),
  payment_terms: z.string().optional(),
  delivery_days: z.number().positive().optional()
})

// Cart schemas
export const cartInterceptorSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  cartData: z.object({
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
      sku: z.string().optional()
    })),
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    total: z.number().nonnegative()
  })
})

// Validation helpers
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: z.infer<typeof schema> } | { success: false; error: NextResponse } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated as z.infer<typeof schema> }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        )
      }
    }
    
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      )
    }
  }
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}