/**
 * Comprehensive accessibility utilities for WCAG 2.1 AAA compliance
 * Provides tools for screen readers, keyboard navigation, and assistive technologies
 */

// Accessibility event types
export type A11yEventType = 
  | 'focus' 
  | 'blur' 
  | 'click' 
  | 'keydown' 
  | 'scroll' 
  | 'announcement';

// Screen reader announcements
export interface A11yAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  delay?: number;
  id?: string;
}

// Focus management
export interface FocusableElement {
  element: HTMLElement;
  priority: number;
  group?: string;
}

// Keyboard navigation configuration
export interface KeyboardNavConfig {
  enableArrowKeys?: boolean;
  enableTabTrapping?: boolean;
  enableEscapeKey?: boolean;
  wrapNavigation?: boolean;
  skipToContent?: boolean;
}

/**
 * Accessibility Manager - Central hub for accessibility features
 */
class AccessibilityManager {
  private announcements: A11yAnnouncement[] = [];
  private focusableElements: FocusableElement[] = [];
  private liveRegion: HTMLElement | null = null;
  private skipToContentLink: HTMLAnchorElement | null = null;
  private reducedMotionPreference = false;
  private highContrastMode = false;
  private largeTextMode = false;

  constructor() {
    this.initializeLiveRegion();
    this.initializePreferences();
    this.initializeSkipToContent();
    this.bindGlobalKeyboardHandlers();
  }

  /**
   * Initialize ARIA live region for announcements
   */
  private initializeLiveRegion(): void {
    if (typeof window === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'false');
    this.liveRegion.setAttribute('aria-relevant', 'additions text');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.id = 'accessibility-live-region';
    
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Initialize user accessibility preferences
   */
  private initializePreferences(): void {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionPreference = reducedMotionQuery.matches;
    
    reducedMotionQuery.addEventListener('change', (e) => {
      this.reducedMotionPreference = e.matches;
      this.handleReducedMotionChange(e.matches);
    });

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    this.highContrastMode = highContrastQuery.matches;
    
    highContrastQuery.addEventListener('change', (e) => {
      this.highContrastMode = e.matches;
      this.handleHighContrastChange(e.matches);
    });

    // Check for large text preference
    const largeTextQuery = window.matchMedia('(min-resolution: 192dpi)');
    this.largeTextMode = largeTextQuery.matches;
  }

  /**
   * Initialize skip to content functionality
   */
  private initializeSkipToContent(): void {
    if (typeof window === 'undefined') return;

    this.skipToContentLink = document.createElement('a') as HTMLAnchorElement;
    this.skipToContentLink.href = '#main-content';
    this.skipToContentLink.textContent = 'Skip to main content';
    this.skipToContentLink.className = 'skip-to-content sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white p-2 rounded';
    this.skipToContentLink.setAttribute('accesskey', '1');
    
    this.skipToContentLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content') || document.querySelector('main');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    document.body.insertBefore(this.skipToContentLink, document.body.firstChild);
  }

  /**
   * Bind global keyboard event handlers
   */
  private bindGlobalKeyboardHandlers(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Escape':
          this.handleEscapeKey(e);
          break;
        case 'Tab':
          this.handleTabKey(e);
          break;
        case 'F6':
          this.handleF6Key(e);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Announce message to screen readers
   */
  public announce(announcement: A11yAnnouncement): void {
    if (!this.liveRegion) return;

    const { message, priority, delay = 0, id } = announcement;

    // Clear previous announcement if it has the same ID
    if (id) {
      const existing = this.liveRegion.querySelector(`[data-announcement-id="${id}"]`);
      if (existing) {
        existing.remove();
      }
    }

    const announceElement = document.createElement('div');
    announceElement.textContent = message;
    announceElement.setAttribute('aria-live', priority);
    
    if (id) {
      announceElement.setAttribute('data-announcement-id', id);
    }

    setTimeout(() => {
      this.liveRegion!.appendChild(announceElement);
      
      // Remove announcement after a delay to keep live region clean
      setTimeout(() => {
        if (announceElement.parentNode) {
          announceElement.parentNode.removeChild(announceElement);
        }
      }, 5000);
    }, delay);

    this.announcements.push(announcement);
  }

  /**
   * Set focus on an element with proper error handling
   */
  public setFocus(element: HTMLElement | string, options: FocusOptions = {}): boolean {
    try {
      const targetElement = typeof element === 'string' 
        ? document.getElementById(element) || document.querySelector(element)
        : element;

      if (!targetElement) {
        // Focus target not found
        return false;
      }

      // Make element focusable if it's not already
      if (!this.isFocusable(targetElement)) {
        targetElement.setAttribute('tabindex', '-1');
      }

      targetElement.focus(options);
      
      // Scroll into view if not visible
      if (!this.isElementVisible(targetElement)) {
        targetElement.scrollIntoView({ 
          behavior: this.reducedMotionPreference ? 'auto' : 'smooth',
          block: 'center'
        });
      }

      return true;
    } catch (error) {
      // Failed to set focus
      return false;
    }
  }

  /**
   * Manage focus within a container (focus trapping)
   */
  public trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Get all focusable elements within a container
   */
  public getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    
    return elements.filter(element => 
      this.isFocusable(element) && this.isElementVisible(element)
    );
  }

  /**
   * Check if element is focusable
   */
  public isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === '-1') return false;

