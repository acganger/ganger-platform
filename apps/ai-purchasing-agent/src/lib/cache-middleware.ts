import { NextRequest, NextResponse } from 'next/server'
import { cacheManager } from '@ganger/cache'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  key?: (req: NextRequest) => string
}

export function withCache(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (request: NextRequest, context?: any) => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return handler(request, context)
    }
    
    const { ttl = 300, key: keyGenerator } = options
    
    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(request)
      : `api:${request.nextUrl.pathname}:${request.nextUrl.search}`
    
    try {
      // Try to get from cache
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        const response = NextResponse.json(cached)
        response.headers.set('X-Cache', 'HIT')
        return response
      }
    } catch (error) {
      console.warn('Cache read error:', error)
    }
    
    // Call the original handler
    const response = await handler(request, context)
    
    // Only cache successful responses
    if (response.status === 200) {
      try {
        const data = await response.json()
        await cacheManager.set(cacheKey, data, ttl)
        
        // Return new response with cache headers
        const cachedResponse = NextResponse.json(data)
        cachedResponse.headers.set('X-Cache', 'MISS')
        cachedResponse.headers.set('Cache-Control', `private, max-age=${ttl}`)
        return cachedResponse
      } catch (error) {
        console.warn('Cache write error:', error)
        return response
      }
    }
    
    return response
  }
}