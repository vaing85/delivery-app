// Accessibility utilities and constants

export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: 'Main navigation',
  SIDEBAR_NAVIGATION: 'Sidebar navigation',
  MOBILE_MENU: 'Mobile menu',
  BREADCRUMBS: 'Breadcrumb navigation',
  
  // Actions
  CLOSE_DIALOG: 'Close dialog',
  OPEN_MENU: 'Open menu',
  CLOSE_MENU: 'Close menu',
  TOGGLE_THEME: 'Toggle theme',
  REFRESH_DATA: 'Refresh data',
  LOGOUT: 'Logout',
  LOGIN: 'Login',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  EDIT: 'Edit',
  VIEW: 'View',
  ADD: 'Add',
  SEARCH: 'Search',
  FILTER: 'Filter',
  SORT: 'Sort',
  
  // Data tables
  TABLE: 'Data table',
  SORTABLE_COLUMN: 'Sortable column',
  SORT_ASCENDING: 'Sort ascending',
  SORT_DESCENDING: 'Sort descending',
  ROW_ACTIONS: 'Row actions',
  SELECT_ROW: 'Select row',
  SELECT_ALL_ROWS: 'Select all rows',
  
  // Forms
  REQUIRED_FIELD: 'Required field',
  OPTIONAL_FIELD: 'Optional field',
  FORM_ERROR: 'Form error',
  FORM_SUCCESS: 'Form success',
  FIELD_ERROR: 'Field error',
  FIELD_HELP: 'Field help text',
  
  // Status indicators
  LOADING: 'Loading',
  SUCCESS: 'Success',
  ERROR: 'Error',
  WARNING: 'Warning',
  INFO: 'Information',
  
  // Interactive elements
  BUTTON: 'Button',
  LINK: 'Link',
  TAB: 'Tab',
  TAB_PANEL: 'Tab panel',
  DROPDOWN: 'Dropdown',
  MODAL: 'Modal dialog',
  TOOLTIP: 'Tooltip',
  ALERT: 'Alert',
  NOTIFICATION: 'Notification',
  
  // Data visualization
  CHART: 'Chart',
  GRAPH: 'Graph',
  MAP: 'Map',
  PROGRESS_BAR: 'Progress bar',
  METER: 'Meter',
  
  // Content
  SKIP_TO_CONTENT: 'Skip to main content',
  PAGE_TITLE: 'Page title',
  SECTION_HEADING: 'Section heading',
  CONTENT_AREA: 'Main content area',
} as const;

export const ROLES = {
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  FORM: 'form',
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  DIALOG: 'dialog',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  BUTTON: 'button',
  LINK: 'link',
  LIST: 'list',
  LISTITEM: 'listitem',
  TABLE: 'table',
  ROW: 'row',
  CELL: 'cell',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  PROGRESSBAR: 'progressbar',
  STATUS: 'status',
  TOOLTIP: 'tooltip',
  LOG: 'log',
  MARQUEE: 'marquee',
  TIMER: 'timer',
  PRESENTATION: 'presentation',
  NONE: 'none',
} as const;

export const LIVE_REGIONS = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off',
} as const;

// Keyboard navigation utilities
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors)) as HTMLElement[];
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  static restoreFocus(element: HTMLElement | null): void {
    if (element) {
      element.focus();
    }
  }

  static getNextFocusableElement(currentElement: HTMLElement): HTMLElement | null {
    const allFocusable = this.getFocusableElements(document.body);
    const currentIndex = allFocusable.indexOf(currentElement);
    return allFocusable[currentIndex + 1] || null;
  }

  static getPreviousFocusableElement(currentElement: HTMLElement): HTMLElement | null {
    const allFocusable = this.getFocusableElements(document.body);
    const currentIndex = allFocusable.indexOf(currentElement);
    return allFocusable[currentIndex - 1] || null;
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  static announcePageChange(pageTitle: string): void {
    this.announce(`Navigated to ${pageTitle}`, 'polite');
  }

  static announceError(errorMessage: string): void {
    this.announce(`Error: ${errorMessage}`, 'assertive');
  }

  static announceSuccess(successMessage: string): void {
    this.announce(`Success: ${successMessage}`, 'polite');
  }

  static announceLoading(isLoading: boolean, context: string = 'content'): void {
    const message = isLoading ? `${context} is loading` : `${context} has finished loading`;
    this.announce(message, 'polite');
  }
}

// Color contrast utilities
export class ColorContrastUtils {
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  static meetsWCAGAA(contrastRatio: number): boolean {
    return contrastRatio >= 4.5;
  }

  static meetsWCAGAAA(contrastRatio: number): boolean {
    return contrastRatio >= 7;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  static testKeyboardNavigation(container: HTMLElement): string[] {
    const issues: string[] = [];
    const focusableElements = FocusManager.getFocusableElements(container);

    // Check if all focusable elements are reachable
    focusableElements.forEach((element, index) => {
      element.focus();
      if (document.activeElement !== element) {
        issues.push(`Element at index ${index} is not focusable`);
      }
    });

    return issues;
  }

  static testARIALabels(container: HTMLElement): string[] {
    const issues: string[] = [];
    const interactiveElements = container.querySelectorAll('button, input, select, textarea, a[href]');

    interactiveElements.forEach((element, index) => {
      const hasLabel = element.hasAttribute('aria-label') || 
                      element.hasAttribute('aria-labelledby') ||
                      element.getAttribute('aria-label') !== null ||
                      element.textContent?.trim() !== '';
      
      if (!hasLabel) {
        issues.push(`Interactive element at index ${index} lacks accessible name`);
      }
    });

    return issues;
  }

  static testColorContrast(container: HTMLElement): string[] {
    const issues: string[] = [];
    const elements = container.querySelectorAll('*');
    
    elements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrastRatio = ColorContrastUtils.getContrastRatio(color, backgroundColor);
        if (!ColorContrastUtils.meetsWCAGAA(contrastRatio)) {
          issues.push(`Low contrast ratio: ${contrastRatio.toFixed(2)} for element with text "${element.textContent?.slice(0, 50)}"`);
        }
      }
    });

    return issues;
  }
}

// Hook for accessibility features
export const useAccessibility = () => {
  const announce = ScreenReaderUtils.announce;
  const announcePageChange = ScreenReaderUtils.announcePageChange;
  const announceError = ScreenReaderUtils.announceError;
  const announceSuccess = ScreenReaderUtils.announceSuccess;
  const announceLoading = ScreenReaderUtils.announceLoading;

  return {
    announce,
    announcePageChange,
    announceError,
    announceSuccess,
    announceLoading,
    ARIA_LABELS,
    ROLES,
    LIVE_REGIONS,
    KEYBOARD_KEYS,
  };
};

export default useAccessibility;
