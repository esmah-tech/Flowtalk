import React from 'react';
import { cn } from '@/app/components/ui/utils';

/** 0–4 segments; 1=red, 2=orange, 3=yellow, 4=lime */
export function PasswordStrengthBar({ strength }: { strength: 0 | 1 | 2 | 3 | 4 }) {
  const labels = ['weak', 'fair', 'good', 'strong'] as const;
  const segmentColors = ['#DC2626', '#EA580C', '#CA8A04', '#d7f78b'];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-300"
            style={{
              height: '4px',
              backgroundColor: i < strength ? segmentColors[strength - 1] : '#E5E7EB',
            }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
        {strength === 0 ? 'Enter a password' : labels[strength - 1]}
      </p>
    </div>
  );
}

export function getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}
