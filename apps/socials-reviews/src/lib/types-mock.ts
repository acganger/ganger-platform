// Mock types for @ganger/types package
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

// Re-export all types
export * from '@/types';