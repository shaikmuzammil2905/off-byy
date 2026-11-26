import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, ShieldCheck, Store } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { OffbyLogo } from '../components/OffbyLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithToken, showToast } = useApp();

  const [mode, setMode] = useState<'otp' | 'email' | 'register'>('otp');
  const [phone, setPhone] = useState('+919876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ demoOtp: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setOtpSent(true);
      setDemoOtpHint(res.demoOtp);
      setOtpCode(res.demoOtp);
      showToast(`OTP sent to ${phone}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: any }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code: otpCode, name }),
      });
      loginWithToken(res.token, res.user);
      showToast(`Welcome, ${res.user.name}!`);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const body = mode === 'register' ? { name, email, phone, password } : { email, password };
      const res = await apiFetch<{ token: string; user: any }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      loginWithToken(res.token, res.user);
      showToast(`Welcome, ${res.user.name}!`);
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'vendor') navigate('/vendor');
      else navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      loginWithToken(res.token, res.user);
      showToast(`Signed in as ${res.user.name}`);
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'vendor') navigate('/vendor');
      else navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 flex flex-col justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-card border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <OffbyLogo size="md" />
          <div className="w-9" />
        </div>

        <h1 className="font-display font-bold text-xl text-slate-900 text-center">
          {mode === 'register' ? 'Create Account' : 'Sign In to offby'}
        </h1>
        <p className="text-xs text-slate-500 text-center mt-1">
          Discover local offers, save favourite shops & more
        </p>

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl mt-5">
          <button
            type="button"
            onClick={() => {
              setMode('otp');
              setError('');
            }}
            className={`py-2 rounded-lg text-xs font-bold ${
              mode === 'otp' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('email');
              setError('');
            }}
            className={`py-2 rounded-lg text-xs font-bold ${
              mode === 'email' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 rounded-lg text-xs font-bold ${
              mode === 'register' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {mode === 'otp' ? (
          !otpSent ? (
            <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm hover:bg-brand-800 disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
              <div className="p-3 rounded-xl bg-brand-50 text-xs text-brand-800">
                OTP sent to <strong>{phone}</strong>. Demo OTP: <strong>{demoOtpHint}</strong>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter 4-Digit OTP
                </label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="1234"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm hover:bg-brand-800"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-xs text-slate-500 hover:underline"
              >
                Change mobile number
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailAuth} className="mt-5 space-y-3.5">
            {mode === 'register' && (
              <>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Mobile Number (optional)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                />
              </>
            )}
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm hover:bg-brand-800"
            >
              {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Quick Demo Access */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase text-slate-400 text-center mb-2.5">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickDemoLogin('rohit@offby.in', 'User@123')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-brand-50 text-xs font-semibold text-slate-700 border border-slate-200"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin('beanbrew@offby.in', 'Vendor@123')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-brand-50 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center justify-center gap-1"
            >
              <Store className="w-3.5 h-3.5 text-brand-600" />
              Vendor
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin('admin@offby.in', 'Admin@123')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-brand-50 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center justify-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
