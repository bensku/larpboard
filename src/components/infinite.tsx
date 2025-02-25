import React, { useRef, useState, useEffect } from 'react';

interface InfinitePanContainerProps {
  children: React.ReactNode;
  width?: number | string; // Outer container dimensions (defaults to full size)
  height?: number | string;
  contentWidth?: number; // Inner "infinite" content dimensions (default 10000px)
  contentHeight?: number;
}

const InfinitePanContainer: React.FC<InfinitePanContainerProps> = ({
  children,
  width = '100%',
  height = '100%',
  contentWidth = 10000,
  contentHeight = 10000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const scrollStart = useRef({ left: 0, top: 0 });

  // Center the scroll position on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft =
        (contentWidth - containerRef.current.clientWidth) / 2;
      containerRef.current.scrollTop =
        (contentHeight - containerRef.current.clientHeight) / 2;
    }
  }, [contentWidth, contentHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    scrollStart.current = {
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    };
    containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    containerRef.current.scrollLeft = scrollStart.current.left - dx;
    containerRef.current.scrollTop = scrollStart.current.top - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className="overflow-auto cursor-grab"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{ width: contentWidth, height: contentHeight }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
};

export default InfinitePanContainer;
