/**
 * GPU Acceleration Helpers (WDD §10)
 *
 * Apply GPU-accelerated CSS properties to elements.
 * Only animate `transform` and `opacity` — never layout properties.
 */

/** CSS class string for GPU-promoted layer */
export const GPU_LAYER_CLASS = 'gpu-layer'

/** CSS class string for smooth scroll container */
export const SCROLL_CONTAINER_CLASS = 'scroll-container'

/** CSS class string for horizontal scroll */
export const SCROLL_X_CLASS = 'scroll-x'

/**
 * Apply GPU acceleration inline styles to an element ref.
 * Use this when you need programmatic control instead of CSS classes.
 */
export function applyGpuStyles(element: HTMLElement): void {
  element.style.transform = 'translateZ(0)'
  element.style.willChange = 'transform'
  element.style.backfaceVisibility = 'hidden'
}

/**
 * Remove GPU acceleration inline styles from an element.
 */
export function removeGpuStyles(element: HTMLElement): void {
  element.style.transform = ''
  element.style.willChange = ''
  element.style.backfaceVisibility = ''
}
