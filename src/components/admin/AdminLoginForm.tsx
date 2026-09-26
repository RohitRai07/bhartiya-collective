import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { AuthSession, TwoFactorChallenge, AdminCredentials } from '../../types/auth';
import { siteConfig } from '../../config/siteConfig';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  Check, 
  Smartphone, 
  ShieldAlert, 
  RefreshCw 
} from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: (session: AuthSession) => void;
  onBackToPublicSite: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ 
  onLoginSuccess, 
  onBackToPublicSite 
}) => {
  const [currentCreds, setCurrentCreds] = useState<AdminCredentials>(authService.getAdminCredentials());
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const creds = authService.getAdminCredentials();
    setCurrentCreds(creds);
  }, []);

  const handleFillCredentials = () => {
    setEmail(currentCreds.email);
    setPassword(currentCreds.password);
    setErrorMessage(null);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.loginAdmin(email, password);

      if (result.requiresTwoFactor && result.challenge) {
        setChallenge(result.challenge);
        setStep('2fa');
        setInfoMessage(`A 6-digit verification code has been dispatched to ${result.challenge.email}.`);
      } else if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;

    if (!twoFactorCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.completeTwoFactorLogin(challenge.challengeId, twoFactorCode);
      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Invalid 2FA verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (!email) return;
    const newChallenge = authService.createTwoFactorChallenge(email);
    setChallenge(newChallenge);
    setTwoFactorCode('');
    setInfoMessage(`New verification code dispatched to ${email}.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center pt-24 pb-12 sm:px-6 lg:px-8 px-4">
      
      {/* Top Header Bar */}
      <header className="fixed top-0 inset-x-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30 shadow-md">
        <div 
          onClick={onBackToPublicSite}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="block font-serif text-sm sm:text-base font-bold text-white leading-tight">
              {siteConfig.name}
            </span>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-amber-400">
              Administrative Secretariat
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToPublicSite}
          className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Website</span>
        </button>
      </header>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-14 h-14 bg-amber-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-amber-600/30">
          {step === '2fa' ? <ShieldCheck className="w-7 h-7 text-amber-200" /> : <Lock className="w-7 h-7" />}
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {step === '2fa' ? 'Two-Factor Authentication' : 'Admin Portal Access'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {siteConfig.name} • {step === '2fa' ? 'Security Verification' : 'Internal Management'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/80 backdrop-blur-sm space-y-6">
          
          {/* STEP 1: CREDENTIALS FORM */}
          {step === 'credentials' && (
            <>
              {/* Authorized Credentials Callout */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Active Administrator Credentials:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleFillCredentials}
                    className="text-[11px] underline text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
                <div className="font-mono text-[11px] space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                  <div>Email: <strong className="text-white">{currentCreds.email}</strong></div>
                  <div>Password: <strong className="text-white">{currentCreds.password}</strong></div>
                  <div className="flex items-center space-x-1 pt-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>2FA Protection: <strong>{currentCreds.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}</strong></span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="admin@bharatcollective.org"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Continue with Sign In</span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: TWO-FACTOR AUTHENTICATION FORM */}
          {step === '2fa' && challenge && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* 2FA Dispatch Notification Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>2FA Security Challenge Active</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Enter the 6-digit verification OTP dispatched to <strong>{challenge.email}</strong>.
                </p>

                {/* Generated Code Display for effortless testing */}
                <div className="mt-2 bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 text-center">
                  <span className="text-[10px] uppercase font-semibold text-amber-400 block tracking-wider mb-1">
                    Live Dispatched OTP Code (Testing Simulator)
                  </span>
                  <div className="font-mono text-xl font-bold tracking-[0.3em] text-white">
                    {challenge.code}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">
                    (or enter master dev bypass code: <strong>123456</strong>)
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-3 text-center font-mono text-2xl tracking-[0.4em] rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-600 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length < 6}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying 2FA Code...</span>
                    </>
                  ) : (
                    <span>Verify & Access Admin Console</span>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setErrorMessage(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ← Back to credentials
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          <div className="pt-2 border-t border-slate-700 text-center">
            <button
              type="button"
              onClick={onBackToPublicSite}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
