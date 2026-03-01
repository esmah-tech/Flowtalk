import React from 'react';
import { cn } from '@/app/components/ui/utils';

export type FlowTalkLogoSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap = {
  sm: { box: 'w-8 h-8', text: 'text-xs' },
  md: { box: 'w-10 h-10', text: 'text-sm' },
  lg: { box: 'w-16 h-16', text: 'text-2xl' },
  xl: { box: 'w-24 h-24', text: 'text-4xl' },
};

export interface FlowTalkLogoProps {
  size?: FlowTalkLogoSize;
  showTagline?: boolean;
  className?: string;
}

export function FlowTalkLogo({ size = 'md', showTagline = false, className }: FlowTalkLogoProps) {
  const { box, text } = sizeMap[size];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-lg flex items-center justify-center shrink-0',
          box,
        )}
        style={{
          backgroundColor: '#d7f78b',
        }}
      >
        <span
          className={cn('font-bold', text)}
          style={{ fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}
        >
          FT
        </span>
      </div>
      {showTagline && (
        <p
          className="text-sm font-medium whitespace-nowrap"
          style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.6)' }}
        >
          Where teams flow together
        </p>
      )}
    </div>
  );
}
