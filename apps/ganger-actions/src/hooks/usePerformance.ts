import { useEffect } from 'react';
import { usePerformanceTracking, trackWebVitals } from '@ganger/monitoring/performance-tracking';
import { useRouter } from 'next/router';

export function useAppPerformance() {
  const router = useRouter();
  
  // Track web vitals on mount
  useEffect(() => {
    trackWebVitals();
  }, []);
  
  // Track route changes
  useEffect(() => {
    const handleStart = (url: string) => {
      performance.mark(`route-change-start:${url}`);
    };
    
    const handleComplete = (url: string) => {
      if (performance.getEntriesByName(`route-change-start:${url}`, 'mark').length > 0) {
        performance.measure(
          `route-change:${url}`,
          `route-change-start:${url}`
        );
        
        const measure = performance.getEntriesByName(`route-change:${url}`, 'measure')[0];
        if (measure && measure.duration > 1000) {
          console.warn(`Slow route change to ${url}: ${measure.duration}ms`);
        }
      }
    };
    
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
    };
  }, [router]);
}

// Component-specific performance tracking
export function useComponentPerformance(componentName: string) {
  const { trackRender, trackEffect, trackApiCall } = usePerformanceTracking(componentName);
  
  // Track initial render
  useEffect(() => {
    const cleanup = trackRender();
    return cleanup;
  }, []);
  
  return {
    trackEffect,
    trackApiCall,
    trackInteraction: (interactionName: string) => {
      performance.mark(`${componentName}-${interactionName}`);
      
      return () => {
        performance.measure(
          `${componentName}-interaction:${interactionName}`,
          `${componentName}-${interactionName}`
        );
      };
    }
  };
}