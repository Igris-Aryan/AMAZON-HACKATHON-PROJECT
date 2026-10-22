/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'text' | 'action'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const requestRef = useRef<number | null>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentFollower = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Check if touch device or reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch || prefersReducedMotion) {
      setIsTouchDevice(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      targetPos.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });

      // Determine interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest('button, a, [role="button"], input[type="range"]')) {
          setIsHovering(true);
          setCursorType('pointer');
        } else if (target.closest('input[type="text"], textarea')) {
          setIsHovering(true);
          setCursorType('text');
        } else if (target.closest('.interactive-node')) {
          setIsHovering(true);
          setCursorType('action');
        } else {
          setIsHovering(false);
          setCursorType('default');
        }
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth follower easing loop via requestAnimationFrame
    const updateFollower = () => {
      const ease = 0.18;
      currentFollower.current.x += (targetPos.current.x - currentFollower.current.x) * ease;
      currentFollower.current.y += (targetPos.current.y - currentFollower.current.y) * ease;
      setFollowerPos({
        x: currentFollower.current.x,
        y: currentFollower.current.y,
      });
      requestRef.current = requestAnimationFrame(updateFollower);
    };

    requestRef.current = requestAnimationFrame(updateFollower);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isVisible]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <>
      {/* Primary Precise Dot */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-75"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${isClicking ? 0.7 : 1})`,
        }}
      >
        <div
          className={`rounded-full transition-all duration-150 ${
            cursorType === 'text'
              ? 'w-1 h-4 bg-sky-400 rounded-sm'
              : cursorType === 'action'
              ? 'w-2.5 h-2.5 bg-emerald-400 ring-2 ring-emerald-400/40'
              : 'w-2 h-2 bg-sky-400 shadow-sm shadow-sky-400/60'
          }`}
        />
      </div>

      {/* Layer 2: Easing Follower Ring */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out"
        style={{
          transform: `translate3d(${followerPos.x}px, ${followerPos.y}px, 0) scale(${
            isClicking ? 0.85 : isHovering ? 1.5 : 1
          })`,
        }}
      >
        <div
          className={`rounded-full transition-all duration-200 border ${
            cursorType === 'text'
              ? 'w-6 h-6 border-transparent'
              : cursorType === 'action'
              ? 'w-8 h-8 border-emerald-400/50 bg-emerald-500/10'
              : isHovering
              ? 'w-9 h-9 border-sky-400/50 bg-sky-400/5 backdrop-blur-[1px]'
              : 'w-6 h-6 border-white/20 bg-white/[0.02]'
          }`}
        />
      </div>
    </>
  );
};
