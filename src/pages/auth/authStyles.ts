/**
 * Shared class names for auth forms (strict color system).
 * Use with cn() where needed.
 */
export const authInputClass =
  'w-full rounded-lg h-10 px-3 text-sm transition-[border-color,box-shadow] outline-none ' +
  'border bg-[#FFFFFF] ' +
  'placeholder:text-[#6B7280] ' +
  'focus:border-[#4d298c] focus:ring-[3px] focus:ring-[rgba(77,41,140,0.15)] ' +
  'aria-invalid:border-[#DC2626]';

export const authInputStyle = {
  borderColor: '#E5E7EB',
  color: '#111827',
} as const;

export const authButtonClass =
  'w-full rounded-lg h-10 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50';

export const authButtonStyle = {
  backgroundColor: '#111827',
} as const;

export const authGoogleButtonClass =
  'w-full rounded-lg h-10 text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-[#FFFFFF]';

export const authGoogleButtonStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  color: '#111827',
} as const;
