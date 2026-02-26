const ANIMATION_MAP: Record<string, string> = {
  'fade-up': 'animate-fade-in-up',
  'fade-in': 'animate-fade-in',
  'slide-left': 'animate-slide-in-left',
  'slide-right': 'animate-slide-in-right',
  'scale-in': 'animate-scale-in',
}

let observer: IntersectionObserver | null = null
const elements = new Map<Element, { animation: string; delay: number; childrenOnly: boolean }>()

function getObserver(): IntersectionObserver {
  if (observer) return observer

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const config = elements.get(entry.target)
        if (!config) continue

        const el = entry.target as HTMLElement

        const reveal = () => {
          if (config.childrenOnly) {
            for (const child of Array.from(el.children) as HTMLElement[]) {
              child.classList.remove('reveal-hidden')
              child.classList.add(config.animation)
            }
          } else {
            el.classList.remove('reveal-hidden')
            el.classList.add(config.animation)
          }
          observer?.unobserve(el)
          elements.delete(el)
        }

        if (config.delay > 0) {
          setTimeout(reveal, config.delay)
        } else {
          reveal()
        }
      }
    },
    { rootMargin: '0px 0px -50px 0px', threshold: 0.1 },
  )

  return observer
}

export function observeReveal(
  el: HTMLElement,
  animation: string = 'fade-up',
  delay: number = 0,
  threshold?: number,
  childrenOnly: boolean = true,
) {
  // Skip if reduced motion is preferred
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const animClass = ANIMATION_MAP[animation] || ANIMATION_MAP['fade-up']

  if (childrenOnly) {
    for (const child of Array.from(el.children) as HTMLElement[]) {
      child.classList.add('reveal-hidden')
    }
  } else {
    el.classList.add('reveal-hidden')
  }
  elements.set(el, { animation: animClass, delay, childrenOnly })

  // Use custom threshold observer if needed, otherwise shared observer
  if (threshold !== undefined && threshold !== 0.1) {
    const custom = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const config = elements.get(entry.target)
          if (!config) continue
          const target = entry.target as HTMLElement

          const reveal = () => {
            if (config.childrenOnly) {
              for (const child of Array.from(target.children) as HTMLElement[]) {
                child.classList.remove('reveal-hidden')
                child.classList.add(config.animation)
              }
            } else {
              target.classList.remove('reveal-hidden')
              target.classList.add(config.animation)
            }
            custom.unobserve(target)
            elements.delete(target)
          }

          if (config.delay > 0) {
            setTimeout(reveal, config.delay)
          } else {
            reveal()
          }
        }
      },
      { rootMargin: '0px 0px -50px 0px', threshold },
    )
    custom.observe(el)
    return
  }

  getObserver().observe(el)
}

export function unobserveReveal(el: HTMLElement) {
  const config = elements.get(el)
  if (config?.childrenOnly) {
    for (const child of Array.from(el.children) as HTMLElement[]) {
      child.classList.remove('reveal-hidden')
    }
  }
  observer?.unobserve(el)
  elements.delete(el)
}