    return true;
  }

  /**
   * Check if element is visible
   */
  public isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }

  /**
   * Create accessible description for complex elements
   */
  public createDescription(element: HTMLElement, description: string): string {
    const descriptionId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    
    const descriptionElement = document.createElement('div');
    descriptionElement.id = descriptionId;
    descriptionElement.className = 'sr-only';
    descriptionElement.textContent = description;
    
    element.parentNode?.insertBefore(descriptionElement, element.nextSibling);
    element.setAttribute('aria-describedby', descriptionId);
    
    return descriptionId;
  }

  /**
   * Handle reduced motion preference changes
   */
  private handleReducedMotionChange(reducedMotion: boolean): void {
    this.reducedMotionPreference = reducedMotion;
    
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    this.announce({
      message: `Motion preferences updated: ${reducedMotion ? 'reduced' : 'normal'} motion`,
      priority: 'polite'
    });
  }

  /**
   * Handle high contrast preference changes
   */
  private handleHighContrastChange(highContrast: boolean): void {
    this.highContrastMode = highContrast;
    
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    this.announce({
      message: `Contrast preferences updated: ${highContrast ? 'high' : 'normal'} contrast`,
      priority: 'polite'
    });
  }

  /**
   * Handle escape key presses
   */
  private handleEscapeKey(_e: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const closeableElements = document.querySelectorAll('[data-closeable="true"]');
    closeableElements.forEach(element => {
      if (this.isElementVisible(element as HTMLElement)) {
        (element as HTMLElement).click();
      }
    });
  }

  /**
   * Handle tab key navigation
   */
  private handleTabKey(_e: KeyboardEvent): void {
    // Custom tab handling logic can go here
    // For now, we'll let the browser handle normal tab navigation
  }

  /**
   * Handle F6 key for landmark navigation
   */
  private handleF6Key(e: KeyboardEvent): void {
    e.preventDefault();
    
    const landmarks = document.querySelectorAll('main, nav, aside, section[aria-labelledby], section[aria-label], [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]');
    const visibleLandmarks = Array.from(landmarks).filter(landmark => 
      this.isElementVisible(landmark as HTMLElement)
    );

    if (visibleLandmarks.length === 0) return;

    const currentIndex = visibleLandmarks.findIndex(landmark => 
      landmark.contains(document.activeElement)
    );
    
    const nextIndex = (currentIndex + 1) % visibleLandmarks.length;
    const nextLandmark = visibleLandmarks[nextIndex] as HTMLElement;
    
    this.setFocus(nextLandmark);
    
    const landmarkName = nextLandmark.getAttribute('aria-label') ||
                         nextLandmark.getAttribute('aria-labelledby') ||
                         nextLandmark.tagName.toLowerCase();
    
    this.announce({
      message: `Navigated to ${landmarkName} landmark`,
      priority: 'polite'
    });
  }

  /**
   * Get accessibility preferences
   */
  public getPreferences() {
    return {
      reducedMotion: this.reducedMotionPreference,
      highContrast: this.highContrastMode,
      largeText: this.largeTextMode
    };
  }

  /**
   * Validate ARIA attributes on an element
   */
  public validateARIA(element: HTMLElement): string[] {
    const issues: string[] = [];
    
    // Check for required ARIA labels
    if (element.getAttribute('role') === 'button' && !element.textContent?.trim() && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      issues.push('Button missing accessible name');
    }

    // Check for invalid ARIA attributes
    const ariaAttributes = Array.from(element.attributes).filter(attr => 
      attr.name.startsWith('aria-')
    );

    ariaAttributes.forEach(attr => {
      if (!this.isValidARIAAttribute(attr.name)) {
        issues.push(`Invalid ARIA attribute: ${attr.name}`);
      }
    });

    return issues;
  }

  /**
   * Check if ARIA attribute is valid
   */
  private isValidARIAAttribute(attrName: string): boolean {
    const validARIAAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
      'aria-expanded', 'aria-selected', 'aria-checked', 'aria-disabled',
      'aria-required', 'aria-invalid', 'aria-live', 'aria-atomic',
      'aria-relevant', 'aria-busy', 'aria-controls', 'aria-owns',
      'aria-activedescendant', 'aria-current', 'aria-level', 'aria-setsize',
      'aria-posinset', 'aria-sort', 'aria-valuemin', 'aria-valuemax',
      'aria-valuenow', 'aria-valuetext', 'aria-orientation', 'aria-pressed'
    ];

    return validARIAAttributes.includes(attrName);
  }

  /**
   * Generate accessibility report for current page
   */
  public generateA11yReport(): {
    issues: Array<{ element: HTMLElement; issues: string[] }>;
    focusableCount: number;
    landmarkCount: number;
    headingStructure: Array<{ level: number; text: string }>;
  } {
    const allElements = document.querySelectorAll('*');
    const issues: Array<{ element: HTMLElement; issues: string[] }> = [];
    
    allElements.forEach(element => {
      const elementIssues = this.validateARIA(element as HTMLElement);
      if (elementIssues.length > 0) {
        issues.push({ element: element as HTMLElement, issues: elementIssues });
      }
    });

    const focusableElements = this.getFocusableElements();
    const landmarks = document.querySelectorAll('main, nav, aside, section[aria-labelledby], section[aria-label], [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]');
    
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.trim() || ''
    }));

    return {
      issues,
      focusableCount: focusableElements.length,
      landmarkCount: landmarks.length,
      headingStructure: headings
    };
  }
}

