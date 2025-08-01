import { NextApiRequest, NextApiResponse } from 'next';
export interface AuthenticatedRequest extends NextApiRequest {
    user?: {
        id: string;
        email: string;
        role: string;
        department?: string;
        locations?: string[];
        active: boolean;
    };
}
export interface AuthMiddlewareOptions {
    roles?: string[];
    permissions?: string[];
    requireHIPAA?: boolean;
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
}
export declare class AuthenticationError extends Error {
    constructor(message?: string);
}
export declare class AuthorizationError extends Error {
    constructor(message?: string);
}
export declare class HIPAAComplianceError extends Error {
    constructor(message?: string);
}
export declare function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>, options?: AuthMiddlewareOptions): (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
export declare function withStaffAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>): (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
export declare function withManagerAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>): (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
export declare function withAdminAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>): (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
export declare function withHIPAACompliance(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>): (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
export declare function withRateLimitedAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>, rateLimit: {
    windowMs: number;
    maxRequests: number;
}): (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
//# sourceMappingURL=apiAuth.d.ts.map