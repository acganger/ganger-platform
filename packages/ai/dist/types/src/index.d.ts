export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: string;
    };
}
export declare const ErrorCodes: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly SYNC_FAILED: "SYNC_FAILED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
};
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
//# sourceMappingURL=index.d.ts.map