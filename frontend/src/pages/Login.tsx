import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, KeyRound, Mail, Copy, CheckCheck } from 'lucide-react';
import { AxiosError } from 'axios';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

const DEFAULT_EMAIL = 'admin@example.com';
const DEFAULT_PASSWORD = 'Admin@123';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const copyToClipboard = (value: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fillCredentials = () => {
    setValue('email', DEFAULT_EMAIL);
    setValue('password', DEFAULT_PASSWORD);
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      setServerError(axiosErr.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#faf9f7' }}
    >
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1a1510' }}>InventoryPro</h1>
          <p className="mt-1.5 text-sm" style={{ color: '#7a7268' }}>Admin Management Portal</p>
        </div>

        {/* Default Credentials Card */}
        <div
          className="mb-5 p-4"
          style={{ border: '1px solid #fed7aa', background: '#fff7ed' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" style={{ color: '#ea6a0a' }} />
              <span className="text-sm font-semibold" style={{ color: '#c2550a' }}>
                Default Admin Credentials
              </span>
            </div>
            <button
              type="button"
              onClick={fillCredentials}
              className="text-xs px-3 py-1 font-medium transition-all duration-200"
              style={{
                background: '#fed7aa',
                border: '1px solid #fdba74',
                color: '#9a3d08',
              }}
            >
              Auto-fill ↗
            </button>
          </div>
          <div className="space-y-2">
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{ background: '#ffffff', border: '1px solid #dbe4ff' }}
            >
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" style={{ color: '#9a9088' }} />
                <span className="text-xs font-medium mr-1" style={{ color: '#7a7268' }}>Email:</span>
                <span className="text-sm font-mono" style={{ color: '#1a1510' }}>{DEFAULT_EMAIL}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(DEFAULT_EMAIL, 'email')}
                className="ml-2 transition-colors"
                style={{ color: '#9a9088' }}
                title="Copy email"
              >
                {copiedField === 'email' ? (
                  <CheckCheck className="w-3.5 h-3.5" style={{ color: '#14532d' }} />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{ background: '#ffffff', border: '1px solid #dbe4ff' }}
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5" style={{ color: '#9a9088' }} />
                <span className="text-xs font-medium mr-1" style={{ color: '#7a7268' }}>Password:</span>
                <span className="text-sm font-mono" style={{ color: '#1a1510' }}>{DEFAULT_PASSWORD}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(DEFAULT_PASSWORD, 'password')}
                className="ml-2 transition-colors"
                style={{ color: '#9a9088' }}
                title="Copy password"
              >
                {copiedField === 'password' ? (
                  <CheckCheck className="w-3.5 h-3.5" style={{ color: '#14532d' }} />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6" style={{ color: '#1a1510' }}>
            Sign in to your account
          </h2>

          {serverError && (
            <div
              className="mb-4 flex items-center gap-2.5 p-3.5 text-sm animate-fade-in"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs" style={{ color: '#991b1b' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                  style={{ color: '#9a9088' }}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs" style={{ color: '#991b1b' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 py-3 text-base"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>


      </div>
    </div>
  );
}
