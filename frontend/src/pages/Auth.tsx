import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, User, CreditCard, Loader2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { OTPInput } from '../components/ui/OTPInput';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import {
  isValidPhone,
  formatPhoneForAPI,
  formatPhoneDisplay,
  toPersianDigits,
  toEnglishDigits,
} from '../utils/helpers';

type Step = 'phone' | 'otp' | 'register';

// Iranian National ID validation
function isValidNationalId(code: string): boolean {
  const nationalId = toEnglishDigits(code).replace(/\D/g, '');

  if (nationalId.length !== 10) return false;

  // Check if all digits are the same
  if (/^(\d)\1{9}$/.test(nationalId)) return false;

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(nationalId[i]) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = parseInt(nationalId[9]);

  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
}

export function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'technician':
        return '/technician';
      default:
        return '/dashboard';
    }
  };

  const handleSendOTP = async () => {
    const formattedPhone = formatPhoneForAPI(phone);

    if (!isValidPhone(formattedPhone)) {
      setError('شماره موبایل نامعتبر است');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.sendOTP(formattedPhone);
      setCountdown(response.data.expiresIn || 120);
      setStep('otp');
    } catch (err: any) {
      const message = err.response?.data?.message || 'خطا در ارسال کد تایید';
      setError(message);

      // If rate limited, set countdown
      if (err.response?.data?.remainingTime) {
        setCountdown(err.response.data.remainingTime);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setOtp(code);
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP(
        formatPhoneForAPI(phone),
        code,
        name || undefined
      );

      const { accessToken, refreshToken, user, isNewUser: newUser, needsRegistration } = response.data;

      // If new user needs to complete registration
      if (needsRegistration) {
        setIsNewUser(true);
        setStep('register');
        setIsLoading(false);
        return;
      }

      login(accessToken, refreshToken, user);

      const from = (location.state as any)?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'کد تایید اشتباه است');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد کنید');
      return;
    }

    const cleanNationalId = toEnglishDigits(nationalId).replace(/\D/g, '');
    if (!cleanNationalId || !isValidNationalId(cleanNationalId)) {
      setError('کد ملی نامعتبر است');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP(
        formatPhoneForAPI(phone),
        otp,
        name.trim(),
        cleanNationalId
      );

      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, refreshToken, user);

      const from = (location.state as any)?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت‌نام');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleSendOTP();
  };

  const goBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
      setError('');
    } else if (step === 'register') {
      setStep('otp');
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-600/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard padding="lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-gold rounded-2xl flex items-center justify-center">
              <span className="text-dark-950 font-bold text-xl">اکسون</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 'phone' && 'ورود به اکسون موتور'}
              {step === 'otp' && 'تایید شماره موبایل'}
              {step === 'register' && 'تکمیل ثبت‌نام'}
            </h1>
            <p className="text-dark-400">
              {step === 'phone' && 'شماره موبایل خود را وارد کنید'}
              {step === 'otp' && <>کد تایید به <span dir="ltr" className="inline-block">{formatPhoneDisplay(phone)}</span> ارسال شد</>}
              {step === 'register' && 'لطفاً اطلاعات خود را وارد کنید'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Phone Step */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-6">
                  <Input
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    icon={<Phone className="w-5 h-5" />}
                    error={error}
                    dir="ltr"
                    className="text-center text-lg tracking-wider"
                  />

                  <Button
                    onClick={handleSendOTP}
                    isLoading={isLoading}
                    disabled={countdown > 0}
                    fullWidth
                  >
                    {countdown > 0
                      ? `ارسال مجدد (${toPersianDigits(countdown)})`
                      : 'دریافت کد تایید'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-6">
                  <OTPInput
                    length={5}
                    onComplete={handleVerifyOTP}
                    disabled={isLoading}
                    error={!!error}
                  />

                  {error && (
                    <p className="text-center text-red-400 text-sm">{error}</p>
                  )}

                  {isLoading && (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1 text-dark-400 hover:text-white transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>تغییر شماره</span>
                    </button>

                    <button
                      onClick={handleResendOTP}
                      disabled={countdown > 0}
                      className={`${
                        countdown > 0
                          ? 'text-dark-500 cursor-not-allowed'
                          : 'text-gold-500 hover:text-gold-400'
                      } transition-colors`}
                    >
                      {countdown > 0
                        ? `${toPersianDigits(countdown)} ثانیه`
                        : 'ارسال مجدد کد'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Register Step */}
            {step === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="نام و نام خانوادگی"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    icon={<User className="w-5 h-5" />}
                    autoFocus
                  />

                  <Input
                    type="text"
                    placeholder="کد ملی"
                    value={nationalId}
                    onChange={(e) => {
                      setNationalId(e.target.value);
                      setError('');
                    }}
                    icon={<CreditCard className="w-5 h-5" />}
                    dir="ltr"
                    className="text-center tracking-wider"
                  />

                  {error && (
                    <p className="text-center text-red-400 text-sm">{error}</p>
                  )}

                  <Button
                    onClick={handleRegister}
                    isLoading={isLoading}
                    fullWidth
                  >
                    تکمیل ثبت‌نام
                  </Button>

                  <button
                    onClick={goBack}
                    className="w-full text-center text-dark-400 hover:text-white transition-colors text-sm"
                  >
                    بازگشت
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <p className="text-center text-dark-500 text-xs mt-8">
            با ورود به اکسون موتور، شرایط و قوانین را می‌پذیرید
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