// Singleton instance
export const a11yManager = new AccessibilityManager();

/**
 * React hook for accessibility features
 */
export function useAccessibility() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    a11yManager.announce({ message, priority });
  };

  const focusElement = (element: HTMLElement | string, options?: FocusOptions) => {
    return a11yManager.setFocus(element, options);
  };

  const trapFocus = (container: HTMLElement) => {
    return a11yManager.trapFocus(container);
  };

  const getPreferences = () => {
    return a11yManager.getPreferences();
  };

  return {
    announce,
    focusElement,
    trapFocus,
    getPreferences,
    manager: a11yManager
  };
}

/**
 * Utility functions for common accessibility patterns
 */

// Generate unique IDs for form associations
export function generateA11yId(prefix = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create accessible form field associations
export function createFormFieldAssociation(
  field: HTMLElement,
  label?: HTMLElement,
  description?: HTMLElement,
  error?: HTMLElement
): void {
  const fieldId = field.id || generateA11yId('field');
  field.id = fieldId;

  if (label) {
    label.setAttribute('for', fieldId);
  }

  const describedBy: string[] = [];
  
  if (description) {
    const descId = description.id || generateA11yId('desc');
    description.id = descId;
    describedBy.push(descId);
  }

  if (error) {
    const errorId = error.id || generateA11yId('error');
    error.id = errorId;
    error.setAttribute('aria-live', 'polite');
    error.setAttribute('role', 'alert');
    describedBy.push(errorId);
    field.setAttribute('aria-invalid', 'true');
  }

  if (describedBy.length > 0) {
    field.setAttribute('aria-describedby', describedBy.join(' '));
  }
}

// Check color contrast ratio
export function checkContrastRatio(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): { ratio: number; passes: boolean; level: string } {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  const threshold = level === 'AAA' ? 7 : 4.5;
  const passes = ratio >= threshold;

  return { ratio, passes, level };
}