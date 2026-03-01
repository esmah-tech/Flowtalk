import { Link } from 'react-router';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthLayout } from './AuthLayout';
import { FlowTalkLogo } from '@/app/components/FlowTalkLogo';
import { authInputClass, authInputStyle, authButtonClass, authButtonStyle } from './authStyles';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError('');
    setSubmitted(true);
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
              Forgot your password?
            </h1>
            <p className="mt-1 text-sm mt-2" style={{ color: '#6B7280' }}>
              No worries, we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authInputClass}
                  style={authInputStyle}
                  aria-invalid={!!error}
                />
                {error && <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{error}</p>}
              </div>

              <Button type="submit" className={authButtonClass} style={authButtonStyle}>
                Send reset link
              </Button>
            </form>

            <Link
              to="/signin"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: '#4d298c' }}
            >
              <span style={{ color: '#d7f78b' }}>←</span> Back to sign in
            </Link>
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
              Check your inbox
            </h2>
            <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: '#6B7280' }}>
              We sent a reset link to <strong style={{ color: '#111827' }}>{email}</strong>. Check your spam if you don&apos;t see it.
            </p>
            <button
              type="button"
              className="mt-6 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: '#4d298c' }}
            >
              Resend email
            </button>
            <Link
              to="/signin"
              className="mt-8 block text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: '#4d298c' }}
            >
              <span style={{ color: '#d7f78b' }}>←</span> Back to sign in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
