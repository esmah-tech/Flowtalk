import { Link } from 'react-router';
import { AuthLayout } from './AuthLayout';
import { FlowTalkLogo } from '@/app/components/FlowTalkLogo';
import { authInputClass, authInputStyle, authButtonClass, authButtonStyle, authGoogleButtonClass, authGoogleButtonStyle } from './authStyles';
import { cn } from '@/app/components/ui/utils';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import React, { useState } from 'react';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length === 0) {
      // Would sign in here
    }
  };

  return (
    <AuthLayout>
      <div className="md:hidden mb-6 flex justify-center">
        <FlowTalkLogo size="md" showTagline />
      </div>
      <h1 className="text-2xl font-semibold" style={{ color: '#111827' }}>
        Welcome back
      </h1>
      <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
        Sign in to your FlowTalk workspace
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
            className={cn(authInputClass)}
            style={authInputStyle}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#111827' }}>
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(authInputClass)}
            style={authInputStyle}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={remember}
              onCheckedChange={(c) => setRemember(!!c)}
              className="border-[#E5E7EB] data-[state=checked]:bg-[#4d298c] data-[state=checked]:border-[#4d298c]"
            />
            <span className="text-sm" style={{ color: '#111827' }}>Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: '#4d298c' }}
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className={authButtonClass}
          style={authButtonStyle}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
        <span className="text-sm" style={{ color: '#6B7280' }}>or continue with</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
      </div>

      <Button
        type="button"
        variant="outline"
        className={cn('mt-4', authGoogleButtonClass)}
        style={authGoogleButtonStyle}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold hover:underline" style={{ color: '#111827' }}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
