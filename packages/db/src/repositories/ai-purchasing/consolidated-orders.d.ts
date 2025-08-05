import { BaseRepository } from '../../utils/base-repository';
import type { ConsolidatedOrder, ConsolidatedOrderItem, ConsolidatedOrderStatus, CreateConsolidatedOrderPayload, StandardizedProduct } from '@ganger/types';
import { z } from 'zod';
export declare const consolidatedOrderItemSchema: z.ZodObject<{
    standardized_product_id: z.ZodString;
    requested_quantity: z.ZodNumber;
    justification: z.ZodOptional<z.ZodString>;
    urgency_level: z.ZodDefault<z.ZodOptional<z.ZodEnum<["routine", "urgent"]>>>;
}, "strip", z.ZodTypeAny, {
    standardized_product_id: string;
    requested_quantity: number;
    urgency_level: "routine" | "urgent";
    justification?: string | undefined;
}, {
    standardized_product_id: string;
    requested_quantity: number;
    justification?: string | undefined;
    urgency_level?: "routine" | "urgent" | undefined;
}>;
export declare const createConsolidatedOrderSchema: z.ZodObject<{
    department: z.ZodString;
    urgency: z.ZodDefault<z.ZodOptional<z.ZodEnum<["routine", "urgent", "emergency"]>>>;
    notes: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        standardized_product_id: z.ZodString;
        requested_quantity: z.ZodNumber;
        justification: z.ZodOptional<z.ZodString>;
        urgency_level: z.ZodDefault<z.ZodOptional<z.ZodEnum<["routine", "urgent"]>>>;
    }, "strip", z.ZodTypeAny, {
        standardized_product_id: string;
        requested_quantity: number;
        urgency_level: "routine" | "urgent";
        justification?: string | undefined;
    }, {
        standardized_product_id: string;
        requested_quantity: number;
        justification?: string | undefined;
        urgency_level?: "routine" | "urgent" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    department: string;
    urgency: "emergency" | "routine" | "urgent";
    items: {
        standardized_product_id: string;
        requested_quantity: number;
        urgency_level: "routine" | "urgent";
        justification?: string | undefined;
    }[];
    notes?: string | undefined;
}, {
    department: string;
    items: {
        standardized_product_id: string;
        requested_quantity: number;
        justification?: string | undefined;
        urgency_level?: "routine" | "urgent" | undefined;
    }[];
    notes?: string | undefined;
    urgency?: "emergency" | "routine" | "urgent" | undefined;
}>;
export declare class ConsolidatedOrdersRepository extends BaseRepository<ConsolidatedOrder> {
    constructor();
    createOrder(userEmail: string, userName: string, userId: string | undefined, payload: CreateConsolidatedOrderPayload): Promise<ConsolidatedOrder>;
    findByDepartment(department: string, status?: ConsolidatedOrderStatus): Promise<ConsolidatedOrder[]>;
    findDraftOrders(userEmail: string): Promise<ConsolidatedOrder[]>;
    getOrderWithItems(orderId: string): Promise<{
        order: ConsolidatedOrder;
        items: Array<ConsolidatedOrderItem & {
            product?: StandardizedProduct;
        }>;
    } | null>;
    submitOrder(orderId: string): Promise<ConsolidatedOrder>;
    updateStatus(orderId: string, status: ConsolidatedOrderStatus, additionalData?: {
        total_estimated_savings?: number;
        notes?: string;
    }): Promise<ConsolidatedOrder>;
    addItemToOrder(orderId: string, item: Omit<ConsolidatedOrderItem, 'id' | 'consolidated_order_id' | 'created_at' | 'updated_at'>): Promise<ConsolidatedOrderItem>;
    updateOrderItem(itemId: string, updates: Partial<Pick<ConsolidatedOrderItem, 'requested_quantity' | 'optimized_quantity' | 'justification' | 'urgency_level'>>): Promise<ConsolidatedOrderItem>;
    removeItemFromOrder(itemId: string): Promise<void>;
    getFrequentlyOrderedProducts(department: string, limit?: number): Promise<Array<{
        product: StandardizedProduct;
        order_count: number;
        average_quantity: number;
        last_ordered: string;
    }>>;
    createTemplateOrder(department: string): Promise<ConsolidatedOrder>;
    findAll(): Promise<ConsolidatedOrder[]>;
    findWithFilters(filters: any, limit: number, offset: number): Promise<ConsolidatedOrder[]>;
    getItems(orderId: string): Promise<ConsolidatedOrderItem[]>;
    addItem(item: Omit<ConsolidatedOrderItem, 'id' | 'created_at' | 'updated_at'>): Promise<ConsolidatedOrderItem>;
}
