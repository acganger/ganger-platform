import { NextApiRequest, NextApiResponse } from 'next';

export class ApiError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ApiErrors = {
  validation: (message: string) => new ApiError(400, message),
  unauthorized: (message: string) => new ApiError(401, message),
  forbidden: (message: string) => new ApiError(403, message),
  notFound: (message: string) => new ApiError(404, message),
  database: (message: string) => new ApiError(500, `Database error: ${message}`),
  internal: (message: string) => new ApiError(500, `Internal server error: ${message}`)
};

export function sendError(res: NextApiResponse, error: ApiError | Error) {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    error: message,
    statusCode
  });
}

export function sendSuccess(res: NextApiResponse, data: any, statusCode = 200) {
  res.status(statusCode).json(data);
}

export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof ApiError) {
        sendError(res, error);
      } else if (error instanceof Error) {
        sendError(res, new ApiError(500, error.message));
      } else {
        sendError(res, new ApiError(500, 'An unexpected error occurred'));
      }
    }
  };
}