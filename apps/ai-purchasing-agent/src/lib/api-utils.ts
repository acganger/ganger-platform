import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message
  }
  
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details
  }
  
  return NextResponse.json(response, { status })
}

export function handleDatabaseError(error: any): NextResponse {
  console.error('Database error:', error)
  
  if (error.code === '23505') {
    return createErrorResponse('Duplicate entry', 409)
  }
  
  if (error.code === '23503') {
    return createErrorResponse('Referenced entity not found', 400)
  }
  
  return createErrorResponse('Database operation failed', 500)
}

export function handleApiError(error: any): NextResponse {
  console.error('API error:', error)
  
  if (error instanceof Error) {
    return createErrorResponse(
      process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : error.message,
      500
    )
  }
  
  return createErrorResponse('An unexpected error occurred', 500)
}

// ID generation utility
export function generateRequestId(prefix: string = 'PR'): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${randomPart}`
}