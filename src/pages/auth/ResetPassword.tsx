import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthLayout } from './AuthLayout';
import { FlowTalkLogo } from '@/app/components/FlowTalkLogo';
import { authInputClass, authInputStyle, authButtonClass, authButtonStyle } from './authStyles';
import { PasswordStrengthBar, getPasswordStrength } from './PasswordStrengthBar';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!newPassword) next.newPassword = 'Password is required';
    else if (newPassword.length < 8) next.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <AuthLayout>
      <div className="md:hidden mb-6 flex justify-center">
        <FlowTalkLogo size="md" showTagline />
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-semibold" style={{ color: '#111827' }}>
              Set new password
            </h1>
            <p className="mt-1 text-sm mt-2" style={{ color: '#6B7280' }}>
              Must be at least 8 characters
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>
                  New password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={authInputClass}
                  style={authInputStyle}
                  aria-invalid={!!errors.newPassword}
                />
                <PasswordStrengthBar strength={strength} />
                {errors.newPassword && <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.newPassword}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>
                  Confirm new password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={authInputClass}
                  style={authInputStyle}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className={authButtonClass} style={authButtonStyle}>
                Reset password
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ backgroundColor: '#d7f78b' }}
            >
              <svg className="w-8 h-8 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold" style={{ color: '#111827' }}>
              Password updated!
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>
              Redirecting you to sign in...
            </p>
            <div className="mt-6 flex justify-center">
              <svg
                className="w-6 h-6 animate-spin"
                style={{ color: '#4d298c' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
