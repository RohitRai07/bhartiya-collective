import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../services/authService';
import { AuthSession, TwoFactorChallenge, AdminCredentials } from '../../types/auth';
import { siteConfig } from '../../config/siteConfig';
import { apiConfig } from '../../config/apiConfig';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  Smartphone, 
  RefreshCw, 
  Clock, 
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: (session: AuthSession) => void;
  onBackToPublicSite: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ 
  onLoginSuccess, 
  onBackToPublicSite 
}) => {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Resend Countdown Timer
  const [countdown, setCountdown] = useState<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = (seconds: number = 60) => {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRemainingAttempts(null);
    setIsLocked(false);
    setIsExpired(false);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.loginAdmin(email, password);

      if (result.requiresTwoFactor && result.challenge) {
        setChallenge(result.challenge);
        setStep('2fa');
        setTwoFactorCode('');
        // Start 60-second cooldown timer
        const secondsLeft = Math.max(0, Math.ceil(((result.challenge.resendAvailableAt || Date.now()) - Date.now()) / 1000));
        startCountdown(secondsLeft > 0 ? secondsLeft : 60);
      } else if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Invalid administrator email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;

    const cleanCode = twoFactorCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.completeTwoFactorLogin(challenge.challengeId, cleanCode);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Verification failed. Please check the code.');
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        if (result.locked) {
          setIsLocked(true);
        }
        if (result.expired) {
          setIsExpired(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification service error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || !challenge) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.resendTwoFactorOtp(challenge.challengeId);
      if (result.success && result.challenge) {
        setChallenge(result.challenge);
        setTwoFactorCode('');
        setIsLocked(false);
        setIsExpired(false);
        setRemainingAttempts(null);
        setErrorMessage(null);
        startCountdown(60);
      } else {
        setErrorMessage(result.error || 'Failed to dispatch a new verification code.');
        if (result.secondsLeft) {
          startCountdown(result.secondsLeft);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Service error during code resend.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setTwoFactorCode('');
    setErrorMessage(null);
    setRemainingAttempts(null);
    setIsLocked(false);
    setIsExpired(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center pt-24 pb-12 sm:px-6 lg:px-8 px-4">
      
      {/* Top Header Bar */}
      <header className="fixed top-0 inset-x-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30 shadow-md">
        <div 
          onClick={onBackToPublicSite}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
            <img src={siteConfig.emblemUrl} alt="Emblem" className="w-full h-full object-contain" />
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
        <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center p-1.5 shadow-xl shadow-amber-600/20 border border-slate-700 overflow-hidden">
          <img src={siteConfig.emblemUrl} alt={siteConfig.name} className="w-full h-full object-contain" />
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {step === '2fa' ? 'Two-Factor Authentication' : 'Admin Portal Access'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {step === '2fa' ? 'Production Security Verification' : 'Secured Administrative Gateway'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/80 backdrop-blur-sm space-y-6">
          
          {/* STEP 1: CREDENTIALS FORM */}
          {step === 'credentials' && (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
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
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Mandatory 2FA code will be required upon credential validation.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Credentials...</span>
                    </>
                  ) : (
                    <span>Continue with Sign In</span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: TWO-FACTOR AUTHENTICATION VERIFICATION FORM */}
          {step === '2fa' && challenge && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Notification Banner with Masked Recipient */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5 text-center">
                <div className="inline-flex items-center space-x-1.5 text-amber-400 font-bold mb-0.5">
                  <Smartphone className="w-4 h-4" />
                  <span>Verification Code Dispatched</span>
                </div>
                <p className="text-[12px] text-slate-300">
                  A verification code has been sent to:
                </p>
                <div className="font-mono text-sm font-bold text-white tracking-wider bg-slate-900/80 py-1 px-3 rounded-lg border border-amber-500/20 inline-block">
                  {challenge.maskedRecipient || '******'}
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Valid for 5 minutes • Single-use security token
                </p>
                {!apiConfig.isRealOtpProviderConfigured && (
                  <div className="pt-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Testing Mode: Use temporary OTP <strong className="ml-1.5 font-mono tracking-widest text-white">111111</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Error Banners */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div>{errorMessage}</div>
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <div className="text-[11px] text-red-400 font-semibold">
                        Remaining attempts: {remainingAttempts} / 5
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isExpired && !isLocked && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>This verification code has expired. Please request a new code.</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading || countdown > 0}
                      className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>
                        {loading 
                          ? 'Generating New OTP...' 
                          : countdown > 0 
                            ? `Request New OTP (${countdown}s)` 
                            : 'Request New OTP'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {isLocked && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-semibold text-rose-200 text-sm">
                        Maximum verification attempts exceeded.
                      </div>
                      <p className="text-rose-300/90 text-xs">
                        This verification code has been locked for security. You can request a fresh verification code to proceed.
                      </p>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading || countdown > 0}
                      className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>
                        {loading 
                          ? 'Generating New OTP...' 
                          : countdown > 0 
                            ? `Request New OTP (${countdown}s)` 
                            : 'Request New OTP'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 text-center">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    disabled={loading || isLocked}
                    placeholder="• • • • • •"
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-3.5 text-center font-mono text-2xl tracking-[0.45em] rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-600 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6 || isLocked}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Security Token...</span>
                    </>
                  ) : (
                    <span>Verify</span>
                  )}
                </button>

                {/* Resend and Back Controls */}
                <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={countdown > 0 || loading}
                    className={`font-semibold flex items-center space-x-1.5 cursor-pointer ${
                      countdown > 0 
                        ? 'text-slate-500 cursor-not-allowed' 
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>
                      {countdown > 0 
                        ? `Resend OTP in ${countdown}s` 
                        : isLocked ? 'Request New OTP' : 'Resend OTP'}
                    </span>
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
