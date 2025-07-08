import { PurchaseRequestsRepository } from '@ganger/db'
import { createClient } from '@supabase/supabase-js'
import type { PurchaseRequest, CreatePurchaseRequestPayload } from '@ganger/types'

export class PurchaseRequestsAdapter extends PurchaseRequestsRepository {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  async findAll(filters?: {
    status?: string
    department?: string
    requesterEmail?: string
    limit?: number
    offset?: number
  }): Promise<PurchaseRequest[]> {
    let query = this.supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.department) {
      query = query.eq('department', filters.department)
    }
    if (filters?.requesterEmail) {
      query = query.eq('requester_email', filters.requesterEmail)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching purchase requests:', error)
      throw error
    }

    return data || []
  }

  async count(filters?: {
    status?: string
    department?: string
    requesterEmail?: string
  }): Promise<number> {
    let query = this.supabase
      .from('purchase_requests')
      .select('*', { count: 'exact', head: true })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.department) {
      query = query.eq('department', filters.department)
    }
    if (filters?.requesterEmail) {
      query = query.eq('requester_email', filters.requesterEmail)
    }

    const { count, error } = await query

    if (error) {
      console.error('Error counting purchase requests:', error)
      throw error
    }

    return count || 0
  }

  async createWithItems(
    request: CreatePurchaseRequestPayload,
    items: Array<{
      productId: string
      quantity: number
      notes?: string
    }>
  ): Promise<PurchaseRequest> {
    // Start a transaction
    const { data: newRequest, error: requestError } = await this.supabase
      .from('purchase_requests')
      .insert(request)
      .select()
      .single()

    if (requestError) {
      console.error('Error creating purchase request:', requestError)
      throw requestError
    }

    // Create request items
    if (items.length > 0) {
      const requestItems = items.map(item => ({
        purchase_request_id: newRequest.id,
        product_id: item.productId,
        requested_quantity: item.quantity,
        notes: item.notes || null
      }))

      const { error: itemsError } = await this.supabase
        .from('purchase_request_items')
        .insert(requestItems)

      if (itemsError) {
        console.error('Error creating request items:', itemsError)
        // Rollback by deleting the request
        await this.supabase
          .from('purchase_requests')
          .delete()
          .eq('id', newRequest.id)
        throw itemsError
      }
    }

    // Calculate total estimated cost
    const { data: itemsWithPrices } = await this.supabase
      .from('purchase_request_items')
      .select('*, product:standardized_products(*)')
      .eq('purchase_request_id', newRequest.id)

    const totalCost = itemsWithPrices?.reduce((sum, item) => {
      const price = item.product?.default_price || 0
      return sum + (price * item.requested_quantity)
    }, 0) || 0

    // Update request with total cost
    await this.supabase
      .from('purchase_requests')
      .update({ total_estimated_cost: totalCost })
      .eq('id', newRequest.id)

    return { ...newRequest, total_estimated_cost: totalCost }
  }

  async findByIdWithItems(id: string): Promise<PurchaseRequest & { items: any[] }> {
    const { data: request, error: requestError } = await this.supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError) {
      console.error('Error fetching purchase request:', requestError)
      throw requestError
    }

    const { data: items, error: itemsError } = await this.supabase
      .from('purchase_request_items')
      .select('*, product:standardized_products(*)')
      .eq('purchase_request_id', id)

    if (itemsError) {
      console.error('Error fetching request items:', itemsError)
      throw itemsError
    }

    return {
      ...request,
      items: items || []
    }
  }
}