'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Toaster() {
  return <div id="toaster" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />;
}

export function toast({
  title,
  description,
  variant = 'default',
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) {
  const container = document.getElementById('toaster');
  if (!container) return;

  const el = document.createElement('div');
  el.className = cn(
    'rounded-lg border p-4 shadow-lg animate-fade-in max-w-sm',
    variant === 'destructive'
      ? 'border-destructive bg-destructive text-destructive-foreground'
      : 'border-border bg-card text-card-foreground',
  );
  el.innerHTML = `
    <p class="text-sm font-semibold">${title}</p>
    ${description ? `<p class="text-xs mt-1 opacity-80">${description}</p>` : ''}
  `;

  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}
