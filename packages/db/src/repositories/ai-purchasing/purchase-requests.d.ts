import { BaseRepository } from '../../utils/base-repository';
import type { PurchaseRequest, PurchaseRequestItem, RequestStatus, UrgencyLevel, CreatePurchaseRequestPayload } from '@ganger/types';
import { z } from 'zod';
export declare const purchaseRequestItemSchema: z.ZodObject<{
    standardized_product_id: z.ZodOptional<z.ZodString>;
    product_name: z.ZodString;
    requested_quantity: z.ZodNumber;
    unit_of_measure: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    vendor_sku: z.ZodOptional<z.ZodString>;
    clinical_specifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    unit_of_measure: string;
    product_name: string;
    requested_quantity: number;
    notes?: string | undefined;
    standardized_product_id?: string | undefined;
    vendor_sku?: string | undefined;
    clinical_specifications?: string[] | undefined;
}, {
    unit_of_measure: string;
    product_name: string;
    requested_quantity: number;
    notes?: string | undefined;
    standardized_product_id?: string | undefined;
    vendor_sku?: string | undefined;
    clinical_specifications?: string[] | undefined;
}>;
export declare const createPurchaseRequestSchema: z.ZodObject<{
    department: z.ZodOptional<z.ZodString>;
    request_type: z.ZodEnum<["consolidated_order", "shopping_cart", "manual_entry", "recurring_order"]>;
    urgency: z.ZodDefault<z.ZodOptional<z.ZodEnum<["routine", "urgent", "emergency"]>>>;
    notes: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        standardized_product_id: z.ZodOptional<z.ZodString>;
        product_name: z.ZodString;
        requested_quantity: z.ZodNumber;
        unit_of_measure: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
        vendor_sku: z.ZodOptional<z.ZodString>;
        clinical_specifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        unit_of_measure: string;
        product_name: string;
        requested_quantity: number;
        notes?: string | undefined;
        standardized_product_id?: string | undefined;
        vendor_sku?: string | undefined;
        clinical_specifications?: string[] | undefined;
    }, {
        unit_of_measure: string;
        product_name: string;
        requested_quantity: number;
        notes?: string | undefined;
        standardized_product_id?: string | undefined;
        vendor_sku?: string | undefined;
        clinical_specifications?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    request_type: "consolidated_order" | "shopping_cart" | "manual_entry" | "recurring_order";
    urgency: "emergency" | "routine" | "urgent";
    items: {
        unit_of_measure: string;
        product_name: string;
        requested_quantity: number;
        notes?: string | undefined;
        standardized_product_id?: string | undefined;
        vendor_sku?: string | undefined;
        clinical_specifications?: string[] | undefined;
    }[];
    notes?: string | undefined;
    department?: string | undefined;
}, {
    request_type: "consolidated_order" | "shopping_cart" | "manual_entry" | "recurring_order";
    items: {
        unit_of_measure: string;
        product_name: string;
        requested_quantity: number;
        notes?: string | undefined;
        standardized_product_id?: string | undefined;
        vendor_sku?: string | undefined;
        clinical_specifications?: string[] | undefined;
    }[];
    notes?: string | undefined;
    department?: string | undefined;
    urgency?: "emergency" | "routine" | "urgent" | undefined;
}>;
export declare class PurchaseRequestsRepository extends BaseRepository<PurchaseRequest> {
    constructor();
    createRequest(userEmail: string, userName: string, userId: string | undefined, payload: CreatePurchaseRequestPayload): Promise<PurchaseRequest>;
    findByRequester(requesterEmail: string, status?: RequestStatus): Promise<PurchaseRequest[]>;
    findByDepartment(department: string, status?: RequestStatus): Promise<PurchaseRequest[]>;
    findPendingApproval(): Promise<PurchaseRequest[]>;
    updateStatus(requestId: string, status: RequestStatus, additionalData?: {
        approved_by_email?: string;
        approved_by_id?: string;
        notes?: string;
    }): Promise<PurchaseRequest>;
    getRequestWithItems(requestId: string): Promise<{
        request: PurchaseRequest;
        items: PurchaseRequestItem[];
    } | null>;
    calculateTotalCost(requestId: string): Promise<number>;
    findByDateRange(startDate: string, endDate: string, status?: RequestStatus): Promise<PurchaseRequest[]>;
    getAnalyticsSummary(days?: number): Promise<{
        total_requests: number;
        total_value: number;
        average_value: number;
        by_status: Record<RequestStatus, number>;
        by_urgency: Record<UrgencyLevel, number>;
        by_department: Record<string, number>;
    }>;
    addItem(item: Omit<PurchaseRequestItem, 'id' | 'created_at' | 'updated_at'>): Promise<PurchaseRequestItem>;
}
