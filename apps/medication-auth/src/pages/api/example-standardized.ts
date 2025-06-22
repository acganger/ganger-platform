import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { 
  withStandardErrorHandling,
  respondWithSuccess,
  respondWithError,
  transformZodErrors,
  handleMethodNotAllowed,
  ErrorCodes,
  NotFoundError,
  ValidationError
} from '@ganger/utils';
import { withAuth } from '../../lib/auth/middleware';
import { withRateLimit, RateLimits } from '@ganger/utils';

// Example schema for validation
const exampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(0).max(150, 'Age must be between 0 and 150')
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGetExample(req, res);
    case 'POST':
      return handlePostExample(req, res);
    case 'PUT':
      return handlePutExample(req, res);
    case 'DELETE':
      return handleDeleteExample(req, res);
    default:
      return handleMethodNotAllowed(req, res, ['GET', 'POST', 'PUT', 'DELETE']);
  }
}

async function handleGetExample(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  // Simulate database lookup
  if (id === '404') {
    throw new NotFoundError('Example record');
  }
  
  // Simulate successful response with metadata
  const data = {
    id: id || 'example-id',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    created_at: new Date().toISOString()
  };
  
  return respondWithSuccess(res, data, req, 200, {
    performance: {
      duration_ms: 45,
      cached: false
    }
  });
}

async function handlePostExample(req: NextApiRequest, res: NextApiResponse) {
  // Validate request body
  const validation = exampleSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw transformZodErrors(validation.error);
  }
  
  const validatedData = validation.data;
  
  // Simulate creating a record
  const newRecord = {
    id: 'new-example-id',
    ...validatedData,
    created_at: new Date().toISOString()
  };
  
  return respondWithSuccess(res, newRecord, req, 201);
}

async function handlePutExample(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    throw new ValidationError([{
      field: 'id',
      message: 'ID is required in URL path',
      code: 'missing_required_parameter'
    }]);
  }
  
  // Validate request body
  const validation = exampleSchema.partial().safeParse(req.body);
  
  if (!validation.success) {
    throw transformZodErrors(validation.error);
  }
  
  // Simulate updating a record
  const updatedRecord = {
    id,
    ...validation.data,
    updated_at: new Date().toISOString()
  };
  
  return respondWithSuccess(res, updatedRecord, req, 200);
}

async function handleDeleteExample(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    return respondWithError(
      res,
      'ID is required for deletion',
      400,
      ErrorCodes.MISSING_REQUIRED_FIELD,
      req,
      { field: 'id' }
    );
  }
  
  // Simulate deletion
  return respondWithSuccess(res, { 
    deleted: true, 
    id,
    deleted_at: new Date().toISOString() 
  }, req, 200);
}

// Apply middleware in proper order:
// 1. Standard error handling (outermost)
// 2. Authentication
// 3. Rate limiting
// 4. Handler (innermost)
export default withStandardErrorHandling(
  withAuth(
    withRateLimit(handler, RateLimits.STANDARD)
  )
);
// Cloudflare Workers Edge Runtime
