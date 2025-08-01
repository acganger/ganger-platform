import { NextRequest, NextResponse } from 'next/server';
export interface AuthUser {
    id: string;
    email: string;
    role: string;
    department?: string;
    locations?: string[];
    active: boolean;
}
export interface AuthMiddlewareOptions {
    roles?: string[];
    permissions?: string[];
    requireHIPAA?: boolean;
}
export type AuthenticatedHandler = (request: NextRequest, context: {
    user: AuthUser;
    params?: any;
}) => Promise<NextResponse> | NextResponse;
export declare function withAuth(handler: AuthenticatedHandler, options?: AuthMiddlewareOptions): (request: NextRequest, context?: any) => Promise<NextResponse<unknown>>;
export declare function withStaffAuth(handler: AuthenticatedHandler): (request: NextRequest, context?: any) => Promise<NextResponse<unknown>>;
export declare function withManagerAuth(handler: AuthenticatedHandler): (request: NextRequest, context?: any) => Promise<NextResponse<unknown>>;
export declare function withAdminAuth(handler: AuthenticatedHandler): (request: NextRequest, context?: any) => Promise<NextResponse<unknown>>;
export declare function withSuperAdminAuth(handler: AuthenticatedHandler): (request: NextRequest, context?: any) => Promise<NextResponse<unknown>>;
export declare function withHIPAACompliance(handler: AuthenticatedHandler): (request: NextRequest, context?: any) => Promise<NextResponse<unknown>>;
export declare function createAuthenticatedRoute(handlers: {
    GET?: AuthenticatedHandler;
    POST?: AuthenticatedHandler;
    PUT?: AuthenticatedHandler;
    PATCH?: AuthenticatedHandler;
    DELETE?: AuthenticatedHandler;
}, options?: AuthMiddlewareOptions): any;
//# sourceMappingURL=appRouterAuth.d.ts.map