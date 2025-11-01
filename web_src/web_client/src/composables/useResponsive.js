import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

/**
 * Responsive composable using Vuetify's breakpoint system
 * 
 * Vuetify breakpoints:
 * xs: 0-599px (mobile)
 * sm: 600-959px (tablet)  
 * md: 960-1263px (small desktop)
 * lg: 1264-1903px (desktop)
 * xl: 1904px+ (large desktop)
 */
export function useResponsive() {
  const display = useDisplay()
  
  // Extract individual values with fallbacks
  const { 
    mobile = ref(false), 
    tablet = ref(false), 
    desktop = ref(true),
    smAndUp = ref(true), 
    mdAndUp = ref(true), 
    lgAndUp = ref(true), 
    width = ref(1920), 
    height = ref(1080) 
  } = display

  // Keyboard responsive behavior based on Vuetify breakpoints
  // Use lg+ (1264px+) for numpad, md+ (960px+) for controls
  const showKeyboardNumpad = computed(() => lgAndUp?.value || false)
  const showKeyboardControls = computed(() => mdAndUp?.value || false)
  
  return {
    // Window dimensions (reactive)
    windowWidth: width,
    windowHeight: height,
    
    // Device type flags (Vuetify's built-in reactive refs)
    isMobile: mobile,
    isTablet: tablet, 
    isDesktop: desktop,
    
    // Breakpoint helpers (Vuetify's built-in reactive refs)
    smAndUp,  // >= 600px
    mdAndUp,  // >= 960px
    lgAndUp,  // >= 1264px
    
    // Keyboard specific responsive flags
    showKeyboardNumpad,   // >= 1264px (lg+)
    showKeyboardControls, // >= 960px (md+)
    
    // Current breakpoint name (computed)
    breakpoint: computed(() => {
      if (mobile?.value) return 'mobile'
      if (tablet?.value) return 'tablet'  
      return 'desktop'
    })
  }
}