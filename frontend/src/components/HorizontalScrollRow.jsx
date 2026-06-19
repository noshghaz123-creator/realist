import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HorizontalScrollRow({
  children,
  className = '',
  trackClassName = '',
  showArrows = true,
  arrowClassName = 'md:hidden',
}) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return undefined;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollByPage = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.82, behavior: 'smooth' });
  };

  const arrowBase =
    'absolute top-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition enabled:hover:border-teal-300 enabled:hover:text-teal-700 disabled:opacity-30 disabled:pointer-events-none';

  return (
    <div className={`relative ${className}`}>
      {showArrows && (
        <>
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollLeft}
            className={`${arrowBase} left-0 -translate-x-1/2 -translate-y-1/2 ${arrowClassName}`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollRight}
            className={`${arrowBase} right-0 translate-x-1/2 -translate-y-1/2 ${arrowClassName}`}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
      <div
        ref={trackRef}
        className={`scrollbar-hide flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 ${trackClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
