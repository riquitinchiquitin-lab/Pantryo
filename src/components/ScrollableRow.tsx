import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableRowProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  showChevrons?: boolean;
  gradientFrom?: string; // e.g. 'from-[#FAF7EE]' (default) or 'from-white'
}

export const ScrollableRow: React.FC<ScrollableRowProps> = ({
  children,
  className = '',
  containerClassName = '',
  showChevrons = true,
  gradientFrom = 'from-[#FAF7EE]',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 3;
    const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 3;
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  // Global pointer move and up handlers so dragging continues smoothly even if the pointer drifts outside
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const delta = e.clientX - startX.current;
      if (Math.abs(delta) > 5) {
        hasMoved.current = true;
      }
      el.scrollLeft = scrollLeftStart.current - delta;
      checkScroll();
    };

    const handleGlobalPointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        // Keep hasMoved briefly so click capture can prevent accidental button activations
        setTimeout(() => {
          hasMoved.current = false;
        }, 120);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [checkScroll]);

  // Handle wheel scrolling: convert vertical mouse wheel to horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollWidth > el.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY * 0.9;
        checkScroll();
      }
    }
  };

  // Pointer down initiates drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button drag or touch
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.clientX;
    scrollLeftStart.current = el.scrollLeft;
  };

  // Click capture prevents triggering button clicks when dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(160, el.clientWidth * 0.65);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 320);
  };

  // Decide gradient classes
  const isWhite = gradientFrom.includes('white');
  const leftGradientClass = isWhite
    ? 'from-white via-white/90 to-transparent'
    : 'from-[#FAF7EE] via-[#FAF7EE]/90 to-transparent';
  const rightGradientClass = isWhite
    ? 'from-white via-white/90 to-transparent'
    : 'from-[#FAF7EE] via-[#FAF7EE]/90 to-transparent';

  return (
    <div className={`relative group/scroll ${containerClassName}`}>
      {/* Left Scroll Floating Button */}
      {showChevrons && canScrollLeft && (
        <div className={`absolute left-0 top-0 bottom-0 z-20 flex items-center pr-4 pl-0.5 bg-gradient-to-r ${leftGradientClass} pointer-events-none transition-opacity duration-200`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scroll('left');
            }}
            className="w-7 h-7 rounded-full bg-white border border-[#D5E1D2] text-[#0D3B37] shadow-md flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-600 transition-all cursor-pointer active:scale-90 pointer-events-auto shrink-0"
            title="Défiler vers la gauche / Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onClickCapture={handleClickCapture}
        className={`flex items-center gap-1.5 overflow-x-auto scroll-touch-x scrollbar-none overscroll-x-contain cursor-grab active:cursor-grabbing select-none ${className}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        }}
      >
        {children}
      </div>

      {/* Right Scroll Floating Button */}
      {showChevrons && canScrollRight && (
        <div className={`absolute right-0 top-0 bottom-0 z-20 flex items-center pl-4 pr-0.5 bg-gradient-to-l ${rightGradientClass} pointer-events-none transition-opacity duration-200`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scroll('right');
            }}
            className="w-7 h-7 rounded-full bg-white border border-[#D5E1D2] text-[#0D3B37] shadow-md flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-600 transition-all cursor-pointer active:scale-90 pointer-events-auto shrink-0"
            title="Défiler vers la droite / Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};

