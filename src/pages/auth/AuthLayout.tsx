import React, { ReactNode } from 'react';
import { AuthBrandingPanel } from '@/app/components/AuthBrandingPanel';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col md:flex-row font-sans overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Form column - no scroll on desktop; allow scroll only on very small viewports */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 min-h-0 w-full overflow-y-auto"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="w-full max-w-[400px] py-4">{children}</div>
      </div>
      {/* Right branding panel - hidden on mobile */}
      <AuthBrandingPanel />
    </div>
  );
}
