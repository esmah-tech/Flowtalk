import React from 'react';
import { FlowTalkLogo } from './FlowTalkLogo';

export function AuthBrandingPanel() {
  return (
    <div
      className="relative hidden md:flex flex-1 min-h-screen flex-col items-center justify-center overflow-hidden py-16 px-12"
      style={{
        background: 'linear-gradient(180deg, #4d298c 0%, #2d1660 100%)',
      }}
    >
      {/* Floating lime circles at 8% opacity */}
      <div
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-[0.08]"
        style={{ background: '#d7f78b', top: '15%', left: '10%' }}
        aria-hidden
      />
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-[0.08]"
        style={{ background: '#d7f78b', bottom: '20%', right: '5%' }}
        aria-hidden
      />
      <div
        className="absolute w-48 h-48 rounded-full blur-3xl opacity-[0.08]"
        style={{ background: '#d7f78b', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        aria-hidden
      />

      {/* Dot pattern overlay 5% opacity */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <FlowTalkLogo size="xl" showTagline />
      </div>
    </div>
  );
}
