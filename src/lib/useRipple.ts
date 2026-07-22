import type { MouseEvent } from 'react';

export function useRipple() {
  return (event: MouseEvent<HTMLElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      border-radius:9999px;
      background:rgba(255,255,255,.35);
      left:${event.clientX - rect.left - size / 2}px;
      top:${event.clientY - rect.top - size / 2}px;
      transform:scale(0);
      pointer-events:none;
      animation:dcRip .6s ease-out;
    `;
    el.appendChild(span);
    setTimeout(() => span.remove(), 600);
  };
}
