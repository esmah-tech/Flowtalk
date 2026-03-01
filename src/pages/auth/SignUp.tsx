import { Link } from 'react-router';
import { AuthLayout } from './AuthLayout';
import { FlowTalkLogo } from '@/app/components/FlowTalkLogo';
import { authInputClass, authInputStyle, authButtonClass, authButtonStyle, authGoogleButtonClass, authGoogleButtonStyle } from './authStyles';
import { PasswordStrengthBar, getPasswordStrength } from './PasswordStrengthBar';
import { cn } from '@/app/components/ui/utils';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import React, { useState } from 'react';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) next.terms = 'You must agree to the Terms of Service and Privacy Policy';
    setErrors(next);
    if (Object.keys(next).length === 0) {
      // Would sign up here
    }
  };

  return (
    <AuthLayout>
      <div className="md:hidden mb-6 flex justify-center shrink-0">
        <FlowTalkLogo size="md" showTagline />
      </div>
      <h1 className="text-2xl font-semibold shrink-0" style={{ color: '#111827' }}>
        Create your account
      </h1>
      <p className="mt-1 text-sm shrink-0" style={{ color: '#6B7280' }}>
        Start collaborating with your team
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1" style={{ color: '#111827' }}>
            Full name
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="Alex Johnson"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={cn(authInputClass)}
            style={authInputStyle}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#111827' }}>
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
          {errors.email && <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#111827' }}>
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
          <PasswordStrengthBar strength={strength} />
          {errors.password && <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: '#111827' }}>
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(authInputClass)}
            style={authInputStyle}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>{errors.confirmPassword}</p>}
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox
            checked={agreeTerms}
            onCheckedChange={(c) => setAgreeTerms(!!c)}
            className="mt-0.5 border-[#E5E7EB] data-[state=checked]:bg-[#4d298c] data-[state=checked]:border-[#4d298c]"
          />
          <span className="text-sm" style={{ color: '#111827' }}>
            I agree to the{' '}
            <a href="#" className="underline" style={{ color: '#4d298c' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline" style={{ color: '#4d298c' }}>Privacy Policy</a>
          </span>
        </label>
        {errors.terms && <p className="text-sm" style={{ color: '#DC2626' }}>{errors.terms}</p>}

        <Button type="submit" className={authButtonClass} style={authButtonStyle}>
          Sign Up
        </Button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
        <span className="text-sm" style={{ color: '#6B7280' }}>or continue with</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
      </div>

      <Button type="button" variant="outline" className={cn('mt-4', authGoogleButtonClass)} style={authGoogleButtonStyle}>
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold hover:underline" style={{ color: '#111827' }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
