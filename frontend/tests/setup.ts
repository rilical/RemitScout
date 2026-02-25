if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })
}

if (!globalThis.IntersectionObserver) {
  class IntersectionObserverMock implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin = '0px'
    readonly thresholds = [0]
    private readonly callback: IntersectionObserverCallback

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }

    disconnect(): void {}

    observe(target: Element): void {
      this.callback([
        {
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRatio: 1,
          intersectionRect: target.getBoundingClientRect(),
          isIntersecting: true,
          rootBounds: null,
          target,
          time: Date.now(),
        },
      ], this)
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }

    unobserve(_target: Element): void {}
  }

  ;(globalThis as any).IntersectionObserver = IntersectionObserverMock
}
