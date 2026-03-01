import React from 'react';
import { FlowTalkLogo } from '@/app/components/FlowTalkLogo';

export default function Loading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #4d298c 0%, #2d1660 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Soft lime glow behind logo */}
      <div
        className="absolute w-64 h-64 rounded-full blur-[80px] opacity-30 pointer-events-none"
        style={{
          background: '#d7f78b',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Spinning ring around logo + pulse on logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div
            className="absolute rounded-xl animate-spin border-2 border-transparent"
            style={{
              width: '72px',
              height: '72px',
              margin: '-4px',
              borderTopColor: '#4d298c',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
            aria-hidden
          />
          <div style={{ animation: 'pulse-scale 2s ease-in-out infinite' }}>
            <FlowTalkLogo size="lg" showTagline={false} />
          </div>
        </div>

        <p
          className="text-sm font-medium mt-2"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Where teams flow together
        </p>
      </div>

      <style>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
